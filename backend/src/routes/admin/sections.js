import { Router } from 'express';
import pool from '../../db.js';

const router = Router();

/**
 * @openapi
 * /admin/sections:
 *   get:
 *     summary: Listar secciones con preguntas anidadas
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secciones agrupadas por vehicle_type
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows: sections } = await pool.query(
      'SELECT id, vehicle_type, name, display_order, is_active FROM sections ORDER BY vehicle_type, display_order'
    );
    const { rows: questions } = await pool.query(
      'SELECT id, section_id, text, is_other, display_order, is_active FROM questions ORDER BY section_id, display_order'
    );

    const qBySection = {};
    for (const q of questions) {
      if (!qBySection[q.section_id]) qBySection[q.section_id] = [];
      qBySection[q.section_id].push(q);
    }

    const result = sections.map((s) => ({ ...s, questions: qBySection[s.id] || [] }));
    res.json({ sections: result });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/sections:
 *   post:
 *     summary: Crear seccion
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creada
 */
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_type, name, display_order } = req.body;
    if (!vehicle_type || !name) {
      return res.status(400).json({ error: 'vehicle_type y name son requeridos', code: 400 });
    }
    if (!['auto', 'moto'].includes(vehicle_type)) {
      return res.status(400).json({ error: 'vehicle_type debe ser auto o moto', code: 400 });
    }

    const { rows: [{ max_order }] } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM sections WHERE vehicle_type = $1',
      [vehicle_type]
    );
    const order = display_order ?? max_order + 1;

    const { rows } = await pool.query(
      `INSERT INTO sections (vehicle_type, name, display_order) VALUES ($1, $2, $3) RETURNING *`,
      [vehicle_type, name, order]
    );
    res.status(201).json({ ...rows[0], questions: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/sections/{id}:
 *   put:
 *     summary: Actualizar seccion
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizada
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, display_order, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE sections SET
        name = COALESCE($1, name),
        display_order = COALESCE($2, display_order),
        is_active = COALESCE($3, is_active)
       WHERE id = $4 RETURNING *`,
      [name, display_order, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrada', code: 404 });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/sections/{id}:
 *   delete:
 *     summary: Eliminar seccion (soft o hard delete)
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Eliminada
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: [s] } = await pool.query('SELECT id FROM sections WHERE id = $1', [req.params.id]);
    if (!s) return res.status(404).json({ error: 'No encontrada', code: 404 });

    if (req.query.hard === 'true') {
      const { rows: [{ count }] } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM inspection_answers ia
         JOIN questions q ON q.id = ia.question_id WHERE q.section_id = $1`,
        [req.params.id]
      );
      if (count > 0) {
        return res.status(409).json({ error: 'No se puede eliminar: tiene respuestas asociadas', code: 409 });
      }
      await pool.query('DELETE FROM sections WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE sections SET is_active = false WHERE id = $1', [req.params.id]);
      await pool.query('UPDATE questions SET is_active = false WHERE section_id = $1', [req.params.id]);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/sections/{id}/reorder:
 *   post:
 *     summary: Reordenar secciones del mismo vehicle_type
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reordenadas
 */
router.post('/:id/reorder', async (req, res, next) => {
  try {
    const { section_ids } = req.body;
    if (!Array.isArray(section_ids)) {
      return res.status(400).json({ error: 'section_ids debe ser un array', code: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < section_ids.length; i++) {
        await client.query('UPDATE sections SET display_order = $1 WHERE id = $2', [i + 1, section_ids[i]]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Reordenadas correctamente' });
  } catch (err) {
    next(err);
  }
});

export default router;
