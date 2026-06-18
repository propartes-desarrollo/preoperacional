export const up = async (client) => {
  await client.query(`ALTER TABLE inspection_answers DROP CONSTRAINT IF EXISTS inspection_answers_answer_check`);
  await client.query(`
    ALTER TABLE inspection_answers
    ADD CONSTRAINT inspection_answers_answer_check
    CHECK (answer IN ('bueno', 'malo', 'no_aplica') OR answer IS NULL)
  `);
};

export const down = async (client) => {
  await client.query(`ALTER TABLE inspection_answers DROP CONSTRAINT IF EXISTS inspection_answers_answer_check`);
  await client.query(`
    ALTER TABLE inspection_answers
    ADD CONSTRAINT inspection_answers_answer_check
    CHECK (answer IN ('bueno', 'malo') OR answer IS NULL)
  `);
};
