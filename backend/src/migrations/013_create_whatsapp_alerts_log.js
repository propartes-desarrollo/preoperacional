export const up = async (client) => {
  await client.query(`
    CREATE TABLE whatsapp_alerts_log (
      id SERIAL PRIMARY KEY,
      collaborator_id INTEGER NOT NULL REFERENCES collaborators(id),
      plate VARCHAR(10) NOT NULL,
      days_count INTEGER NOT NULL,
      threshold_crossed INTEGER NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      whatsapp_response JSONB
    )
  `);
  await client.query(`CREATE INDEX idx_whatsapp_alerts_collaborator ON whatsapp_alerts_log(collaborator_id)`);
  await client.query(`CREATE INDEX idx_whatsapp_alerts_sent ON whatsapp_alerts_log(sent_at)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS whatsapp_alerts_log`);
};
