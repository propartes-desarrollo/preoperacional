import { verifyJWT } from '../services/authService.js';
import pool from '../db.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado', code: 401 });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyJWT(token);
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado', code: 401 });
  }

  const { rows } = await pool.query(
    'SELECT id, email, name, role, is_active FROM admin_users WHERE id = $1',
    [payload.id]
  );

  if (rows.length === 0 || !rows[0].is_active) {
    return res.status(401).json({ error: 'Usuario inactivo', code: 401 });
  }

  req.user = {
    id: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    role: rows[0].role,
  };

  next();
}
