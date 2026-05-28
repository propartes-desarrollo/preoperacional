import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * @openapi
 * /photo-config:
 *   get:
 *     summary: Configuracion de fotos requeridas para un tipo de vehiculo
 *     tags: [Publico]
 *     parameters:
 *       - in: query
 *         name: vehicle_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [auto, moto]
 *     responses:
 *       200:
 *         description: Lista de configuraciones de fotos
 *       400:
 *         description: Parametro vehicle_type invalido
 */
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_type } = req.query;
    if (!['auto', 'moto'].includes(vehicle_type)) {
      return res.status(400).json({ error: 'vehicle_type debe ser auto o moto', code: 400 });
    }

    const { rows } = await pool.query(
      `SELECT id, label, is_required, display_order
       FROM photo_configs
       WHERE vehicle_type = $1 AND is_active = true
       ORDER BY display_order`,
      [vehicle_type]
    );

    res.json({ photo_config: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
