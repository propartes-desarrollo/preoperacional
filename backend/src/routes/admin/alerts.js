import { Router } from 'express';
import { getAlertThreshold, getInactivityAlerts, getPhotoPendingAlerts } from '../../services/alertService.js';

const router = Router();

/**
 * @openapi
 * /admin/alerts:
 *   get:
 *     summary: Colaboradores con dias habiles consecutivos sin inspeccion
 *     tags: [admin-alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas activas
 */
router.get('/', async (req, res, next) => {
  try {
    const threshold = await getAlertThreshold();
    const [alerts, photoPending] = await Promise.all([
      getInactivityAlerts(threshold),
      getPhotoPendingAlerts(),
    ]);

    res.json({
      threshold,
      alerts,
      photo_pending_alerts: photoPending,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
