import { formatInTimeZone } from 'date-fns-tz';

export const BOGOTA_TZ = 'America/Bogota';

export function todayInBogota() {
  return formatInTimeZone(new Date(), BOGOTA_TZ, 'yyyy-MM-dd');
}

export function nowInBogota() {
  return formatInTimeZone(new Date(), BOGOTA_TZ, "yyyy-MM-dd'T'HH:mm:ss");
}

export function addDaysToDateStr(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

export function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay();
}

export function getMondayOfWeek(dateStr) {
  const day = getDayOfWeek(dateStr);
  return addDaysToDateStr(dateStr, -((day + 6) % 7));
}

export function getSaturdayOfWeek(dateStr) {
  const day = getDayOfWeek(dateStr);
  return addDaysToDateStr(dateStr, (6 - day + 7) % 7);
}

export function getYearFromDateStr(dateStr) {
  return parseInt(dateStr.substring(0, 4), 10);
}

export function formatDateCo(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
