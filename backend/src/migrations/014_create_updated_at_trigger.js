const TABLES_WITH_UPDATED_AT = [
  'admin_users',
  'collaborators',
  'sections',
  'questions',
  'photo_configs',
];

export const up = async (client) => {
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  for (const table of TABLES_WITH_UPDATED_AT) {
    await client.query(`
      CREATE TRIGGER set_updated_at_${table}
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }
};

export const down = async (client) => {
  for (const table of TABLES_WITH_UPDATED_AT) {
    await client.query(`DROP TRIGGER IF EXISTS set_updated_at_${table} ON ${table}`);
  }
  await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
};
