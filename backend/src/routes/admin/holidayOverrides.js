import { Router } from 'express';
import pool from '../../db.js';
import { requireSuperadmin } from '../../middleware/requireSuperadmin.js';
import { invalidateHolidayCache } from '../../services/holidayService.js';

const router = Router();
router.use(requireSuperadmin);

/**
 * @openapi
 * /admin/holiday-overrides:
 *   get:
 *     summary: Listar overrides de festivos
 *     tags: [admin-holidays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de overrides
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, to_char(date, 'YYYY-MM-DD') AS date, action, description, created_at
       FROM holiday_overrides ORDER BY date`
    );
    res.json({ overrides: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/holiday-overrides:
 *   post:
 *     summary: Crear override de festivo
 *     tags: [admin-holidays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Override creado
 */
router.post('/', async (req, res, next) => {
  try {
    const { date, action, description } = req.body;
    if (!date || !action) {
      return res.status(400).json({ error: 'date y action son requeridos', code: 400 });
    }
    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'action debe ser add o remove', code: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date debe tener formato YYYY-MM-DD', code: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO holiday_overrides (date, action, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO UPDATE SET action = $2, description = $3
       RETURNING id, to_char(date, 'YYYY-MM-DD') AS date, action, description`,
      [date, action, description || null]
    );
    invalidateHolidayCache(date.substring(0, 4));
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/holiday-overrides/{id}:
 *   delete:
 *     summary: Eliminar override de festivo
 *     tags: [admin-holidays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM holiday_overrides WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Override no encontrado', code: 404 });
    invalidateHolidayCache();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
