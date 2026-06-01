import pool from '../db.js';
import logger from '../utils/logger.js';

export async function findOrCreateCollaborator(client, { cedula, nombre, apellidos }) {
  const { rows } = await client.query(
    'SELECT id FROM collaborators WHERE cedula = $1',
    [cedula]
  );

  if (rows.length > 0) {
    return { collaboratorId: rows[0].id, created: false };
  }

  const { rows: inserted } = await client.query(
    `INSERT INTO collaborators (cedula, first_name, last_name, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING id`,
    [cedula, nombre, apellidos]
  );

  logger.info({ component: 'collaborator', cedula }, 'Nuevo colaborador registrado.');
  return { collaboratorId: inserted[0].id, created: true };
}

export async function ensureVehicleAssociation(client, collaboratorId, plate, vehicleType) {
  const { rows } = await client.query(
    'SELECT id FROM collaborator_vehicles WHERE collaborator_id = $1 AND plate = $2',
    [collaboratorId, plate]
  );

  if (rows.length === 0) {
    await client.query(
      'INSERT INTO collaborator_vehicles (collaborator_id, plate, vehicle_type) VALUES ($1, $2, $3)',
      [collaboratorId, plate, vehicleType]
    );
    logger.info({ component: 'collaborator', collaboratorId, plate }, 'Nueva asociacion vehiculo.');
  }
}

export async function findCollaboratorByCedula(cedula) {
  const { rows } = await pool.query(
    'SELECT id FROM collaborators WHERE cedula = $1',
    [cedula]
  );
  return rows.length > 0 ? rows[0] : null;
}
