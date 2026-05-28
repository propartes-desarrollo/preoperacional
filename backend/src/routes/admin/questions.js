import { Router } from 'express';
import pool from '../../db.js';

const router = Router();

/**
 * @openapi
 * /admin/questions:
 *   post:
 *     summary: Crear pregunta
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creada
 */
router.post('/', async (req, res, next) => {
  try {
    const { section_id, text, is_other, display_order } = req.body;
    if (!section_id || !text) {
      return res.status(400).json({ error: 'section_id y text son requeridos', code: 400 });
    }

    const { rows: [section] } = await pool.query('SELECT id FROM sections WHERE id = $1', [section_id]);
    if (!section) return res.status(404).json({ error: 'Seccion no encontrada', code: 404 });

    const { rows: [{ max_order }] } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM questions WHERE section_id = $1',
      [section_id]
    );
    const order = display_order ?? max_order + 1;

    const { rows } = await pool.query(
      `INSERT INTO questions (section_id, text, is_other, display_order) VALUES ($1, $2, $3, $4) RETURNING *`,
      [section_id, text, is_other ?? false, order]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/questions/{id}:
 *   put:
 *     summary: Actualizar pregunta
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizada
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { text, is_other, display_order, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE questions SET
        text = COALESCE($1, text),
        is_other = COALESCE($2, is_other),
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
      [text, is_other, display_order, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrada', code: 404 });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/questions/{id}:
 *   delete:
 *     summary: Eliminar pregunta (soft o hard delete)
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Eliminada
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: [q] } = await pool.query('SELECT id FROM questions WHERE id = $1', [req.params.id]);
    if (!q) return res.status(404).json({ error: 'No encontrada', code: 404 });

    if (req.query.hard === 'true') {
      const { rows: [{ count }] } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM inspection_answers WHERE question_id = $1',
        [req.params.id]
      );
      if (count > 0) {
        return res.status(409).json({ error: 'No se puede eliminar: tiene respuestas asociadas', code: 409 });
      }
      await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE questions SET is_active = false WHERE id = $1', [req.params.id]);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/questions/reorder:
 *   post:
 *     summary: Reordenar preguntas dentro de una seccion
 *     tags: [admin-sections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reordenadas
 */
router.post('/reorder', async (req, res, next) => {
  try {
    const { section_id, question_ids } = req.body;
    if (!section_id || !Array.isArray(question_ids)) {
      return res.status(400).json({ error: 'section_id y question_ids son requeridos', code: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < question_ids.length; i++) {
        await client.query(
          'UPDATE questions SET display_order = $1 WHERE id = $2 AND section_id = $3',
          [i + 1, question_ids[i], section_id]
        );
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
