import { z } from 'zod';
import { INVARIANT_THEME_KEYS, REACTIVE_THEME_KEYS } from '../models/ThemeSettings';

export const registerSchema = z.object({
  email: z.string().email('Correo inválido').toLowerCase().trim(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  role: z.enum(['student', 'tutor']),
});

export const loginSchema = z.object({
  email: z.string().email('Correo inválido').toLowerCase().trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// `credential` es el ID token (JWT) que entrega el botón de Google Identity
// Services. `role` solo aplica al crear una cuenta nueva (pantalla de registro).
export const googleAuthSchema = z.object({
  credential: z.string().min(20, 'Credencial de Google inválida'),
  role: z.enum(['student', 'tutor']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// Documento de identificación personal. DPI guatemalteco: 13 dígitos (se
// aceptan espacios o guiones al escribirlo, p. ej. "1234 56789 0101").
// Pasaporte: 6 a 20 letras o números. Se guarda normalizado.
export const idDocumentSchema = z
  .object({
    type: z.enum(['dpi', 'pasaporte'], { message: 'Seleccione el tipo de documento' }),
    number: z.string({ message: 'Ingrese el número de documento' }),
  })
  .transform((doc) => ({ type: doc.type, number: doc.number.replace(/[\s-]/g, '').toUpperCase() }))
  .superRefine((doc, ctx) => {
    if (doc.type === 'dpi' && !/^\d{13}$/.test(doc.number)) {
      ctx.addIssue({ code: 'custom', path: ['number'], message: 'El DPI debe tener 13 dígitos' });
    }
    if (doc.type === 'pasaporte' && !/^[A-Z0-9]{6,20}$/.test(doc.number)) {
      ctx.addIssue({ code: 'custom', path: ['number'], message: 'El pasaporte debe tener entre 6 y 20 letras o números' });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Valida un color hexadecimal de 6 dígitos (el mismo formato que produce
// <input type="color"> en el navegador) — rechaza cualquier otro valor para
// que no termine un string arbitrario dentro de una custom property CSS.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hexadecimal, ej. #b73e17');

const invariantShape = Object.fromEntries(
  INVARIANT_THEME_KEYS.map((key) => [key, hexColor.optional()])
);
const reactiveShape = Object.fromEntries(
  REACTIVE_THEME_KEYS.map((key) => [key, hexColor.optional()])
);

export const themeSettingsSchema = z.object({
  invariant: z.object(invariantShape).partial().optional(),
  light: z.object(reactiveShape).partial().optional(),
  dark: z.object(reactiveShape).partial().optional(),
});

export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
