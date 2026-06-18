import { z } from 'zod';

export const cedulaSchema = z.string().regex(/^\d{6,12}$/, 'Cedula debe ser numerica de 6 a 12 digitos');

export const plateSchema = z
  .string()
  .transform((v) => v.toUpperCase().replace(/\s/g, ''))
  .pipe(z.string().length(6).regex(/^[A-Z0-9]{6}$/, 'Placa debe ser 6 caracteres alfanumericos'));

export const vehicleTypeSchema = z.enum(['auto', 'moto']);

export const answerSchema = z.object({
  question_id: z.number().int().positive(),
  answer: z.enum(['bueno', 'malo', 'no_aplica']).nullable().optional().default(null),
  observations: z.string().max(1000).nullable().optional().default(null),
});

export const nombreSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100)
  .transform((v) => v.toUpperCase());

export const apellidosSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .refine((v) => v.split(/\s+/).length >= 2, 'Ingrese al menos dos apellidos')
  .refine((v) => v.split(/\s+/).every((w) => w.length >= 3), 'Cada apellido debe tener al menos 3 letras')
  .transform((v) => v.toUpperCase());

export const inspectionSubmitSchema = z.object({
  cedula: cedulaSchema,
  nombre: nombreSchema,
  apellidos: apellidosSchema,
  placa: plateSchema,
  vehicle_type: vehicleTypeSchema,
  answers: z.array(answerSchema).min(1),
});
