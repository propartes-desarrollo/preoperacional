import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * @openapi
 * /collaborator-lookup:
 *   get:
 *     summary: Buscar colaborador por cedula (publico, para el formulario PWA)
 *     tags: [Publico]
 *     parameters:
 *       - in: query
 *         name: cedula
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos basicos del colaborador y placas asignadas si aplica
 */
router.get('/', async (req, res, next) => {
  try {
    const cedula = (req.query.cedula || '').trim();
    if (!/^\d{5,15}$/.test(cedula)) {
      return res.status(400).json({ error: 'Cedula invalida', code: 400 });
    }

    const { rows } = await pool.query(
      `SELECT c.first_name, c.last_name,
              COALESCE(ct.uses_company_vehicles, false) AS uses_company_vehicles,
              (
                SELECT json_agg(json_build_object('plate', cv.plate, 'vehicle_type', cv.vehicle_type) ORDER BY cv.plate)
                FROM collaborator_vehicles cv WHERE cv.collaborator_id = c.id
              ) AS vehicles
       FROM collaborators c
       LEFT JOIN collaborator_types ct ON ct.id = c.collaborator_type_id
       WHERE c.cedula = $1 AND c.is_active = true`,
      [cedula]
    );

    if (rows.length === 0) {
      return res.json({ exists: false });
    }

    const row = rows[0];
    res.json({
      exists: true,
      first_name: row.first_name,
      last_name: row.last_name,
      uses_company_vehicles: row.uses_company_vehicles,
      vehicles: row.vehicles || [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
