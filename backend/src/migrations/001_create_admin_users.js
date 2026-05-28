export const up = async (client) => {
  await client.query(`
    CREATE TABLE admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_admin_users_email ON admin_users(email)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS admin_users`);
};
