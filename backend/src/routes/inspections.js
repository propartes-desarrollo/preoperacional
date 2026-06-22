import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import pool from '../db.js';
import { inspectionSubmitSchema } from '../utils/validators.js';
import { normalizePlate, detectVehicleType } from '../utils/plateDetector.js';
import { todayInBogota } from '../utils/dateHelpers.js';
import { getPhotoStatus } from '../services/photoBlockService.js';
import { findOrCreateCollaborator, ensureVehicleAssociation } from '../services/collaboratorService.js';
import { extractExif } from '../services/exifService.js';
import { generateUniqueCode } from '../utils/inspectionCode.js';
import logger from '../utils/logger.js';

const router = Router();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MIN_WIDTH = 640;
const MIN_HEIGHT = 480;
const MIN_SIZE_BYTES = 100 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

/**
 * @openapi
 * /inspections:
 *   post:
 *     summary: Enviar formulario preoperacional con respuestas y fotos
 *     tags: [Publico]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [cedula, nombre, apellidos, placa, vehicle_type, answers]
 *             properties:
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               nombre:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               placa:
 *                 type: string
 *                 example: "ABC123"
 *               vehicle_type:
 *                 type: string
 *                 enum: [auto, moto]
 *               answers:
 *                 type: string
 *                 description: JSON array de respuestas
 *               photo_1:
 *                 type: string
 *                 format: binary
 *                 description: Foto con nombre photo_<photo_config_id>
 *     responses:
 *       201:
 *         description: Inspeccion registrada correctamente
 *       400:
 *         description: Datos invalidos
 *       409:
 *         description: Inspeccion duplicada para esta fecha
 *       422:
 *         description: Fotos requeridas o invalidas
 */
