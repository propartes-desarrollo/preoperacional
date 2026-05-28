import cron from 'node-cron';
import pool from '../db.js';
import logger from '../utils/logger.js';

export function startCleanupTokensJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      const { rowCount } = await pool.query(
        `DELETE FROM magic_link_tokens WHERE expires_at < NOW() - INTERVAL '24 hours'`
      );
      if (rowCount > 0) {
        logger.info({ component: 'cleanup' }, `${rowCount} token(s) expirado(s) eliminado(s).`);
      }
    } catch (err) {
      logger.error({ component: 'cleanup' }, `Error al limpiar tokens: ${err.message}`);
    }
  });
  logger.info({ component: 'cleanup' }, 'Job de limpieza de tokens iniciado (cada hora).');
}
