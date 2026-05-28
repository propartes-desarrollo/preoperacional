import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`
  );
  return new Set(rows.map((r) => r.name));
}

async function getMigrationFiles() {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => ({
      name: f.slice(0, -3),
      path: path.join(MIGRATIONS_DIR, f),
    }));
}

export async function runMigrations(pool, direction = 'up') {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const allFiles = await getMigrationFiles();

    if (direction === 'up') {
      const pending = allFiles.filter((m) => !applied.has(m.name));
      if (pending.length === 0) {
        console.log('[migrate] Migraciones al dia, no hay pendientes.');
        return;
      }
      for (const migration of pending) {
        const mod = await import(pathToFileURL(migration.path).href);
        await client.query('BEGIN');
        try {
          await mod.up(client);
          await client.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
            [migration.name]
          );
          await client.query('COMMIT');
          console.log(`[migrate] Aplicada: ${migration.name}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw new Error(`Fallo migracion "${migration.name}": ${err.message}`);
        }
      }
      console.log(`[migrate] ${pending.length} migracion(es) aplicada(s).`);
    } else if (direction === 'down') {
      const appliedFiles = allFiles.filter((m) => applied.has(m.name));
      if (appliedFiles.length === 0) {
        console.log('[migrate] No hay migraciones aplicadas para revertir.');
        return;
      }
      const last = appliedFiles[appliedFiles.length - 1];
      const mod = await import(pathToFileURL(last.path).href);
      await client.query('BEGIN');
      try {
        await mod.down(client);
        await client.query(
          `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
          [last.name]
        );
        await client.query('COMMIT');
        console.log(`[migrate] Revertida: ${last.name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Fallo reversion "${last.name}": ${err.message}`);
      }
    }
  } finally {
    client.release();
  }
}
