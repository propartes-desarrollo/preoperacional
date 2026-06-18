export const up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS collaborator_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      uses_company_vehicles BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    ALTER TABLE collaborators
    ADD COLUMN IF NOT EXISTS collaborator_type_id INTEGER REFERENCES collaborator_types(id)
  `);

  await client.query(`
    INSERT INTO collaborator_types (name, uses_company_vehicles, display_order) VALUES
      ('Conductor empresa', true, 1),
      ('Comercial', false, 2),
      ('Administrativo', false, 3)
    ON CONFLICT (name) DO NOTHING
  `);
};

export const down = async (client) => {
  await client.query(`ALTER TABLE collaborators DROP COLUMN IF EXISTS collaborator_type_id`);
  await client.query(`DROP TABLE IF EXISTS collaborator_types`);
};
