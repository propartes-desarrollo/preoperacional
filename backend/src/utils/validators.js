import { z } from 'zod';

export const cedulaSchema = z.string().regex(/^\d{6,12}$/, 'Cedula debe ser numerica de 6 a 12 digitos');

export const plateSchema = z
  .string()
  .transform((v) => v.toUpperCase().replace(/\s/g, ''))
  .pipe(z.string().length(6).regex(/^[A-Z0-9]{6}$/, 'Placa debe ser 6 caracteres alfanumericos'));

export const vehicleTypeSchema = z.enum(['auto', 'moto']);

export const answerSchema = z.object({
  question_id: z.number().int().positive(),
  answer: z.enum(['bueno', 'malo']).nullable().optional().default(null),
  observations: z.string().max(1000).nullable().optional().default(null),
});

export const inspectionSubmitSchema = z.object({
  cedula: cedulaSchema,
  nombre: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  placa: plateSchema,
  vehicle_type: vehicleTypeSchema,
  answers: z.array(answerSchema).min(1),
});
