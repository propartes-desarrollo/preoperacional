export const up = async (client) => {
  await client.query(`
    CREATE TABLE sections (
      id SERIAL PRIMARY KEY,
      vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('auto', 'moto')),
      name VARCHAR(255) NOT NULL,
      display_order INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_sections_vehicle_type ON sections(vehicle_type)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS sections`);
};
