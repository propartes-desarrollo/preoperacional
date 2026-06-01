import cron from 'node-cron';
import pool from '../db.js';
import logger from '../utils/logger.js';
import { todayInBogota } from '../utils/dateHelpers.js';
import { isBusinessDay } from '../services/businessDayService.js';
import { getAlertThreshold, getInactivityAlerts } from '../services/alertService.js';
import { sendInactivityAlertEmail } from '../services/emailService.js';

async function runInactivityAlert() {
  const today = todayInBogota();

  if (!(await isBusinessDay(today))) {
    logger.info({ component: 'inactivityAlert', date: today }, 'No es dia habil, omitiendo alerta de inactividad.');
    return;
  }

  const threshold = await getAlertThreshold();
  const alerts = await getInactivityAlerts(threshold);

  if (alerts.length === 0) {
    logger.info({ component: 'inactivityAlert' }, 'No hay colaboradores con inactividad por encima del umbral.');
    return;
  }

  const { rows: admins } = await pool.query(
    `SELECT email, name FROM admin_users WHERE is_active = true ORDER BY name`
  );

  if (admins.length === 0) {
    logger.warn({ component: 'inactivityAlert' }, 'No hay administradores activos para enviar la alerta.');
    return;
  }

  const adminEmails = admins.map((a) => a.email);

  try {
    await sendInactivityAlertEmail({ alerts, threshold, date: today, to: adminEmails });
    logger.info(
      { component: 'inactivityAlert', recipients: adminEmails.length, collaborators: alerts.length },
      `Alerta de inactividad enviada: ${alerts.length} colaboradores, ${adminEmails.length} destinatarios.`
    );
  } catch (err) {
    logger.error({ component: 'inactivityAlert', err: err.message }, 'Error enviando alerta de inactividad.');
    throw err;
  }
}

export function startInactivityAlertJob() {
  // 11:00 AM hora Bogota (UTC-5) = 16:00 UTC
  cron.schedule('0 16 * * *', async () => {
    logger.info({ component: 'inactivityAlert' }, 'Iniciando job de alerta de inactividad.');
    try {
      await runInactivityAlert();
    } catch (err) {
      logger.error({ component: 'inactivityAlert', err: err.message }, 'Error en job de alerta de inactividad.');
    }
  });

  logger.info({ component: 'inactivityAlert' }, 'Job de alerta de inactividad registrado (11:00 AM Bogota).');
}
