import { Router } from 'express';
import ExcelJS from 'exceljs';
import pool from '../../db.js';
import { signedPhotoPath } from '../../utils/photoSign.js';

const router = Router();

function buildWhereClause(query) {
  const conditions = [];
  const params = [];

  if (query.cedula) {
    params.push(`%${query.cedula}%`);
    conditions.push(`c.cedula ILIKE $${params.length}`);
  }
  if (query.plate) {
    params.push(`%${query.plate.toUpperCase()}%`);
    conditions.push(`i.plate ILIKE $${params.length}`);
  }
  if (query.name) {
    params.push(`%${query.name}%`);
    const p = params.length;
    conditions.push(`(c.first_name ILIKE $${p} OR c.last_name ILIKE $${p})`);
  }
  if (query.vehicle_type) {
    params.push(query.vehicle_type);
    conditions.push(`i.vehicle_type = $${params.length}`);
  }
  if (query.date_from) {
    params.push(query.date_from);
    conditions.push(`i.inspection_date >= $${params.length}`);
  }
  if (query.date_to) {
    params.push(query.date_to);
    conditions.push(`i.inspection_date <= $${params.length}`);
  }
  if (query.has_malo === 'true') {
    conditions.push(
      `EXISTS (SELECT 1 FROM inspection_answers ia WHERE ia.inspection_id = i.id AND ia.answer = 'malo')`
    );
  }

  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

/**
 * @openapi
 * /admin/inspections/export:
 *   get:
 *     summary: Exportar inspecciones a Excel
 *     tags: [admin-inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo Excel
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', async (req, res, next) => {
  try {
    const { where, params } = buildWhereClause(req.query);

    const { rows: answerRows } = await pool.query(
      `SELECT
        to_char(i.inspection_date, 'YYYY-MM-DD') AS fecha,
        c.cedula, c.first_name AS nombre, c.last_name AS apellidos,
        i.plate AS placa, i.vehicle_type AS tipo,
        s.name AS seccion, q.text AS pregunta,
        ia.answer AS respuesta, ia.observations AS observaciones,
        i.id AS inspection_id
       FROM inspection_answers ia
       JOIN inspections i ON i.id = ia.inspection_id
       JOIN collaborators c ON c.id = i.collaborator_id
       JOIN questions q ON q.id = ia.question_id
       JOIN sections s ON s.id = q.section_id
       ${where}
       ORDER BY i.inspection_date DESC, c.cedula, s.display_order, q.display_order`,
      params
    );

    const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');
    const inspIds = [...new Set(answerRows.map((r) => r.inspection_id))];
    const photoMap = new Map();
    if (inspIds.length > 0) {
      const { rows: photoRows } = await pool.query(
        `SELECT inspection_id, id FROM inspection_photos WHERE inspection_id = ANY($1) ORDER BY id`,
        [inspIds]
      );
      for (const p of photoRows) {
        const existing = photoMap.get(p.inspection_id) || [];
        existing.push(p.id);
        photoMap.set(p.inspection_id, existing);
      }
    }
    const maxPhotos = photoMap.size ? Math.max(...[...photoMap.values()].map((a) => a.length)) : 0;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inspecciones');

    const photoColumns = Array.from({ length: maxPhotos }, (_, i) => ({
      header: `Foto ${i + 1}`, key: `foto_${i + 1}`, width: 16,
    }));

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Cedula', key: 'cedula', width: 14 },
      { header: 'Nombre', key: 'nombre', width: 18 },
      { header: 'Apellidos', key: 'apellidos', width: 18 },
      { header: 'Placa', key: 'placa', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 8 },
      { header: 'Seccion', key: 'seccion', width: 22 },
      { header: 'Pregunta', key: 'pregunta', width: 40 },
      { header: 'Respuesta', key: 'respuesta', width: 12 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
      ...photoColumns,
    ];
    sheet.getRow(1).font = { bold: true };

    const RESPUESTA_LABEL = { bueno: 'Bueno', malo: 'Malo', no_aplica: 'No aplica' };

    for (const row of answerRows) {
      const rowObj = {
        fecha: row.fecha, cedula: row.cedula, nombre: row.nombre, apellidos: row.apellidos,
        placa: row.placa, tipo: row.tipo, seccion: row.seccion, pregunta: row.pregunta,
        respuesta: RESPUESTA_LABEL[row.respuesta] || '', observaciones: row.observaciones || '',
      };
      const photoIds = photoMap.get(row.inspection_id) || [];
      photoIds.forEach((pid, i) => {
        const url = `${APP_URL}${signedPhotoPath(pid)}`;
        rowObj[`foto_${i + 1}`] = { text: `Ver foto ${i + 1}`, hyperlink: url };
      });
      const added = sheet.addRow(rowObj);
      photoIds.forEach((_, i) => {
        const cell = added.getCell(`foto_${i + 1}`);
        cell.font = { color: { argb: 'FF1C7ED6' }, underline: true };
      });
    }

    const today = new Date().toISOString().substring(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inspecciones_${today}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/inspections:
 *   get:
 *     summary: Listar inspecciones con filtros y paginacion
 *     tags: [admin-inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista paginada de inspecciones
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const { where, params } = buildWhereClause(req.query);

    const [{ rows: [{ total }] }, { rows: data }] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM inspections i JOIN collaborators c ON c.id = i.collaborator_id ${where}`, params),
      pool.query(
        `SELECT
          i.id, to_char(i.inspection_date, 'YYYY-MM-DD') AS inspection_date,
          i.created_at, i.plate, i.vehicle_type,
          json_build_object('id', c.id, 'cedula', c.cedula, 'first_name', c.first_name, 'last_name', c.last_name) AS collaborator,
          (SELECT json_build_object(
            'bueno', COUNT(*) FILTER (WHERE ia.answer = 'bueno'),
            'malo', COUNT(*) FILTER (WHERE ia.answer = 'malo'),
            'other_filled', COUNT(*) FILTER (WHERE ia.answer IS NULL AND ia.observations IS NOT NULL AND ia.observations != '')
          ) FROM inspection_answers ia WHERE ia.inspection_id = i.id) AS answers_summary,
          (SELECT COUNT(*)::int FROM inspection_photos ip WHERE ip.inspection_id = i.id) AS photos_count
         FROM inspections i JOIN collaborators c ON c.id = i.collaborator_id
         ${where}
         ORDER BY i.inspection_date DESC, i.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/inspections/{id}:
 *   get:
 *     summary: Detalle completo de inspeccion
 *     tags: [admin-inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle de inspeccion
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return next();

    const { rows: [insp] } = await pool.query(
      `SELECT i.id, to_char(i.inspection_date, 'YYYY-MM-DD') AS inspection_date,
              i.created_at, i.plate, i.vehicle_type,
              json_build_object('id', c.id, 'cedula', c.cedula, 'first_name', c.first_name, 'last_name', c.last_name) AS collaborator
       FROM inspections i JOIN collaborators c ON c.id = i.collaborator_id WHERE i.id = $1`,
      [id]
    );
    if (!insp) return res.status(404).json({ error: 'Inspeccion no encontrada', code: 404 });

    const { rows: answers } = await pool.query(
      `SELECT ia.id, ia.answer, ia.observations,
              q.id AS question_id, q.text AS question_text, q.is_other,
              s.id AS section_id, s.name AS section_name
       FROM inspection_answers ia
       JOIN questions q ON q.id = ia.question_id
       JOIN sections s ON s.id = q.section_id
       WHERE ia.inspection_id = $1 ORDER BY s.display_order, q.display_order`,
      [id]
    );

    const { rows: photos } = await pool.query(
      `SELECT ip.id, ip.file_path, ip.original_filename, ip.mime_type, ip.file_size_bytes,
              ip.exif_date, ip.exif_lat, ip.exif_lng, ip.exif_available,
              pc.label AS config_label
       FROM inspection_photos ip LEFT JOIN photo_configs pc ON pc.id = ip.photo_config_id
       WHERE ip.inspection_id = $1`,
      [id]
    );

    const sectionMap = {};
    for (const a of answers) {
      if (!sectionMap[a.section_id]) {
        sectionMap[a.section_id] = { id: a.section_id, name: a.section_name, answers: [] };
      }
      sectionMap[a.section_id].answers.push({
        id: a.id, answer: a.answer, observations: a.observations,
        question_id: a.question_id, question_text: a.question_text, is_other: a.is_other,
      });
    }

    const photosWithUrl = photos.map((p) => ({
      ...p, url: signedPhotoPath(p.id),
    }));

    res.json({ ...insp, sections: Object.values(sectionMap), photos: photosWithUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
