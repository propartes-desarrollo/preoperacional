import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateJWT(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
