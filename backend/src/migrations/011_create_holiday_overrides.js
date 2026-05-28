export const up = async (client) => {
  await client.query(`
    CREATE TABLE holiday_overrides (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      action VARCHAR(10) NOT NULL CHECK (action IN ('add', 'remove')),
      description VARCHAR(255),
      created_by INTEGER REFERENCES admin_users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS holiday_overrides`);
};
