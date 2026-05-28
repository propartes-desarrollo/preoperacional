import pool from '../db.js';

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function moveToNextMonday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  const offset = (8 - day) % 7;
  if (offset === 0) return dateStr;
  return addDays(dateStr, offset);
}

export function getColombianHolidays(year) {
  const holidays = [];
  const add = (dateStr, name, type) => holidays.push({ date: dateStr, name, type });

  // Fixed holidays
  add(toDateStr(year, 1, 1), 'Ano Nuevo', 'fixed');
  add(toDateStr(year, 5, 1), 'Dia del Trabajo', 'fixed');
  add(toDateStr(year, 7, 20), 'Dia de la Independencia', 'fixed');
  add(toDateStr(year, 8, 7), 'Batalla de Boyaca', 'fixed');
  add(toDateStr(year, 12, 8), 'Inmaculada Concepcion', 'fixed');
  add(toDateStr(year, 12, 25), 'Navidad', 'fixed');

  // Easter-based holidays
  const { month, day } = easterSunday(year);
  const easter = toDateStr(year, month, day);
  add(addDays(easter, -3), 'Jueves Santo', 'easter');
  add(addDays(easter, -2), 'Viernes Santo', 'easter');
  add(moveToNextMonday(addDays(easter, 43)), 'Ascension del Senor', 'easter');
  add(moveToNextMonday(addDays(easter, 64)), 'Corpus Christi', 'easter');
  add(moveToNextMonday(addDays(easter, 71)), 'Sagrado Corazon de Jesus', 'easter');

  // Emiliani holidays (moved to next Monday)
  add(moveToNextMonday(toDateStr(year, 1, 6)), 'Reyes Magos', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 3, 19)), 'San Jose', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 6, 29)), 'San Pedro y San Pablo', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 8, 15)), 'Asuncion de la Virgen', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 10, 12)), 'Dia de la Raza', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 11, 1)), 'Todos los Santos', 'emiliani');
  add(moveToNextMonday(toDateStr(year, 11, 11)), 'Independencia de Cartagena', 'emiliani');

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

const holidayCache = new Map();

export function invalidateHolidayCache(year) {
  if (year) holidayCache.delete(String(year));
  else holidayCache.clear();
}

export async function getEffectiveHolidays(year) {
  const key = String(year);
  if (holidayCache.has(key)) return holidayCache.get(key);

  const calculated = getColombianHolidays(year);

  const { rows } = await pool.query(
    `SELECT to_char(date, 'YYYY-MM-DD') AS date, action, description
     FROM holiday_overrides
     WHERE EXTRACT(YEAR FROM date) = $1`,
    [year]
  );

  const removeDates = new Set(rows.filter((r) => r.action === 'remove').map((r) => r.date));
  let result = calculated.filter((h) => !removeDates.has(h.date));

  const adds = rows
    .filter((r) => r.action === 'add')
    .map((r) => ({ date: r.date, name: r.description || 'Festivo adicional', type: 'override' }));

  result = result.concat(adds).sort((a, b) => a.date.localeCompare(b.date));

  holidayCache.set(key, result);
  setTimeout(() => holidayCache.delete(key), 3_600_000);

  return result;
}

export async function getHolidaySet(year) {
  const holidays = await getEffectiveHolidays(year);
  return new Set(holidays.map((h) => h.date));
}
