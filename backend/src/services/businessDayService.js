import { getHolidaySet } from './holidayService.js';
import { addDaysToDateStr, getDayOfWeek, getMondayOfWeek, getYearFromDateStr } from '../utils/dateHelpers.js';

export async function isBusinessDay(dateStr) {
  const day = getDayOfWeek(dateStr);
  if (day === 0) return false; // Sunday is never a business day

  const year = getYearFromDateStr(dateStr);
  const holidays = await getHolidaySet(year);
  return !holidays.has(dateStr);
}

export async function getNextBusinessDay(dateStr) {
  let d = addDaysToDateStr(dateStr, 1);
  let safety = 0;
  while (!(await isBusinessDay(d))) {
    d = addDaysToDateStr(d, 1);
    if (++safety > 30) break;
  }
  return d;
}

export async function getPreviousBusinessDay(dateStr) {
  let d = addDaysToDateStr(dateStr, -1);
  let safety = 0;
  while (!(await isBusinessDay(d))) {
    d = addDaysToDateStr(d, -1);
    if (++safety > 30) break;
  }
  return d;
}

export async function countBusinessDaysBetween(startDateStr, endDateStr) {
  let count = 0;
  let d = addDaysToDateStr(startDateStr, 1);
  while (d <= endDateStr) {
    if (await isBusinessDay(d)) count++;
    d = addDaysToDateStr(d, 1);
  }
  return count;
}

export async function getFirstBusinessMondayOfWeek(dateStr) {
  const monday = getMondayOfWeek(dateStr);
  if (await isBusinessDay(monday)) return monday;
  return getNextBusinessDay(monday);
}
