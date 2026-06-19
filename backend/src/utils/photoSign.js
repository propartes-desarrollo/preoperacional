import crypto from 'crypto';

// Las URLs firmadas viven 30 dias (las fotos se eliminan a los 90 dias de todas formas).
const DEFAULT_TTL = 60 * 60 * 24 * 30;

function secret() {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function signPhoto(photoId, ttlSeconds = DEFAULT_TTL) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = crypto.createHmac('sha256', secret()).update(`${photoId}.${exp}`).digest('hex');
  return { exp, sig };
}

export function verifyPhoto(photoId, exp, sig) {
  if (!exp || !sig) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto.createHmac('sha256', secret()).update(`${photoId}.${expNum}`).digest('hex');
  const a = Buffer.from(String(sig));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Ruta relativa firmada (sirve para el navegador en la misma app)
export function signedPhotoPath(photoId, ttlSeconds = DEFAULT_TTL) {
  const { exp, sig } = signPhoto(photoId, ttlSeconds);
  return `/api/v1/inspection-photos/${photoId}?exp=${exp}&sig=${sig}`;
}
