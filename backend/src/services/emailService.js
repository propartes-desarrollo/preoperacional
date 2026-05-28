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
