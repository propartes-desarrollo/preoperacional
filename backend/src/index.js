import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import logger from './utils/logger.js';
import pool from './db.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import holidaysRouter from './routes/holidays.js';
import sectionsRouter from './routes/sections.js';
import photoConfigRouter from './routes/photoConfig.js';
import inspectionStatusRouter from './routes/inspectionStatus.js';
import inspectionsRouter from './routes/inspections.js';
import collaboratorLookupRouter from './routes/collaboratorLookup.js';
import { requireAuth } from './middleware/requireAuth.js';
import adminDashboardRouter from './routes/admin/dashboard.js';
import adminCollaboratorsRouter from './routes/admin/collaborators.js';
import adminCollaboratorTypesRouter from './routes/admin/collaboratorTypes.js';
import adminSectionsRouter from './routes/admin/sections.js';
import adminQuestionsRouter from './routes/admin/questions.js';
import adminPhotoConfigsRouter from './routes/admin/photoConfigs.js';
import adminUsersRouter from './routes/admin/adminUsers.js';
import adminHolidayOverridesRouter from './routes/admin/holidayOverrides.js';
import adminSettingsRouter from './routes/admin/settings.js';
import adminInspectionsRouter from './routes/admin/inspections.js';
import adminAlertsRouter from './routes/admin/alerts.js';
import { startCleanupTokensJob } from './jobs/cleanupTokens.js';
import { startDailyReminderJob } from './jobs/dailyReminderJob.js';
import { startInactivityAlertJob } from './jobs/inactivityAlertJob.js';
import { warnIfWhatsAppUnconfigured } from './services/whatsappService.js';
import { swaggerServe, swaggerSetup, swaggerSpec } from './swagger.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function waitForDatabase() {
  const start = Date.now();
  let attempt = 0;
  while (true) {
    try {
      await pool.query('SELECT 1');
      logger.info({ component: 'db' }, 'PostgreSQL disponible.');
      return;
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed >= 30000) throw new Error('PostgreSQL no disponible despues de 30 segundos.');
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      attempt++;
      logger.info({ component: 'db' }, `Esperando PostgreSQL (intento ${attempt}, reintentando en ${delay}ms)...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function bootstrap() {
  await waitForDatabase();

  logger.info({ component: 'migrate' }, 'Ejecutando migraciones...');
  await runMigrations(pool, 'up');

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (rows[0].count === 0) {
    logger.info({ component: 'seed' }, 'Ejecutando seed inicial...');
    await runSeed(pool);
  } else {
    logger.info({ component: 'seed' }, 'Seed omitido (datos existentes).');
  }

  const app = express();

  app.use(helmet());

  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5176,http://localhost:5173').split(',').map((s) => s.trim());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS no permitido'));
    },
    credentials: true,
  }));

  app.use(pinoHttp({ logger }));
  app.use(express.json());

  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intenta mas tarde', code: 429 },
  });
  const statusLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes', code: 429 },
  });
  app.use(globalLimiter);
  app.use('/api/v1/inspection-status', statusLimiter);

  // Public routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/holidays', holidaysRouter);
  app.use('/api/v1/sections', sectionsRouter);
  app.use('/api/v1/photo-config', photoConfigRouter);
  app.use('/api/v1/inspection-status', inspectionStatusRouter);
  app.use('/api/v1/inspections', inspectionsRouter);
  app.use('/api/v1/collaborator-lookup', collaboratorLookupRouter);

  // Auth routes
  app.use('/api/v1/auth', authRouter);

  // Admin routes (all require authentication)
  app.use('/api/v1/admin/dashboard', requireAuth, adminDashboardRouter);
  app.use('/api/v1/admin/collaborators', requireAuth, adminCollaboratorsRouter);
  app.use('/api/v1/admin/collaborator-types', requireAuth, adminCollaboratorTypesRouter);
  app.use('/api/v1/admin/sections', requireAuth, adminSectionsRouter);
  app.use('/api/v1/admin/questions', requireAuth, adminQuestionsRouter);
  app.use('/api/v1/admin/photo-configs', requireAuth, adminPhotoConfigsRouter);
  app.use('/api/v1/admin/users', requireAuth, adminUsersRouter);
  app.use('/api/v1/admin/holiday-overrides', requireAuth, adminHolidayOverridesRouter);
  app.use('/api/v1/admin/settings', requireAuth, adminSettingsRouter);
  app.use('/api/v1/admin/inspections', requireAuth, adminInspectionsRouter);
  app.use('/api/v1/admin/alerts', requireAuth, adminAlertsRouter);

  // Docs
  app.use('/api/v1/docs', swaggerServe, swaggerSetup);
  app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', code: 404 });
  });

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Error interno del servidor', code: status });
  });

  warnIfWhatsAppUnconfigured();
  startCleanupTokensJob();
  startDailyReminderJob();
  startInactivityAlertJob();

  app.listen(PORT, () => {
    logger.info({ component: 'backend' }, `Puerto: ${PORT} | Entorno: ${NODE_ENV} | Version: ${process.env.npm_package_version || '1.0.0'}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ component: 'bootstrap' }, `Error fatal: ${err.message}`);
  process.exit(1);
});
