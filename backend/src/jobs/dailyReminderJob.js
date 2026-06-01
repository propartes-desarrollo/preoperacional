import cron from 'node-cron';
import pool from '../db.js';
import logger from '../utils/logger.js';
import { formatInTimeZone } from 'date-fns-tz';
import { todayInBogota, BOGOTA_TZ } from '../utils/dateHelpers.js';
import { isBusinessDay } from '../services/businessDayService.js';
import { sendDailyReminder } from '../services/whatsappService.js';

async function getReminderTime() {
  const { rows } = await pool.query(
    "SELECT value FROM app_settings WHERE key = 'whatsapp_reminder_time'"
  );
  return rows[0]?.value || '07:55';
}

async function runDailyReminder() {
  const today = todayInBogota();

  if (!(await isBusinessDay(today))) {
    return;
  }

  const { rows: collaborators } = await pool.query(
    `SELECT c.id, c.first_name, c.last_name, c.phone
     FROM collaborators c
     WHERE c.is_active = true
       AND c.inspection_frequency = 'daily'
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
    // Pausa de 200ms entre mensajes para respetar rate limits de Meta
    await new Promise((r) => setTimeout(r, 200));
  }

  logger.info({ component: 'dailyReminder', sent, failed }, `Recordatorios completados: ${sent} exitosos, ${failed} fallidos.`);
}

export function startDailyReminderJob() {
  // Corre cada minuto y verifica si la hora actual coincide con la configurada en app_settings
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
