export const up = async (client) => {
  await client.query(`
    CREATE TABLE photo_configs (
      id SERIAL PRIMARY KEY,
      vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('auto', 'moto')),
      label VARCHAR(100) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT true,
      display_order INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_photo_configs_vehicle_type ON photo_configs(vehicle_type)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS photo_configs`);
};
