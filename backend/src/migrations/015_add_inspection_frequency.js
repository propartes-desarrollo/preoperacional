export async function up(pool) {
  await pool.query(`
    ALTER TABLE collaborators
    ADD COLUMN IF NOT EXISTS inspection_frequency VARCHAR(10) NOT NULL DEFAULT 'daily'
    CHECK (inspection_frequency IN ('daily', 'eventual'))
  `);
}

export async function down(pool) {
  await pool.query(`ALTER TABLE collaborators DROP COLUMN IF EXISTS inspection_frequency`);
}
