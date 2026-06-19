import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import pool from '../db.js';
import { verifyPhoto } from '../utils/photoSign.js';

const router = Router();
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

/**
 * @openapi
 * /inspection-photos/{photoId}:
 *   get:
 *     summary: Servir foto de inspeccion mediante URL firmada (publico)
 *     tags: [Publico]
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: exp
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: sig
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archivo de imagen
 *       403:
 *         description: Enlace invalido o expirado
 */
router.get('/:photoId', async (req, res, next) => {
  try {
    const photoId = parseInt(req.params.photoId, 10);
    if (isNaN(photoId)) return res.status(400).json({ error: 'ID invalido', code: 400 });

    if (!verifyPhoto(photoId, req.query.exp, req.query.sig)) {
      return res.status(403).json({ error: 'Enlace invalido o expirado', code: 403 });
    }

    const { rows: [photo] } = await pool.query(
      'SELECT file_path, mime_type FROM inspection_photos WHERE id = $1',
      [photoId]
    );
    if (!photo) return res.status(404).json({ error: 'Foto no encontrada', code: 404 });

    const absolutePath = path.join(UPLOADS_DIR, photo.file_path);
    try {
      await fs.access(absolutePath);
    } catch {
      return res.status(404).json({ error: 'Archivo no encontrado en disco', code: 404 });
    }

    res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    createReadStream(absolutePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
