import pool from '../db.js';
import { todayInBogota, getSaturdayOfWeek } from '../utils/dateHelpers.js';
import { getFirstBusinessMondayOfWeek } from './businessDayService.js';

export async function getPhotoStatus(collaboratorId, plate) {
  const today = todayInBogota();

  const { rows: prevRows } = await pool.query(
    'SELECT id FROM inspections WHERE collaborator_id = $1 AND plate = $2 LIMIT 1',
    [collaboratorId, plate]
  );
  const isFirstTime = prevRows.length === 0;

  const photoDayStr = await getFirstBusinessMondayOfWeek(today);
  const saturdayOfWeek = getSaturdayOfWeek(today);

  const isPhotoDayToday = today === photoDayStr;
  const isAfterPhotoDay = today > photoDayStr;

  let hasPhotosThisWeek = false;
  if (!isFirstTime && (isPhotoDayToday || isAfterPhotoDay)) {
    const { rows: photoRows } = await pool.query(
      `SELECT i.id FROM inspections i
       JOIN inspection_photos p ON p.inspection_id = i.id
       WHERE i.collaborator_id = $1 AND i.plate = $2
         AND i.inspection_date BETWEEN $3 AND $4
       LIMIT 1`,
      [collaboratorId, plate, photoDayStr, saturdayOfWeek]
    );
    hasPhotosThisWeek = photoRows.length > 0;
  }

  const photosPendingFromPreviousDays = isAfterPhotoDay && !isFirstTime && !hasPhotosThisWeek;
  const photosRequired = isFirstTime || isPhotoDayToday || photosPendingFromPreviousDays;

  return {
    photos_required: photosRequired,
    photos_pending_from_previous_days: photosPendingFromPreviousDays,
    is_first_registration: isFirstTime,
    photo_day_this_week: photoDayStr,
  };
}
