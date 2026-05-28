import { Router } from 'express';
import { getEffectiveHolidays } from '../services/holidayService.js';

const router = Router();

/**
 * @openapi
 * /holidays:
 *   get:
 *     summary: Festivos colombianos para un ano dado
 *     tags: [Publico]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *     responses:
 *       200:
 *         description: Lista de festivos del ano
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 holidays:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *       400:
 *         description: Parametro year invalido
 */
router.get('/', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Parametro year invalido. Debe ser un entero entre 2000 y 2100.', code: 400 });
    }

    const holidays = await getEffectiveHolidays(year);
    res.json({ year, holidays });
  } catch (err) {
    next(err);
  }
});

export default router;
