import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import pool from '../../db.js';
import { normalizePlate, detectVehicleType } from '../../utils/plateDetector.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function validateCsvRow(row, index) {
  const errors = [];
  const cedula = (row.cedula || '').trim();
  const first_name = (row.first_name || '').trim();
  const last_name = (row.last_name || '').trim();
  const phone = (row.phone || '').trim();
  const plate = (row.plate || '').trim().toUpperCase().replace(/\s/g, '');
  const vehicle_type = (row.vehicle_type || '').trim();
  const is_active = (row.is_active || 'true').trim();

  if (!/^\d{6,12}$/.test(cedula)) errors.push({ row: index, field: 'cedula', value: cedula, error: 'Debe ser numerica de 6-12 digitos' });
  if (!first_name || first_name.length < 2) errors.push({ row: index, field: 'first_name', value: first_name, error: 'Requerido, minimo 2 caracteres' });
  if (!last_name || last_name.length < 2) errors.push({ row: index, field: 'last_name', value: last_name, error: 'Requerido, minimo 2 caracteres' });
  if (plate && !/^[A-Z0-9]{6}$/.test(plate)) errors.push({ row: index, field: 'plate', value: plate, error: 'Placa debe ser 6 caracteres alfanumericos' });
  if (plate && vehicle_type && !['auto', 'moto', ''].includes(vehicle_type)) {
    errors.push({ row: index, field: 'vehicle_type', value: vehicle_type, error: 'Debe ser auto o moto' });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { cedula, first_name, last_name, phone: phone || null, plate: plate || null, vehicle_type: vehicle_type || null, is_active: is_active !== 'false' },
  };
}

async function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    const stream = Readable.from(buffer.toString('utf-8'));
    stream
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row) => records.push(row))
      .on('error', reject)
      .on('end', () => resolve(records));
  });
}

/**
 * @openapi
 * /admin/collaborators/export:
 *   get:
 *     summary: Exportar colaboradores a Excel
 *     tags: [admin-collaborators]
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
    const conditions = [];
    const params = [];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      const p = params.length;
      conditions.push(`(c.cedula ILIKE $${p} OR c.first_name ILIKE $${p} OR c.last_name ILIKE $${p})`);
    }
    if (req.query.is_active !== undefined) {
      params.push(req.query.is_active === 'true');
      conditions.push(`c.is_active = $${params.length}`);
    }
    if (req.query.frequency) {
      params.push(req.query.frequency);
      conditions.push(`c.inspection_frequency = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT c.cedula, c.first_name, c.last_name, c.phone,
              c.inspection_frequency, c.is_active,
              (
                SELECT string_agg(cv.plate || ' (' || cv.vehicle_type || ')', ', ' ORDER BY cv.plate)
                FROM collaborator_vehicles cv WHERE cv.collaborator_id = c.id
              ) AS vehiculos,
              (
                SELECT to_char(MAX(i.inspection_date), 'DD/MM/YYYY')
                FROM inspections i WHERE i.collaborator_id = c.id
              ) AS ultima_inspeccion
       FROM collaborators c ${where}
       ORDER BY c.last_name, c.first_name`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Colaboradores');

    sheet.columns = [
      { header: 'Cedula',            key: 'cedula',             width: 16 },
      { header: 'Nombre',            key: 'first_name',         width: 18 },
      { header: 'Apellidos',         key: 'last_name',          width: 18 },
      { header: 'Telefono',          key: 'phone',              width: 16 },
      { header: 'Frecuencia',        key: 'inspection_frequency', width: 14 },
      { header: 'Estado',            key: 'is_active',          width: 12 },
      { header: 'Vehiculos',         key: 'vehiculos',          width: 30 },
      { header: 'Ultima inspeccion', key: 'ultima_inspeccion',  width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const row of rows) {
      sheet.addRow({
        cedula:               row.cedula,
        first_name:           row.first_name,
        last_name:            row.last_name,
        phone:                row.phone || '',
        inspection_frequency: row.inspection_frequency === 'daily' ? 'Diario' : 'Eventual',
        is_active:            row.is_active ? 'Activo' : 'Inactivo',
        vehiculos:            row.vehiculos || '',
        ultima_inspeccion:    row.ultima_inspeccion || 'Sin registros',
      });
    }

    const today = new Date().toISOString().substring(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="colaboradores_${today}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborators:
 *   get:
 *     summary: Listar colaboradores con paginacion y busqueda
 *     tags: [admin-collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Lista de colaboradores
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      const p = params.length;
      conditions.push(`(c.cedula ILIKE $${p} OR c.first_name ILIKE $${p} OR c.last_name ILIKE $${p})`);
    }
    if (req.query.is_active !== undefined) {
      params.push(req.query.is_active === 'true');
      conditions.push(`c.is_active = $${params.length}`);
    }
    if (req.query.frequency) {
      params.push(req.query.frequency);
      conditions.push(`c.inspection_frequency = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [{ rows: [{ total }] }, { rows }] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM collaborators c ${where}`, params),
      pool.query(
        `SELECT c.id, c.cedula, c.first_name, c.last_name, c.phone, c.is_active, c.inspection_frequency,
                (
                  SELECT json_agg(json_build_object('id', cv.id, 'plate', cv.plate, 'vehicle_type', cv.vehicle_type))
                  FROM collaborator_vehicles cv WHERE cv.collaborator_id = c.id
                ) AS vehicles,
                (
                  SELECT to_char(MAX(i.inspection_date), 'YYYY-MM-DD')
                  FROM inspections i WHERE i.collaborator_id = c.id
                ) AS last_inspection_date
         FROM collaborators c ${where}
         ORDER BY c.last_name, c.first_name
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    res.json({ data: rows, total, page, limit });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborators:
 *   post:
 *     summary: Crear colaborador con vehiculos
 *     tags: [admin-collaborators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Creado
 */
