import logger from '../utils/logger.js';

const BASE_URL = 'https://graph.facebook.com/v25.0';

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) {
    return `+57${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('573')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

async function sendTemplate({ to, templateName, languageCode = 'es_CO', components = [] }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    logger.warn({ component: 'whatsapp' }, 'Variables WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN no configuradas.');
    return null;
  }

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 && { components }),
    },
  };

  const response = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `WhatsApp API error ${response.status}`);
  }

  return data;
}

export async function sendDailyReminder({ phone, firstName }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    logger.warn({ component: 'whatsapp' }, `Telefono invalido para recordatorio: ${phone}`);
    return null;
  }

  const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE_NAME || 'recordatorio_preoperacional';

  const components = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: firstName }],
    },
  ];

  try {
    const result = await sendTemplate({ to: normalized, templateName, components });
    if (result) {
      logger.info({ component: 'whatsapp', phone: normalized }, `Recordatorio enviado a ${firstName}`);
    }
    return result;
  } catch (err) {
    logger.error({ component: 'whatsapp', phone: normalized, err: err.message }, `Error enviando recordatorio a ${firstName}`);
    throw err;
  }
}
