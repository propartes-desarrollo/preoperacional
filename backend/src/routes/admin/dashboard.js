import { Router } from 'express';
import pool from '../../db.js';
import { todayInBogota, addDaysToDateStr } from '../../utils/dateHelpers.js';
import { isBusinessDay, getFirstBusinessMondayOfWeek } from '../../services/businessDayService.js';

const router = Router();

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     summary: Resumen del dia actual
 *     tags: [admin-dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del dashboard
 */
router.get('/', async (req, res, next) => {
  try {
    const today = todayInBogota();

    const [isBizDay, photoDayStr] = await Promise.all([
      isBusinessDay(today),
      getFirstBusinessMondayOfWeek(today),
    ]);

    const [
      { rows: inspFreq },
      { rows: activeFreq },
      { rows: missing },
      { rows: last7 },
    ] = await Promise.all([
      pool.query(
        `SELECT c.inspection_frequency, COUNT(*)::int AS count
         FROM inspections i
         JOIN collaborators c ON c.id = i.collaborator_id
         WHERE i.inspection_date = $1 AND c.is_active = true
         GROUP BY c.inspection_frequency`,
        [today]
      ),
      pool.query(
        `SELECT inspection_frequency, COUNT(*)::int AS count
         FROM collaborators WHERE is_active = true
         GROUP BY inspection_frequency`
      ),
      pool.query(
        `SELECT c.id AS collaborator_id, c.cedula,
                c.first_name || ' ' || c.last_name AS name,
                cv.plate,
                c.inspection_frequency
         FROM collaborators c
         JOIN collaborator_vehicles cv ON cv.collaborator_id = c.id
         WHERE c.is_active = true
           AND NOT EXISTS (
             SELECT 1 FROM inspections i
             WHERE i.collaborator_id = c.id AND i.plate = cv.plate AND i.inspection_date = $1
           )
         ORDER BY c.last_name, c.first_name`,
        [today]
      ),
      pool.query(
        `SELECT to_char(inspection_date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
         FROM inspections WHERE inspection_date BETWEEN $1 AND $2
         GROUP BY inspection_date ORDER BY inspection_date`,
        [addDaysToDateStr(today, -6), today]
      ),
    ]);

    const toFreqMap = (rows) => Object.fromEntries(rows.map((r) => [r.inspection_frequency, r.count]));

    const inspMap = toFreqMap(inspFreq);
    const activeMap = toFreqMap(activeFreq);

    res.json({
      today,
      is_business_day: isBizDay,
      is_photo_day: today === photoDayStr,
      inspections_today: Object.values(inspMap).reduce((s, n) => s + n, 0),
      inspections_today_daily: inspMap.daily ?? 0,
      inspections_today_eventual: inspMap.eventual ?? 0,
      active_collaborators_total: Object.values(activeMap).reduce((s, n) => s + n, 0),
      active_collaborators_daily: activeMap.daily ?? 0,
      active_collaborators_eventual: activeMap.eventual ?? 0,
      missing_today: missing,
      inspections_last_7_days: last7,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
