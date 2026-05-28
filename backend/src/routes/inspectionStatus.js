import { Router } from 'express';
import pool from '../db.js';
import { detectVehicleType, normalizePlate, validatePlateFormat } from '../utils/plateDetector.js';
import { cedulaSchema } from '../utils/validators.js';
import { getPhotoStatus } from '../services/photoBlockService.js';
import { getFirstBusinessMondayOfWeek } from '../services/businessDayService.js';
import { todayInBogota } from '../utils/dateHelpers.js';

const router = Router();

/**
 * @openapi
 * /inspection-status:
 *   get:
 *     summary: Estado del dia para una combinacion cedula + placa
 *     tags: [Publico]
 *     parameters:
 *       - in: query
 *         name: cedula
 *         required: true
 *         schema:
 *           type: string
 *           example: "12345678"
 *       - in: query
 *         name: placa
 *         required: true
 *         schema:
 *           type: string
 *           example: "ABC123"
 *     responses:
 *       200:
 *         description: Estado del dia para la combinacion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 already_submitted:
 *                   type: boolean
 *                 photos_required:
 *                   type: boolean
 *                 photos_pending_from_previous_days:
 *                   type: boolean
 *                 photo_config:
 *                   type: array
 *                 vehicle_type:
 *                   type: string
 *                   nullable: true
 *                 is_first_registration:
 *                   type: boolean
 *                 collaborator_exists:
 *                   type: boolean
 *       400:
 *         description: Parametros invalidos
 */
router.get('/', async (req, res, next) => {
  try {
    const { cedula, placa } = req.query;

    const cedulaResult = cedulaSchema.safeParse(cedula);
    if (!cedulaResult.success) {
      return res.status(400).json({ error: cedulaResult.error.issues[0].message, code: 400 });
    }

    if (!placa || !validatePlateFormat(placa)) {
      return res.status(400).json({ error: 'Placa debe ser 6 caracteres alfanumericos', code: 400 });
    }

    const plate = normalizePlate(placa);
    const vehicleType = detectVehicleType(plate);
    const today = todayInBogota();

    // Find collaborator
    const { rows: collRows } = await pool.query(
      'SELECT id FROM collaborators WHERE cedula = $1',
      [cedula]
    );
    const collaboratorExists = collRows.length > 0;
    const collaboratorId = collaboratorExists ? collRows[0].id : null;

    // Check if already submitted today
    let alreadySubmitted = false;
    if (collaboratorId) {
      const { rows: todayRows } = await pool.query(
        'SELECT id FROM inspections WHERE collaborator_id = $1 AND plate = $2 AND inspection_date = $3',
        [collaboratorId, plate, today]
      );
      alreadySubmitted = todayRows.length > 0;
    }

    // Get photo status
    let photoStatus;
    if (collaboratorId) {
      photoStatus = await getPhotoStatus(collaboratorId, plate);
    } else {
      // New collaborator: always first registration
      const photoDayStr = await getFirstBusinessMondayOfWeek(today);
      photoStatus = {
        photos_required: true,
        photos_pending_from_previous_days: false,
        is_first_registration: true,
        photo_day_this_week: photoDayStr,
      };
    }

    // Get photo config for vehicle type
    let photoConfig = [];
    if (vehicleType) {
      const { rows: configRows } = await pool.query(
        `SELECT id, label, is_required, display_order
         FROM photo_configs
         WHERE vehicle_type = $1 AND is_active = true
         ORDER BY display_order`,
        [vehicleType]
      );
      photoConfig = configRows;
    }

    res.json({
      already_submitted: alreadySubmitted,
      photos_required: photoStatus.photos_required,
      photos_pending_from_previous_days: photoStatus.photos_pending_from_previous_days,
      photo_config: photoConfig,
      vehicle_type: vehicleType,
      is_first_registration: photoStatus.is_first_registration,
      collaborator_exists: collaboratorExists,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
