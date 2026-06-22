import cron from 'node-cron';
import logger from '../utils/logger.js';
import { formatInTimeZone } from 'date-fns-tz';
import { todayInBogota, BOGOTA_TZ } from '../utils/dateHelpers.js';
import { isBusinessDay } from '../services/businessDayService.js';
import { getSetting } from '../services/alertService.js';
import { sendDailyReminder } from '../services/whatsappService.js';
import pool from '../db.js';

const WHATSAPP_SEND_DELAY_MS = 200;
const REMINDER_TIME_CACHE_TTL_MS = 15 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let _reminderTimeCache = null;
let _reminderTimeFetchedAt = 0;

async function getReminderTime() {
  const now = Date.now();
  if (_reminderTimeCache && now - _reminderTimeFetchedAt < REMINDER_TIME_CACHE_TTL_MS) {
    return _reminderTimeCache;
  }
  _reminderTimeCache = await getSetting('whatsapp_reminder_time', '07:55');
  _reminderTimeFetchedAt = now;
  return _reminderTimeCache;
}

async function runDailyReminder() {
  const today = todayInBogota();

  if (!(await isBusinessDay(today))) {
    return;
  }

  const { rows: collaborators } = await pool.query(
    `SELECT c.id, c.first_name, c.last_name, c.phone
     FROM collaborators c
     JOIN collaborator_types ct ON ct.id = c.collaborator_type_id
     WHERE c.is_active = true
       AND ct.requires_inspection = true
       AND c.phone IS NOT NULL
     ORDER BY c.last_name, c.first_name`
  );

  if (collaborators.length === 0) {
    logger.info({ component: 'dailyReminder' }, 'No hay colaboradores con telefono para enviar recordatorio.');
    return;
  }

  logger.info({ component: 'dailyReminder', total: collaborators.length }, `Enviando recordatorios a ${collaborators.length} colaboradores.`);

  let sent = 0;
  let failed = 0;

  for (const col of collaborators) {
    try {
      const result = await sendDailyReminder({ phone: col.phone, firstName: col.first_name });
      if (result) sent++;
    } catch {
      failed++;
    }
    await sleep(WHATSAPP_SEND_DELAY_MS);
  }

  logger.info({ component: 'dailyReminder', sent, failed }, `Recordatorios completados: ${sent} exitosos, ${failed} fallidos.`);
}

export function startDailyReminderJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const configuredTime = await getReminderTime();
      const currentTime = formatInTimeZone(new Date(), BOGOTA_TZ, 'HH:mm');

      if (currentTime !== configuredTime) return;

      logger.info({ component: 'dailyReminder', time: currentTime }, 'Iniciando job de recordatorios diarios.');
      await runDailyReminder();
    } catch (err) {
      logger.error({ component: 'dailyReminder', err: err.message }, 'Error en job de recordatorios diarios.');
    }
  });

  logger.info({ component: 'dailyReminder' }, 'Job de recordatorios diarios registrado (hora configurable desde panel admin).');
}
