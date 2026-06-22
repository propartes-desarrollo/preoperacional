import pool from '../db.js';
import { todayInBogota, addDaysToDateStr } from '../utils/dateHelpers.js';
import { isBusinessDay } from './businessDayService.js';
import { getFirstBusinessMondayOfWeek, getPreviousBusinessDay } from './businessDayService.js';
import { getSaturdayOfWeek } from '../utils/dateHelpers.js';

export async function getSetting(key, fallback = '') {
  const { rows } = await pool.query(
    'SELECT value FROM app_settings WHERE key = $1',
    [key]
  );
  return rows[0]?.value ?? fallback;
}

export async function getAlertThreshold() {
  return parseInt(await getSetting('whatsapp_alert_threshold', '6'), 10);
}

async function countBusinessDaysSince(lastDateStr, todayStr) {
  const start = lastDateStr || addDaysToDateStr(todayStr, -90);
  let count = 0;
  let d = addDaysToDateStr(start, 1);
  while (d <= todayStr) {
    if (await isBusinessDay(d)) count++;
    d = addDaysToDateStr(d, 1);
    if (count > 90) break;
  }
  return count;
}

export async function getInactivityAlerts(threshold) {
  const today = todayInBogota();

  const { rows: collaborators } = await pool.query(
    `SELECT c.id, c.cedula, c.first_name, c.last_name,
            array_agg(DISTINCT cv.plate) AS plates,
            (
              SELECT to_char(MAX(i.inspection_date), 'YYYY-MM-DD')
              FROM inspections i
              WHERE i.collaborator_id = c.id
            ) AS last_inspection_date
     FROM collaborators c
     JOIN collaborator_vehicles cv ON cv.collaborator_id = c.id
     JOIN collaborator_types ct ON ct.id = c.collaborator_type_id
     WHERE c.is_active = true AND ct.requires_inspection = true
     GROUP BY c.id, c.cedula, c.first_name, c.last_name`
  );

  const alerts = [];
  for (const col of collaborators) {
    const days = await countBusinessDaysSince(col.last_inspection_date, today);
    if (days >= threshold) {
      alerts.push({
        collaborator_id: col.id,
        cedula: col.cedula,
        name: `${col.first_name} ${col.last_name}`,
        plates: col.plates,
        business_days_without_inspection: days,
        last_inspection_date: col.last_inspection_date || null,
      });
    }
  }

  alerts.sort((a, b) => b.business_days_without_inspection - a.business_days_without_inspection);
  return alerts;
}

export async function getPhotoPendingAlerts() {
  const today = todayInBogota();
  const photoDayStr = await getFirstBusinessMondayOfWeek(today);

  if (today <= photoDayStr) return [];

  const saturdayOfWeek = getSaturdayOfWeek(today);

  const { rows } = await pool.query(
    `SELECT c.id AS collaborator_id, c.cedula,
            c.first_name || ' ' || c.last_name AS name,
            cv.plate
     FROM collaborators c
     JOIN collaborator_vehicles cv ON cv.collaborator_id = c.id
     JOIN collaborator_types ct ON ct.id = c.collaborator_type_id
     WHERE c.is_active = true AND ct.requires_inspection = true
       AND NOT EXISTS (
         SELECT 1 FROM inspections i
         JOIN inspection_photos ip ON ip.inspection_id = i.id
         WHERE i.collaborator_id = c.id
           AND i.plate = cv.plate
           AND i.inspection_date BETWEEN $1 AND $2
       )
     ORDER BY c.last_name, c.first_name`,
    [photoDayStr, saturdayOfWeek]
  );

  const photoDay = new Date(photoDayStr + 'T12:00:00Z');
  const todayDate = new Date(today + 'T12:00:00Z');
  const daysSince = Math.round((todayDate - photoDay) / 86400000);

  return rows.map((r) => ({ ...r, days_since_photo_day: daysSince }));
}
