import pg from 'pg';
import logger from './utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  logger.error({ component: 'db' }, `PostgreSQL pool error: ${err.message}`);
});

export default pool;
