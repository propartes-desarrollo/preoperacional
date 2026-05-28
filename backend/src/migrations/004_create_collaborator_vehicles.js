export const up = async (client) => {
  await client.query(`
    CREATE TABLE collaborator_vehicles (
      id SERIAL PRIMARY KEY,
      collaborator_id INTEGER NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
      plate VARCHAR(10) NOT NULL,
      vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('auto', 'moto') OR vehicle_type IS NULL),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(collaborator_id, plate)
    )
  `);
  await client.query(`CREATE INDEX idx_collaborator_vehicles_plate ON collaborator_vehicles(plate)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS collaborator_vehicles`);
};
