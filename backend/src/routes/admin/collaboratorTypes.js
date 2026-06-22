import { Router } from 'express';
import pool from '../../db.js';

const router = Router();

/**
 * @openapi
 * /admin/collaborator-types:
 *   get:
 *     summary: Listar tipos de usuario
 *     tags: [admin-collaborator-types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.uses_company_vehicles, t.receives_reminder, t.is_active, t.display_order,
              (SELECT COUNT(*)::int FROM collaborators c WHERE c.collaborator_type_id = t.id) AS collaborators_count
       FROM collaborator_types t
       ORDER BY t.display_order, t.name`
    );
    res.json({ types: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborator-types:
 *   post:
 *     summary: Crear tipo de usuario
 *     tags: [admin-collaborator-types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, uses_company_vehicles, receives_reminder, display_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido', code: 400 });
    }

    const { rows: [{ max_order }] } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM collaborator_types'
    );

    const { rows } = await pool.query(
      `INSERT INTO collaborator_types (name, uses_company_vehicles, receives_reminder, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), uses_company_vehicles ?? false, receives_reminder ?? false, display_order ?? max_order + 1]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un tipo con ese nombre', code: 409 });
    }
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborator-types/{id}:
 *   put:
 *     summary: Actualizar tipo de usuario
 *     tags: [admin-collaborator-types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizado
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, uses_company_vehicles, receives_reminder, is_active, display_order } = req.body;
    const { rows } = await pool.query(
      `UPDATE collaborator_types SET
        name = COALESCE($1, name),
        uses_company_vehicles = COALESCE($2, uses_company_vehicles),
        receives_reminder = COALESCE($3, receives_reminder),
        is_active = COALESCE($4, is_active),
        display_order = COALESCE($5, display_order)
       WHERE id = $6 RETURNING *`,
      [name?.trim() ?? null, uses_company_vehicles, receives_reminder, is_active, display_order, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado', code: 404 });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un tipo con ese nombre', code: 409 });
    }
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborator-types/{id}:
 *   delete:
 *     summary: Eliminar tipo de usuario (si no tiene colaboradores asociados)
 *     tags: [admin-collaborator-types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM collaborators WHERE collaborator_type_id = $1',
      [req.params.id]
    );
    if (count > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: tiene colaboradores asociados. Desactivelo en su lugar.', code: 409 });
    }
    const { rowCount } = await pool.query('DELETE FROM collaborator_types WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'No encontrado', code: 404 });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
