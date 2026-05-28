import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/db-status', async (req, res) => {
  if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return res.status(404).json({ error: 'Ruta no encontrada', code: 404 });
  }
  const queries = [
    pool.query('SELECT COUNT(*)::int AS count FROM admin_users'),
    pool.query('SELECT COUNT(*)::int AS count FROM collaborators'),
    pool.query("SELECT COUNT(*)::int AS count FROM sections WHERE vehicle_type = 'moto'"),
    pool.query("SELECT COUNT(*)::int AS count FROM sections WHERE vehicle_type = 'auto'"),
    pool.query('SELECT COUNT(*)::int AS count FROM questions'),
    pool.query("SELECT COUNT(*)::int AS count FROM photo_configs WHERE vehicle_type = 'moto'"),
    pool.query("SELECT COUNT(*)::int AS count FROM photo_configs WHERE vehicle_type = 'auto'"),
    pool.query('SELECT COUNT(*)::int AS count FROM app_settings'),
  ];
  const results = await Promise.all(queries);
  res.json({
    admin_users_count: results[0].rows[0].count,
    collaborators_count: results[1].rows[0].count,
    sections_moto_count: results[2].rows[0].count,
    sections_auto_count: results[3].rows[0].count,
    questions_count: results[4].rows[0].count,
    photo_configs_moto_count: results[5].rows[0].count,
    photo_configs_auto_count: results[6].rows[0].count,
    app_settings_count: results[7].rows[0].count,
  });
});

export default router;
