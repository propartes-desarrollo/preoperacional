const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0,O,1,I,L para legibilidad

function genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return s;
}

export const up = async (client) => {
  // 1. ID publico aleatorio para inspecciones
  await client.query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS public_code VARCHAR(6)`);

  const { rows: existingCodes } = await client.query(
    `SELECT public_code FROM inspections WHERE public_code IS NOT NULL`
  );
  const used = new Set(existingCodes.map((r) => r.public_code));

  const { rows: pending } = await client.query(`SELECT id FROM inspections WHERE public_code IS NULL`);
  for (const r of pending) {
    let code;
    do { code = genCode(); } while (used.has(code));
    used.add(code);
    await client.query(`UPDATE inspections SET public_code = $1 WHERE id = $2`, [code, r.id]);
  }

  await client.query(`ALTER TABLE inspections ALTER COLUMN public_code SET NOT NULL`);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_inspections_public_code ON inspections(public_code)`);

  // 2. Tabla de auditoria de eliminaciones (append-only)
  await client.query(`
    CREATE TABLE IF NOT EXISTS inspection_deletions (
      id SERIAL PRIMARY KEY,
      inspection_public_code VARCHAR(6),
      inspection_id INTEGER,
      collaborator_cedula VARCHAR(20),
      collaborator_name VARCHAR(200),
      plate VARCHAR(10),
      inspection_date DATE,
      deleted_by_admin_id INTEGER,
      deleted_by_email VARCHAR(255),
      deleted_by_name VARCHAR(255),
      reason TEXT,
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 3. Inmutabilidad: no se permite UPDATE ni DELETE sobre la auditoria
  await client.query(`
    CREATE OR REPLACE FUNCTION prevent_inspection_deletions_change() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'El registro de auditoria de eliminaciones no se puede modificar ni eliminar';
    END;
    $$ LANGUAGE plpgsql;
  `);
  await client.query(`DROP TRIGGER IF EXISTS trg_inspection_deletions_immutable ON inspection_deletions`);
  await client.query(`
    CREATE TRIGGER trg_inspection_deletions_immutable
    BEFORE UPDATE OR DELETE ON inspection_deletions
    FOR EACH ROW EXECUTE FUNCTION prevent_inspection_deletions_change()
  `);
};

export const down = async (client) => {
  await client.query(`DROP TRIGGER IF EXISTS trg_inspection_deletions_immutable ON inspection_deletions`);
  await client.query(`DROP FUNCTION IF EXISTS prevent_inspection_deletions_change()`);
  await client.query(`DROP TABLE IF EXISTS inspection_deletions`);
  await client.query(`DROP INDEX IF EXISTS idx_inspections_public_code`);
  await client.query(`ALTER TABLE inspections DROP COLUMN IF EXISTS public_code`);
};
