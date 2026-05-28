export const up = async (client) => {
  await client.query(`
    CREATE TABLE collaborators (
      id SERIAL PRIMARY KEY,
      cedula VARCHAR(20) NOT NULL UNIQUE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_collaborators_cedula ON collaborators(cedula)`);
  await client.query(`CREATE INDEX idx_collaborators_is_active ON collaborators(is_active)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS collaborators`);
};
