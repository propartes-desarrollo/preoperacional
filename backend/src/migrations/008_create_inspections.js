export const up = async (client) => {
  await client.query(`
    CREATE TABLE inspections (
      id SERIAL PRIMARY KEY,
      collaborator_id INTEGER NOT NULL REFERENCES collaborators(id),
      plate VARCHAR(10) NOT NULL,
      vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('auto', 'moto')),
      inspection_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(collaborator_id, plate, inspection_date)
    )
  `);
  await client.query(`CREATE INDEX idx_inspections_date ON inspections(inspection_date)`);
  await client.query(`CREATE INDEX idx_inspections_collaborator ON inspections(collaborator_id)`);
  await client.query(`CREATE INDEX idx_inspections_plate ON inspections(plate)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS inspections`);
};
