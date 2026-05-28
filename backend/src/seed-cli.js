import 'dotenv/config';
import pg from 'pg';
import { runSeed } from './seed.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await runSeed(pool);
} finally {
  await pool.end();
}
