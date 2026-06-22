export const up = async (client) => {
  await client.query(`
    ALTER TABLE collaborator_types
    ADD COLUMN IF NOT EXISTS receives_reminder BOOLEAN NOT NULL DEFAULT false
  `);

  // Por defecto, los recordatorios WhatsApp van a Conductor empresa y Comercial
  await client.query(`
    UPDATE collaborator_types
    SET receives_reminder = true
    WHERE name IN ('Conductor empresa', 'Comercial')
  `);
};

export const down = async (client) => {
  await client.query(`ALTER TABLE collaborator_types DROP COLUMN IF EXISTS receives_reminder`);
};
