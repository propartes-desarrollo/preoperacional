import { Router } from 'express';
import { execSync } from 'child_process';
import { accessSync, constants } from 'fs';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const checks = {};
  let overallStatus = 'ok';

  // Database check
  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    overallStatus = 'degraded';
  }

  // Uploads dir writable check
  try {
    accessSync('/app/uploads', constants.W_OK);
    checks.uploads_dir_writable = 'ok';
  } catch {
    checks.uploads_dir_writable = 'error';
    overallStatus = 'degraded';
  }

  // Disk space check (warn if less than 500MB free)
  try {
    const dfOutput = execSync('df -k /app/uploads 2>/dev/null || df -k /tmp', { timeout: 3000 }).toString();
    const lines = dfOutput.trim().split('\n');
    const dataLine = lines[lines.length - 1];
    const parts = dataLine.split(/\s+/);
    const availableKb = parseInt(parts[3], 10);
    checks.disk_space = availableKb > 512000 ? 'ok' : 'low';
    if (checks.disk_space === 'low') overallStatus = 'degraded';
  } catch {
    checks.disk_space = 'unknown';
  }

  const status = overallStatus === 'ok' ? 200 : 503;
  res.status(status).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime_seconds: Math.floor(process.uptime()),
    checks,
  });
});

export default router;
