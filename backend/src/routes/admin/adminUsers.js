import { Router } from 'express';
import pool from '../../db.js';
import { requireSuperadmin } from '../../middleware/requireSuperadmin.js';

const router = Router();
router.use(requireSuperadmin);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Listar administradores (solo superadmin)
 *     tags: [admin-users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de admins
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, is_active, created_at FROM admin_users ORDER BY created_at'
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/users:
 *   post:
 *     summary: Crear administrador (solo superadmin)
 *     tags: [admin-users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'email, name y role son requeridos', code: 400 });
    }
    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser admin o superadmin', code: 400 });
    }

    const { rows: existing } = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya esta registrado', code: 409 });
    }

    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, name, role, is_active)
       VALUES ($1, $2, $3, true) RETURNING id, email, name, role, is_active`,
      [email, name, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   put:
 *     summary: Actualizar administrador (solo superadmin)
 *     tags: [admin-users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizado
 */
router.put('/:id', async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { name, role, is_active } = req.body;

    const { rows: [target] } = await pool.query(
      'SELECT id, role FROM admin_users WHERE id = $1',
      [targetId]
    );
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado', code: 404 });

    // Un admin no puede cambiar su propio rol
    if (role && targetId === req.user.id) {
      return res.status(403).json({ error: 'No puedes cambiar tu propio rol', code: 403 });
    }

    // No se puede cambiar el rol del unico superadmin
    if (role && role !== 'superadmin' && target.role === 'superadmin') {
      const { rows: [{ count }] } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM admin_users WHERE role = 'superadmin' AND is_active = true"
      );
      if (count <= 1) {
        return res.status(400).json({ error: 'No se puede degradar al unico superadmin', code: 400 });
      }
    }

    const { rows } = await pool.query(
      `UPDATE admin_users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active)
       WHERE id = $4 RETURNING id, email, name, role, is_active`,
      [name, role, is_active, targetId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     summary: Eliminar administrador (solo superadmin)
 *     tags: [admin-users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo', code: 400 });
    }

    const { rows: [target] } = await pool.query('SELECT role FROM admin_users WHERE id = $1', [targetId]);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado', code: 404 });

    if (target.role === 'superadmin') {
      const { rows: [{ count }] } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM admin_users WHERE role = 'superadmin' AND is_active = true"
      );
      if (count <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar el unico superadmin', code: 400 });
      }
    }

    await pool.query('DELETE FROM admin_users WHERE id = $1', [targetId]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
