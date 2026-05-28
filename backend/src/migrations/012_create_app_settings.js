export const up = async (client) => {
  await client.query(`
    CREATE TABLE app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by INTEGER REFERENCES admin_users(id)
    )
  `);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS app_settings`);
};
