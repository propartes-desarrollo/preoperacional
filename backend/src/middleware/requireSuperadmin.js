export function requireSuperadmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Permisos insuficientes', code: 403 });
  }
  next();
}
