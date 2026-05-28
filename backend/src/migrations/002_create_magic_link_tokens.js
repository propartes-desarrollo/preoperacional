export const up = async (client) => {
  await client.query(`
    CREATE TABLE magic_link_tokens (
      id SERIAL PRIMARY KEY,
      admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token)`);
  await client.query(`CREATE INDEX idx_magic_link_tokens_expires ON magic_link_tokens(expires_at)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS magic_link_tokens`);
};