router.post('/', async (req, res, next) => {
  try {
    const { cedula, first_name, last_name, phone, is_active, inspection_frequency, vehicles } = req.body;
    if (!cedula || !first_name || !last_name) {
      return res.status(400).json({ error: 'cedula, first_name y last_name son requeridos', code: 400 });
    }
    if (!/^\d{6,12}$/.test(cedula)) {
      return res.status(400).json({ error: 'Cedula invalida', code: 400 });
    }

    const { rows: existing } = await pool.query('SELECT id FROM collaborators WHERE cedula = $1', [cedula]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'La cedula ya esta registrada', code: 409 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const freq = ['daily', 'eventual'].includes(inspection_frequency) ? inspection_frequency : 'daily';
      const { rows: [col] } = await client.query(
        `INSERT INTO collaborators (cedula, first_name, last_name, phone, is_active, inspection_frequency)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [cedula, first_name, last_name, phone || null, is_active ?? true, freq]
      );

      const insertedVehicles = [];
      for (const v of (vehicles || [])) {
        const plate = normalizePlate(v.plate);
        if (!/^[A-Z0-9]{6}$/.test(plate)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Placa invalida: ${v.plate}`, code: 400 });
        }
        const vt = v.vehicle_type || detectVehicleType(plate) || null;
        const { rows: [vehicle] } = await client.query(
          `INSERT INTO collaborator_vehicles (collaborator_id, plate, vehicle_type) VALUES ($1, $2, $3) RETURNING *`,
          [col.id, plate, vt]
        );
        insertedVehicles.push(vehicle);
      }

      await client.query('COMMIT');
      res.status(201).json({ ...col, vehicles: insertedVehicles });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborators/{id}:
 *   put:
 *     summary: Actualizar colaborador
 *     tags: [admin-collaborators]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizado
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { first_name, last_name, phone, is_active, inspection_frequency, vehicles } = req.body;
    const { rows: [col] } = await pool.query('SELECT id FROM collaborators WHERE id = $1', [req.params.id]);
    if (!col) return res.status(404).json({ error: 'No encontrado', code: 404 });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const freq = ['daily', 'eventual'].includes(inspection_frequency) ? inspection_frequency : null;
      const { rows: [updated] } = await client.query(
        `UPDATE collaborators SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          is_active = COALESCE($4, is_active),
          inspection_frequency = COALESCE($5, inspection_frequency)
         WHERE id = $6 RETURNING *`,
        [first_name, last_name, phone, is_active, freq, req.params.id]
      );

      if (Array.isArray(vehicles)) {
        // Remove vehicles not in new list (only if no inspections)
        const { rows: currentVehicles } = await client.query(
          'SELECT id, plate FROM collaborator_vehicles WHERE collaborator_id = $1',
          [req.params.id]
        );
        const newPlates = new Set(vehicles.map((v) => normalizePlate(v.plate)));
        for (const cv of currentVehicles) {
          if (!newPlates.has(cv.plate)) {
            const { rows: [{ count }] } = await client.query(
              'SELECT COUNT(*)::int AS count FROM inspections WHERE collaborator_id = $1 AND plate = $2',
              [req.params.id, cv.plate]
            );
            if (count === 0) {
              await client.query('DELETE FROM collaborator_vehicles WHERE id = $1', [cv.id]);
            }
          }
        }

        // Add new vehicles
        for (const v of vehicles) {
          const plate = normalizePlate(v.plate);
          const { rows: exists } = await client.query(
            'SELECT id FROM collaborator_vehicles WHERE collaborator_id = $1 AND plate = $2',
            [req.params.id, plate]
          );
          if (exists.length === 0) {
            const vt = v.vehicle_type || detectVehicleType(plate) || null;
            await client.query(
              'INSERT INTO collaborator_vehicles (collaborator_id, plate, vehicle_type) VALUES ($1, $2, $3)',
              [req.params.id, plate, vt]
            );
          } else if (v.vehicle_type) {
            await client.query(
              'UPDATE collaborator_vehicles SET vehicle_type = $1 WHERE id = $2',
              [v.vehicle_type, exists[0].id]
            );
          }
        }
      }

      await client.query('COMMIT');

      const { rows: finalVehicles } = await pool.query(
        'SELECT id, plate, vehicle_type FROM collaborator_vehicles WHERE collaborator_id = $1',
        [req.params.id]
      );
      res.json({ ...updated, vehicles: finalVehicles });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborators/{id}:
 *   delete:
 *     summary: Eliminar colaborador (soft o hard delete)
 *     tags: [admin-collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hard
 *         schema: { type: boolean }
 *     responses:
 *       204:
 *         description: Eliminado
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: [col] } = await pool.query('SELECT id FROM collaborators WHERE id = $1', [req.params.id]);
    if (!col) return res.status(404).json({ error: 'No encontrado', code: 404 });

    if (req.query.hard === 'true') {
      const { rows: [{ count }] } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM inspections WHERE collaborator_id = $1',
        [req.params.id]
      );
      if (count > 0) {
        return res.status(409).json({ error: 'No se puede eliminar: tiene inspecciones asociadas', code: 409 });
      }
      await pool.query('DELETE FROM collaborators WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE collaborators SET is_active = false WHERE id = $1', [req.params.id]);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /admin/collaborators/import-csv:
 *   post:
 *     summary: Importar colaboradores desde CSV
 *     tags: [admin-collaborators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: confirm
 *         schema: { type: boolean }
 *         description: Si true, ejecuta la importacion real. Si false (default), retorna dry-run.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resultado del dry-run o importacion
 */
router.post('/import-csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere un archivo CSV', code: 400 });
    }

    let records;
    try {
      records = await parseCsv(req.file.buffer);
    } catch (err) {
      return res.status(400).json({ error: `Error al parsear CSV: ${err.message}`, code: 400 });
    }

    const validRows = [];
    const allErrors = [];

    for (let i = 0; i < records.length; i++) {
      const result = validateCsvRow(records[i], i + 2); // +2 for header row
      if (result.valid) {
        validRows.push(result.data);
      } else {
        allErrors.push(...result.errors);
      }
    }

    // Check existing cedulas for create/update classification
    const cedulas = validRows.map((r) => r.cedula);
    const { rows: existingCols } = cedulas.length > 0
      ? await pool.query('SELECT cedula FROM collaborators WHERE cedula = ANY($1)', [cedulas])
      : { rows: [] };
    const existingSet = new Set(existingCols.map((r) => r.cedula));

    const willCreate = validRows.filter((r) => !existingSet.has(r.cedula)).length;
    const willUpdate = validRows.filter((r) => existingSet.has(r.cedula)).length;

    if (req.query.confirm !== 'true') {
      return res.json({
        dry_run: true,
        total_rows: records.length,
        valid_rows: validRows.length,
        invalid_rows: allErrors.length > 0 ? records.length - validRows.length : 0,
        errors: allErrors,
        will_create: willCreate,
        will_update: willUpdate,
        preview: validRows.slice(0, 10),
      });
    }

    // Execute real import
    let created = 0;
    let updated = 0;
    const importErrors = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const row of validRows) {
        try {
          if (existingSet.has(row.cedula)) {
            await client.query(
              `UPDATE collaborators SET first_name = $1, last_name = $2, phone = $3, is_active = $4 WHERE cedula = $5`,
              [row.first_name, row.last_name, row.phone, row.is_active, row.cedula]
            );
            updated++;
          } else {
            const { rows: [col] } = await client.query(
              `INSERT INTO collaborators (cedula, first_name, last_name, phone, is_active)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [row.cedula, row.first_name, row.last_name, row.phone, row.is_active]
            );

            if (row.plate) {
              const vt = row.vehicle_type || detectVehicleType(row.plate) || null;
              const { rows: existsVehicle } = await client.query(
                'SELECT id FROM collaborators WHERE cedula = $1',
                [row.cedula]
              );
              await client.query(
                `INSERT INTO collaborator_vehicles (collaborator_id, plate, vehicle_type) VALUES ($1, $2, $3)
                 ON CONFLICT (collaborator_id, plate) DO NOTHING`,
                [col.id, row.plate, vt]
              );
            }
            created++;
          }

          // Add vehicle if plate provided and collaborator already existed
          if (row.plate && existingSet.has(row.cedula)) {
            const { rows: [col] } = await client.query('SELECT id FROM collaborators WHERE cedula = $1', [row.cedula]);
            const vt = row.vehicle_type || detectVehicleType(row.plate) || null;
            await client.query(
              `INSERT INTO collaborator_vehicles (collaborator_id, plate, vehicle_type)
               VALUES ($1, $2, $3) ON CONFLICT (collaborator_id, plate) DO NOTHING`,
              [col.id, row.plate, vt]
            );
          }
        } catch (err) {
          importErrors.push({ cedula: row.cedula, error: err.message });
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ created, updated, errors: importErrors });
  } catch (err) {
    next(err);
  }
});

export default router;
