import { Router } from 'express';
import pool from '../db.js';
import { generateToken, generateJWT } from '../services/authService.js';
import { sendMagicLinkEmail } from '../services/emailService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import logger from '../utils/logger.js';

const router = Router();

const GENERIC_OK = 'Si el email esta registrado, recibiras un enlace para iniciar sesion.';
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX = 3;
const TOKEN_EXPIRY_MINUTES = 15;

/**
 * @openapi
 * /auth/magic-link:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Solicitar magic link de acceso al panel de administracion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@empresa.com
 *     responses:
 *       200:
 *         description: Respuesta generica (el mismo mensaje independientemente de si el email existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Email invalido o ausente
 *       429:
 *         description: Demasiadas solicitudes de magic link en poco tiempo
 */
router.post('/magic-link', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'El campo email es requerido', code: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Formato de email invalido', code: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { rows: userRows } = await pool.query(
    'SELECT id, name, email FROM admin_users WHERE email = $1 AND is_active = true',
    [normalizedEmail]
  );

  if (userRows.length === 0) {
    return res.status(200).json({ message: GENERIC_OK });
  }

  const user = userRows[0];

  const { rows: rateRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM magic_link_tokens
     WHERE admin_user_id = $1
       AND created_at > NOW() - INTERVAL '${RATE_LIMIT_WINDOW_MINUTES} minutes'`,
    [user.id]
  );
  if (rateRows[0].count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: `Demasiadas solicitudes. Espera ${RATE_LIMIT_WINDOW_MINUTES} minutos antes de intentar de nuevo.`,
      code: 429,
    });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    'INSERT INTO magic_link_tokens (admin_user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expiresAt]
  );

  const link = `${process.env.APP_URL}/admin/verify?token=${token}`;

  try {
    await sendMagicLinkEmail({ name: user.name, email: user.email, link });
  } catch (err) {
    logger.error({ component: 'auth' }, `Error enviando magic link email: ${err.message}`);
  }

  res.status(200).json({ message: GENERIC_OK });
});

/**
 * @openapi
 * /auth/verify:
 *   post:
 *     tags: [Autenticacion]
 *     summary: Verificar token del magic link y obtener JWT de sesion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: a3f8c1d2e4b5...
 *     responses:
 *       200:
 *         description: Token valido - retorna JWT y datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT de sesion
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Token invalido, expirado o ya utilizado
 */
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'El campo token es requerido', code: 400 });
  }

  const { rows: tokenRows } = await pool.query(
    'SELECT id, admin_user_id, expires_at, used_at FROM magic_link_tokens WHERE token = $1',
    [token.trim()]
  );

  if (tokenRows.length === 0) {
    return res.status(401).json({ error: 'Token invalido', code: 401 });
  }

  const record = tokenRows[0];

  if (record.used_at !== null) {
    return res.status(401).json({ error: 'Token ya utilizado', code: 401 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Token expirado', code: 401 });
  }

  await pool.query(
    'UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1',
    [record.id]
  );

  const { rows: userRows } = await pool.query(
    'SELECT id, email, name, role, is_active FROM admin_users WHERE id = $1',
    [record.admin_user_id]
  );

  const user = userRows[0];

  if (!user.is_active) {
    return res.status(401).json({ error: 'Usuario inactivo', code: 401 });
  }

  const jwt = generateJWT(user);

  res.status(200).json({
    token: jwt,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Autenticacion]
 *     summary: Obtener datos del administrador autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: No autenticado o token invalido
 */
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;
