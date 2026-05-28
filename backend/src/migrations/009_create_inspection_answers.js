export const up = async (client) => {
  await client.query(`
    CREATE TABLE inspection_answers (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      answer VARCHAR(10) CHECK (answer IN ('bueno', 'malo') OR answer IS NULL),
      observations TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(inspection_id, question_id)
    )
  `);
  await client.query(`CREATE INDEX idx_inspection_answers_inspection ON inspection_answers(inspection_id)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS inspection_answers`);
};
