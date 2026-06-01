import { Router } from 'express';
import pool from '../../db.js';

const router = Router();

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const SETTING_VALIDATORS = {
  whatsapp_alert_threshold: (v) => {
    const n = parseInt(v, 10);
    return isNaN(n) || n < 1 || n > 365
      ? 'whatsapp_alert_threshold debe ser un entero entre 1 y 365'
      : null;
  },
  whatsapp_reminder_time: (v) =>
    TIME_REGEX.test(v) ? null : 'whatsapp_reminder_time debe tener formato HH:MM (ej: 07:55)',
};

const VALID_KEYS = new Set(Object.keys(SETTING_VALIDATORS));

/**
 * @openapi
 * /admin/settings:
 *   get:
 *     summary: Obtener todos los settings de la aplicacion
 *     tags: [admin-settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de settings
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT key, value, updated_at FROM app_settings ORDER BY key');
    res.json({ settings: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/settings:
 *   put:
 *     summary: Actualizar uno o varios settings
 *     tags: [admin-settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: Settings actualizados
 */
router.put('/', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de settings', code: 400 });
    }

    const errors = [];
    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        errors.push(`Setting invalido: ${JSON.stringify(s)}`);
        continue;
      }
      if (!VALID_KEYS.has(s.key)) {
        errors.push(`Clave no permitida: ${s.key}`);
        continue;
      }
      const msg = SETTING_VALIDATORS[s.key]?.(s.value);
      if (msg) errors.push(msg);
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('. '), code: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const s of settings) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [s.key, String(s.value)]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const { rows } = await pool.query('SELECT key, value, updated_at FROM app_settings ORDER BY key');
    res.json({ settings: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
