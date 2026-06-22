// ID publico de inspeccion: 6 caracteres alfanumericos, sin 0/O/1/I/L para legibilidad
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genInspectionCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return s;
}

// Genera un codigo unico verificando contra la BD (reintenta ante colision)
export async function generateUniqueCode(client) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = genInspectionCode();
    const { rows } = await client.query('SELECT 1 FROM inspections WHERE public_code = $1', [code]);
    if (rows.length === 0) return code;
  }
  throw new Error('No se pudo generar un ID unico de inspeccion');
}
