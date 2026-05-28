export const up = async (client) => {
  await client.query(`
    CREATE TABLE questions (
      id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      is_other BOOLEAN NOT NULL DEFAULT false,
      display_order INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_questions_section ON questions(section_id)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS questions`);
};
