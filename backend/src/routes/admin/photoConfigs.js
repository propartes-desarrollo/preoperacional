import { Router } from 'express';
import pool from '../../db.js';

const router = Router();

/**
 * @openapi
 * /admin/photo-configs:
 *   get:
 *     summary: Listar configuraciones de fotos agrupadas por tipo de vehiculo
 *     tags: [admin-photo-configs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuraciones de fotos
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, vehicle_type, label, is_required, display_order, is_active FROM photo_configs ORDER BY vehicle_type, display_order'
    );
    const grouped = { auto: [], moto: [] };
    for (const r of rows) {
      if (grouped[r.vehicle_type]) grouped[r.vehicle_type].push(r);
    }
    res.json({ photo_configs: grouped });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/photo-configs:
 *   post:
 *     summary: Crear configuracion de foto
 *     tags: [admin-photo-configs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_type, label, is_required, display_order } = req.body;
    if (!vehicle_type || !label) {
      return res.status(400).json({ error: 'vehicle_type y label son requeridos', code: 400 });
    }
    if (!['auto', 'moto'].includes(vehicle_type)) {
      return res.status(400).json({ error: 'vehicle_type debe ser auto o moto', code: 400 });
    }

    const { rows: [{ max_order }] } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM photo_configs WHERE vehicle_type = $1',
      [vehicle_type]
    );
    const order = display_order ?? max_order + 1;

    const { rows } = await pool.query(
      `INSERT INTO photo_configs (vehicle_type, label, is_required, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vehicle_type, label, is_required ?? false, order]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/photo-configs/{id}:
 *   put:
 *     summary: Actualizar configuracion de foto
 *     tags: [admin-photo-configs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizado
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { label, is_required, display_order, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE photo_configs SET
        label = COALESCE($1, label),
        is_required = COALESCE($2, is_required),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
      [label, is_required, display_order, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado', code: 404 });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/photo-configs/{id}:
 *   delete:
 *     summary: Eliminar configuracion de foto (soft delete)
 *     tags: [admin-photo-configs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: [r] } = await pool.query('SELECT id FROM photo_configs WHERE id = $1', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'No encontrado', code: 404 });

    await pool.query('UPDATE photo_configs SET is_active = false WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
