import { z } from 'zod';

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

export const googleStubSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  photoUrl: z.string().url().optional(),
  role: z.enum(['student', 'tutor']).default('student'),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleStubInput = z.infer<typeof googleStubSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