router.post('/', upload.any(), async (req, res, next) => {
  let savedFilePaths = [];

  try {
    // Parse answers from JSON string
    let answersRaw;
    try {
      answersRaw = JSON.parse(req.body.answers || '[]');
    } catch {
      return res.status(400).json({ error: 'El campo answers debe ser un JSON valido', code: 400 });
    }

    const parsed = inspectionSubmitSchema.safeParse({
      cedula: req.body.cedula,
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      placa: req.body.placa,
      vehicle_type: req.body.vehicle_type,
      answers: answersRaw,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('. ');
      return res.status(400).json({ error: msg, code: 400 });
    }

    const { cedula, nombre, apellidos, vehicle_type } = parsed.data;
    const plate = normalizePlate(parsed.data.placa);
    const answers = parsed.data.answers;

    const detectedType = detectVehicleType(plate);
    if (detectedType && detectedType !== vehicle_type) {
      logger.warn({ component: 'inspection', plate, userType: vehicle_type, detectedType }, 'vehicle_type no coincide con deteccion.');
    }

    const today = todayInBogota();

    // Extract photo files: field names are photo_<photo_config_id>
    const photoFiles = (req.files || []).filter((f) => f.fieldname.startsWith('photo_'));
    const photoMap = new Map();
    for (const f of photoFiles) {
      const configId = parseInt(f.fieldname.replace('photo_', ''), 10);
      if (!isNaN(configId)) photoMap.set(configId, f);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find or create collaborator
      const { collaboratorId } = await findOrCreateCollaborator(client, { cedula, nombre, apellidos });

      // Ensure vehicle association
      await ensureVehicleAssociation(client, collaboratorId, plate, vehicle_type);

      // Check for duplicate inspection
      const { rows: existing } = await client.query(
        'SELECT id FROM inspections WHERE collaborator_id = $1 AND plate = $2 AND inspection_date = $3',
        [collaboratorId, plate, today]
      );
      if (existing.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'Ya existe una inspeccion para esta cedula, placa y fecha.',
          code: 409,
        });
      }

      // Validate photo requirements
      const photoStatus = await getPhotoStatus(collaboratorId, plate);
      if (photoStatus.photos_required) {
        const { rows: requiredConfigs } = await client.query(
          'SELECT id, label FROM photo_configs WHERE vehicle_type = $1 AND is_required = true AND is_active = true',
          [vehicle_type]
        );

        const missing = requiredConfigs.filter((cfg) => !photoMap.has(cfg.id)).map((cfg) => cfg.label);
        if (missing.length > 0) {
          await client.query('ROLLBACK');
          return res.status(422).json({ error: 'Faltan fotos requeridas', missing, code: 422 });
        }
      }

      // Validate and process photos in memory
      const processedPhotos = [];
      for (const [configId, file] of photoMap) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          await client.query('ROLLBACK');
          return res.status(422).json({
            error: `Tipo de archivo no permitido: ${file.mimetype}. Se aceptan JPEG, PNG, WebP, HEIC.`,
            code: 422,
          });
        }

        if (file.size < MIN_SIZE_BYTES) {
          await client.query('ROLLBACK');
          return res.status(422).json({
            error: `La foto ${file.originalname} es demasiado pequena. Minimo 100 KB.`,
            code: 422,
          });
        }

        let metadata;
        try {
          metadata = await sharp(file.buffer).metadata();
        } catch {
          await client.query('ROLLBACK');
          return res.status(422).json({ error: `El archivo ${file.originalname} no es una imagen valida.`, code: 422 });
        }

        if (!metadata.width || !metadata.height || metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
          await client.query('ROLLBACK');
          return res.status(422).json({
            error: `La foto ${file.originalname} tiene dimensiones insuficientes. Minimo ${MIN_WIDTH}x${MIN_HEIGHT} px.`,
            code: 422,
          });
        }

        const exifData = await extractExif(file.buffer);
        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';

        processedPhotos.push({ configId, file, exifData, ext });
      }

      // Insert inspection
      const publicCode = await generateUniqueCode(client);
      const { rows: inspRows } = await client.query(
        `INSERT INTO inspections (collaborator_id, plate, vehicle_type, inspection_date, public_code)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [collaboratorId, plate, vehicle_type, today, publicCode]
      );
      const inspectionId = inspRows[0].id;

      // Insert answers
      for (const ans of answers) {
        await client.query(
          `INSERT INTO inspection_answers (inspection_id, question_id, answer, observations)
           VALUES ($1, $2, $3, $4)`,
          [inspectionId, ans.question_id, ans.answer ?? null, ans.observations ?? null]
        );
      }

      // Save photo files to disk and insert records
      const year = today.substring(0, 4);
      const month = today.substring(5, 7);
      const uploadsDir = process.env.UPLOADS_DIR || '/app/uploads';
      const photoDir = path.join(uploadsDir, year, month, `${cedula}_${plate}`);
      await fs.mkdir(photoDir, { recursive: true });

      for (const { configId, file, exifData, ext } of processedPhotos) {
        const timestamp = Date.now();
        const filename = `${configId}_${timestamp}.${ext}`;
        const filePath = path.join(photoDir, filename);
        const relPath = path.join(year, month, `${cedula}_${plate}`, filename);

        await fs.writeFile(filePath, file.buffer);
        savedFilePaths.push(filePath);

        await client.query(
          `INSERT INTO inspection_photos
             (inspection_id, photo_config_id, file_path, original_filename, mime_type, file_size_bytes,
              exif_date, exif_lat, exif_lng, exif_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            inspectionId,
            configId,
            relPath,
            file.originalname,
            file.mimetype,
            file.size,
            exifData.exif_date,
            exifData.exif_lat,
            exifData.exif_lng,
            exifData.exif_available,
          ]
        );
      }

      await client.query('COMMIT');

      logger.info({ component: 'inspection', inspectionId, cedula, plate, photos: processedPhotos.length }, 'Inspeccion registrada.');

      res.status(201).json({
        inspection_id: inspectionId,
        inspection_date: today,
        collaborator_id: collaboratorId,
        photos_uploaded: processedPhotos.length,
        message: 'Inspeccion registrada correctamente',
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      // Clean up any files written before the error
      for (const fp of savedFilePaths) {
        await fs.unlink(fp).catch(() => {});
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    // Clean up files if error was thrown outside transaction block
    for (const fp of savedFilePaths) {
      await fs.unlink(fp).catch(() => {});
    }
    next(err);
  }
});

export default router;
