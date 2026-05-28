import { Router } from 'express';
import pool from '../../db.js';
import { todayInBogota, addDaysToDateStr } from '../../utils/dateHelpers.js';
import { isBusinessDay } from '../../services/businessDayService.js';
import { getFirstBusinessMondayOfWeek } from '../../services/businessDayService.js';
import { getAlertThreshold, getInactivityAlerts } from '../../services/alertService.js';

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

    const [isBizDay, photoDayStr, threshold] = await Promise.all([
      isBusinessDay(today),
      getFirstBusinessMondayOfWeek(today),
      getAlertThreshold(),
    ]);

    const [
      { rows: [{ inspections_today }] },
      { rows: [{ active_total }] },
      { rows: [{ active_with_inspection }] },
      { rows: missing },
      { rows: last7 },
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS inspections_today FROM inspections WHERE inspection_date = $1", [today]),
      pool.query("SELECT COUNT(*)::int AS active_total FROM collaborators WHERE is_active = true"),
      pool.query(
        `SELECT COUNT(DISTINCT i.collaborator_id)::int AS active_with_inspection
         FROM inspections i JOIN collaborators c ON c.id = i.collaborator_id
         WHERE i.inspection_date = $1 AND c.is_active = true`,
        [today]
      ),
      pool.query(
        `SELECT c.id AS collaborator_id, c.cedula,
                c.first_name || ' ' || c.last_name AS name,
                cv.plate
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

    // Count active alerts (capped computation for dashboard performance)
    const alerts = await getInactivityAlerts(threshold);

    res.json({
      today,
      is_business_day: isBizDay,
      is_photo_day: today === photoDayStr,
      inspections_today,
      active_collaborators_total: active_total,
      active_collaborators_with_inspection_today: active_with_inspection,
      missing_today: missing,
      alerts_active: alerts.length,
      photos_pending_alerts: 0,
      inspections_last_7_days: last7,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
