export function validateCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') return 'La cedula es requerida';
  if (!/^\d+$/.test(cedula)) return 'La cedula debe contener solo numeros';
  if (cedula.length < 5 || cedula.length > 15) return 'La cedula debe tener entre 5 y 15 digitos';
  return null;
}

export function validateNombre(nombre) {
  if (!nombre || nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
  return null;
}

export function validateApellidos(apellidos) {
  if (!apellidos || !apellidos.trim()) return 'Los apellidos son requeridos';
  const words = apellidos.trim().split(/\s+/);
  if (words.length < 2) return 'Ingresa al menos dos apellidos';
  if (words.some((w) => w.length < 3)) return 'Cada apellido debe tener al menos 3 letras';
  return null;
}

export function validatePlaca(placa) {
  if (!placa) return 'La placa es requerida';
  if (!/^[A-Za-z0-9]{6}$/.test(placa.replace(/\s/g, '')))
    return 'La placa debe tener 6 caracteres alfanumericos';
  return null;
}
