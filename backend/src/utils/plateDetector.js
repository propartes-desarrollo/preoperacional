export function detectVehicleType(plate) {
  const cleaned = plate.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) return null;
  if (/^[A-Z]{3}\d{3}$/.test(cleaned)) return 'auto';
  if (/^[A-Z]{3}\d{2}[A-Z]$/.test(cleaned)) return 'moto';
  return null;
}

export function normalizePlate(plate) {
  return plate.toUpperCase().replace(/\s/g, '');
}

export function validatePlateFormat(plate) {
  return /^[A-Z0-9]{6}$/.test(plate.toUpperCase().replace(/\s/g, ''));
}
