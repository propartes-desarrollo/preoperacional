import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * @openapi
 * /sections:
 *   get:
 *     summary: Secciones y preguntas activas para un tipo de vehiculo
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
 *         description: Secciones con sus preguntas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sections:
 *                   type: array
 *       400:
 *         description: Parametro vehicle_type invalido
 */
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_type } = req.query;
    if (!['auto', 'moto'].includes(vehicle_type)) {
      return res.status(400).json({ error: 'vehicle_type debe ser auto o moto', code: 400 });
    }

    const { rows: sectionRows } = await pool.query(
      `SELECT id, name, display_order
       FROM sections
       WHERE vehicle_type = $1 AND is_active = true
       ORDER BY display_order`,
      [vehicle_type]
    );

    if (sectionRows.length === 0) {
      return res.json({ sections: [] });
    }

    const sectionIds = sectionRows.map((s) => s.id);
    const { rows: questionRows } = await pool.query(
      `SELECT id, section_id, text, is_other, display_order
       FROM questions
       WHERE section_id = ANY($1) AND is_active = true
       ORDER BY section_id, display_order`,
      [sectionIds]
    );

    const questionsBySection = {};
    for (const q of questionRows) {
      if (!questionsBySection[q.section_id]) questionsBySection[q.section_id] = [];
      questionsBySection[q.section_id].push({
        id: q.id,
        text: q.text,
        is_other: q.is_other,
        display_order: q.display_order,
      });
    }

    const sections = sectionRows.map((s) => ({
      id: s.id,
      name: s.name,
      display_order: s.display_order,
      questions: questionsBySection[s.id] || [],
    }));

    res.json({ sections });
  } catch (err) {
    next(err);
  }
});

export default router;
