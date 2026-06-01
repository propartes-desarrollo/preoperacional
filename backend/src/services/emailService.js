import { Resend } from 'resend';

let resendClient = null;

function getClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const HTML_TEMPLATE = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1c7ed6;">Preoperacional Propartes</h2>
  <p>Hola {{name}},</p>
  <p>Has solicitado acceso al panel de administracion. Haz clic en el siguiente enlace para iniciar sesion:</p>
  <p style="margin: 30px 0;">
    <a href="{{link}}" style="background-color: #1c7ed6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Iniciar sesion
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">Este enlace expira en 15 minutos. Si no fuiste tu, ignora este mensaje.</p>
  <p style="color: #666; font-size: 14px;">Si el boton no funciona, copia y pega esta URL en tu navegador:<br>
  <span style="word-break: break-all;">{{link}}</span></p>
  <hr style="margin-top: 40px; border: 0; border-top: 1px solid #ddd;">
  <p style="color: #999; font-size: 12px;">Preoperacional Propartes - Sistema de inspeccion preoperacional de vehiculos</p>
</div>
`.trim();

const TEXT_TEMPLATE = `Preoperacional Propartes

Hola {{name}},

Has solicitado acceso al panel de administracion. Usa el siguiente enlace para iniciar sesion:

{{link}}

Este enlace expira en 15 minutos. Si no fuiste tu, ignora este mensaje.

Preoperacional Propartes - Sistema de inspeccion preoperacional de vehiculos`;

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function buildInactivityAlertHtml(alerts, threshold, date) {
  const rows = alerts
    .map(
      (a) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${a.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${a.cedula}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${a.plates.join(', ')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #e03131; font-weight: bold;">${a.business_days_without_inspection}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${a.last_inspection_date ? formatDate(a.last_inspection_date) : 'Sin registros'}</td>
      </tr>`
    )
    .join('');

  return `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1c7ed6;">Preoperacional Propartes</h2>
  <p>Reporte de inactividad generado el <strong>${formatDate(date)}</strong>.</p>
  <p>Los siguientes colaboradores llevan <strong>${threshold} o mas dias habiles</strong> sin registrar inspeccion preoperacional:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <thead>
      <tr style="background-color: #f1f3f5;">
        <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Nombre</th>
        <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Cedula</th>
        <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Placas</th>
        <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Dias sin inspeccion</th>
        <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Ultima inspeccion</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top: 20px; color: #666; font-size: 14px;">Total: <strong>${alerts.length}</strong> colaborador(es) con inactividad.</p>
  <hr style="margin-top: 40px; border: 0; border-top: 1px solid #ddd;">
  <p style="color: #999; font-size: 12px;">Preoperacional Propartes - Sistema de inspeccion preoperacional de vehiculos</p>
</div>`.trim();
}

function buildInactivityAlertText(alerts, threshold, date) {
  const lines = alerts.map(
    (a) =>
      `- ${a.name} (CC ${a.cedula}) | Placas: ${a.plates.join(', ')} | ${a.business_days_without_inspection} dias | Ultima: ${a.last_inspection_date ? formatDate(a.last_inspection_date) : 'Sin registros'}`
  );
  return `Preoperacional Propartes - Alerta de inactividad (${formatDate(date)})

Colaboradores con ${threshold} o mas dias habiles sin inspeccion:

${lines.join('\n')}

Total: ${alerts.length} colaborador(es).

Preoperacional Propartes - Sistema de inspeccion preoperacional de vehiculos`;
}

export async function sendInactivityAlertEmail({ alerts, threshold, date, to }) {
  const html = buildInactivityAlertHtml(alerts, threshold, date);
  const text = buildInactivityAlertText(alerts, threshold, date);

  const result = await getClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject: `Alerta inactividad preoperacional - ${formatDate(date)} (${alerts.length} colaboradores)`,
    html,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Error enviando alerta de inactividad via Resend');
  }

  return result;
}

export async function sendMagicLinkEmail({ name, email, link }) {
  const html = HTML_TEMPLATE.replaceAll('{{name}}', name).replaceAll('{{link}}', link);
  const text = TEXT_TEMPLATE.replaceAll('{{name}}', name).replaceAll('{{link}}', link);

  const result = await getClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Acceso al panel de administracion - Preoperacional Propartes',
    html,
    text,
  });

  if (result.error) {
    throw new Error(result.error.message || 'Error enviando email via Resend');
  }

  return result;
}
