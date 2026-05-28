import 'dotenv/config';
import pg from 'pg';
import { runMigrations } from './migrate.js';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const direction = process.argv[2] || 'up';

if (direction === 'create') {
  const name = process.argv[3];
  if (!name) {
    console.error('Uso: npm run migrate:create <nombre>');
    process.exit(1);
  }
  const num = String(Date.now()).slice(-6);
  const filename = `${num}_${name}.js`;
  const filepath = path.join(__dirname, 'migrations', filename);
  mkdirSync(path.join(__dirname, 'migrations'), { recursive: true });
  writeFileSync(
    filepath,
    `export const up = async (client) => {\n  // await client.query(\`...\`);\n};\n\nexport const down = async (client) => {\n  // await client.query(\`...\`);\n};\n`
  );
  console.log(`[migrate] Migracion creada: ${filename}`);
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await runMigrations(pool, direction);
} finally {
  await pool.end();
}
