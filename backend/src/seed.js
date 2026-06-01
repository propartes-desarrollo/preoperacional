const MOTO_SECTIONS = [
  {
    name: 'Elementos de Proteccion Personal (EPP - MOTO)',
    display_order: 1,
    questions: [
      { text: 'Guantes, Casco, prendas reflectivas.', is_other: false, display_order: 1 },
      { text: 'Proteccion dorsal, rodilleras.', is_other: false, display_order: 2 },
      { text: 'Otro - Cual', is_other: true, display_order: 3 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO - MOTO',
    display_order: 2,
    questions: [
      { text: 'Mangueras hidraulicas, bateria, frenos y cableado.', is_other: false, display_order: 1 },
      { text: 'Suspension (Horquilla, Amortiguadores y eje del manillar).', is_other: false, display_order: 2 },
      { text: 'Escape, tapa y tanque de combustible.', is_other: false, display_order: 3 },
      { text: 'Kit de arrastre (Pinon, corona y cadena).', is_other: false, display_order: 4 },
      { text: 'Carenaje, asiento, guardabarros y soporte de estacionamiento.', is_other: false, display_order: 5 },
      { text: 'Otro - Cual', is_other: true, display_order: 6 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO (LLANTAS, LUCES) - MOTO',
    display_order: 3,
    questions: [
      { text: 'Delantera y trasera (Rines, pernos completos y ajustados, presion, labrado Min - 1.0 a 1.6 mm).', is_other: false, display_order: 1 },
      { text: 'Luces (Altas, bajas, parqueo, freno, direccionales traseras y delanteras).', is_other: false, display_order: 2 },
      { text: 'Otro - Cual', is_other: true, display_order: 3 },
    ],
  },
];

const AUTO_SECTIONS = [
  {
    name: 'ESTADO GENERAL DEL VEHICULO - AUTO',
    display_order: 1,
    questions: [
      { text: 'Mangueras hidraulicas y aire, bateria, correas y cableado.', is_other: false, display_order: 1 },
      { text: 'Caja de cambios, freno de mano, pedales freno, acelerador y embrague.', is_other: false, display_order: 2 },
      { text: 'Latoneria y pintura, tapa del tanque de combustible y tubo de escape.', is_other: false, display_order: 3 },
      { text: 'Sistema de distribucion, sistema de direccion y sistema de suspension.', is_other: false, display_order: 4 },
      { text: 'Nivel de agua, lubricante, combustible, liquido de freno, aceite, refrigerante.', is_other: false, display_order: 5 },
      { text: 'Indicadores de presion de aceite, velocidad, nivel de bateria, combustible, temperatura, Indicador de luces (altas, direccionales y parqueo).', is_other: false, display_order: 6 },
      { text: 'Otro - Cual', is_other: true, display_order: 7 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO - CARRO',
    display_order: 2,
    questions: [
      { text: 'Aire acondicionado, asientos, bocina o pito, vidrios, luces de cabina, piso y puertas.', is_other: false, display_order: 1 },
      { text: 'Cinturones de seguridad y Airbag.', is_other: false, display_order: 2 },
      { text: 'Otro - Cual', is_other: true, display_order: 3 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO - CARRO - LLANTAS',
    display_order: 3,
    questions: [
      { text: 'Delantera izquierda y derecha (Rines, pernos completos y ajustados, presion, labrado Min - 3 mm).', is_other: false, display_order: 1 },
      { text: 'Trasera izquierda y derecha (Rines, pernos completos y ajustados, presion, labrado Min 1.6 a 3 mm).', is_other: false, display_order: 2 },
      { text: 'Llanta de repuesto (Rin, pernos completos y ajustados, presion, labrado Min - 3 mm).', is_other: false, display_order: 3 },
      { text: 'Otro - Cual', is_other: true, display_order: 4 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO - CARRO - LUCES Y ESPEJOS',
    display_order: 4,
    questions: [
      { text: 'Luces (Altas, bajas, cocuyos, parqueo delanteras y traseras, direccionales traseras y delanteras, freno, exploradoras y tercer stop).', is_other: false, display_order: 1 },
      { text: 'Espejo retrovisor y espejos laterales, panoramico, vidrios traseros y laterales, limpia parabrisas delantero y trasero.', is_other: false, display_order: 2 },
      { text: 'Otro - Cual', is_other: true, display_order: 3 },
    ],
  },
  {
    name: 'ESTADO GENERAL DEL VEHICULO - CARRO - EMERGENCIAS',
    display_order: 5,
    questions: [
      { text: 'Botiquin, extintor, linterna, senales de carretera (Kit de derrames si aplica).', is_other: false, display_order: 1 },
      { text: 'Cables de arranque, cruceta, gato elevador y kit de herramientas basicas.', is_other: false, display_order: 2 },
      { text: 'Otro - Cual', is_other: true, display_order: 3 },
    ],
  },
];

const MOTO_PHOTO_CONFIGS = [
  { label: 'Costado izquierdo', display_order: 1 },
  { label: 'Costado derecho', display_order: 2 },
];

const AUTO_PHOTO_CONFIGS = [
  { label: 'Frontal', display_order: 1 },
  { label: 'Posterior', display_order: 2 },
  { label: 'Lateral izquierdo', display_order: 3 },
  { label: 'Lateral derecho', display_order: 4 },
];

async function insertSectionsAndQuestions(client, sections, vehicleType) {
  for (const section of sections) {
    const { rows } = await client.query(
      `INSERT INTO sections (vehicle_type, name, display_order)
       VALUES ($1, $2, $3) RETURNING id`,
      [vehicleType, section.name, section.display_order]
    );
    const sectionId = rows[0].id;
    for (const q of section.questions) {
      await client.query(
        `INSERT INTO questions (section_id, text, is_other, display_order)
         VALUES ($1, $2, $3, $4)`,
        [sectionId, q.text, q.is_other, q.display_order]
      );
    }
  }
}

async function insertPhotoConfigs(client, configs, vehicleType) {
  for (const cfg of configs) {
    await client.query(
      `INSERT INTO photo_configs (vehicle_type, label, is_required, display_order)
       VALUES ($1, $2, true, $3)`,
      [vehicleType, cfg.label, cfg.display_order]
    );
  }
}

export async function runSeed(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: adminCount } = await client.query('SELECT COUNT(*)::int AS count FROM admin_users');
    if (adminCount[0].count === 0) {
      const email = process.env.INITIAL_SUPERADMIN_EMAIL;
      const name = process.env.INITIAL_SUPERADMIN_NAME;
      if (!email || !name) {
        throw new Error('INITIAL_SUPERADMIN_EMAIL e INITIAL_SUPERADMIN_NAME son requeridos para el seed.');
      }
      await client.query(
        `INSERT INTO admin_users (email, name, role) VALUES ($1, $2, 'superadmin')`,
        [email, name]
      );
      console.log(`[seed] Superadmin creado: ${email}`);
    } else {
      console.log('[seed] admin_users no esta vacio, omitiendo superadmin.');
    }

    const settings = [
      { key: 'whatsapp_alert_threshold', value: '6', description: 'Dias habiles consecutivos sin inspeccion para disparar alerta por correo al administrador' },
      { key: 'photo_retention_days', value: process.env.PHOTO_RETENTION_DAYS || '90', description: 'Dias de retencion de fotos antes de limpieza automatica' },
      { key: 'whatsapp_reminder_time', value: '07:55', description: 'Hora de envio del recordatorio WhatsApp a colaboradores (formato HH:MM, zona America/Bogota)' },
    ];
    for (const s of settings) {
      await client.query(
        `INSERT INTO app_settings (key, value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value, s.description]
      );
    }
    console.log('[seed] app_settings verificados/insertados.');

    const { rows: sectionCount } = await client.query('SELECT COUNT(*)::int AS count FROM sections');
    if (sectionCount[0].count === 0) {
      await insertSectionsAndQuestions(client, MOTO_SECTIONS, 'moto');
      await insertSectionsAndQuestions(client, AUTO_SECTIONS, 'auto');
      await insertPhotoConfigs(client, MOTO_PHOTO_CONFIGS, 'moto');
      await insertPhotoConfigs(client, AUTO_PHOTO_CONFIGS, 'auto');
      console.log('[seed] Secciones, preguntas y photo_configs insertados.');
    } else {
      console.log('[seed] sections no esta vacio, omitiendo secciones/preguntas/fotos.');
    }

    await client.query('COMMIT');
    console.log('[seed] Seed completado exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
