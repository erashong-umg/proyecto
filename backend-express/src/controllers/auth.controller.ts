import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { env } from '../config/env';
import { verifyGoogleCredential } from '../services/google.service';
import {
  BadRequest, Unauthorized, Forbidden, NotFound, Conflict, ServiceUnavailable,
} from '../utils/errors';
import type {
  RegisterInput, LoginInput, GoogleAuthInput,
  ForgotPasswordInput, ResetPasswordInput,
} from '../utils/validators';

const buildAuthUserFromDoc = (doc: any) => ({
  id: doc._id.toString(),
  email: doc.email,
  name: doc.name,
  role: doc.role,
  status: doc.status,
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body as RegisterInput;

    const exists = await User.findOne({ email }).lean();
    if (exists) throw Conflict('Ya existe una cuenta con ese correo electrónico.');

    const user = await User.create({ email, password, name, role });

    const token = signToken(buildAuthUserFromDoc(user));
    res.status(201).json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    // select:false en password, hay que forzar la selección
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) throw Unauthorized('Correo o contraseña incorrectos.');

    const ok = await user.comparePassword(password);
    if (!ok) throw Unauthorized('Correo o contraseña incorrectos.');

    // Las cuentas suspendidas SÍ pueden iniciar sesión (requisito del enunciado) —
    // su navegación queda restringida a la vista de Suspensión por statusMiddleware
    // en el backend y por ProtectedRoute en el frontend, no bloqueando el login aquí.
    const token = signToken(buildAuthUserFromDoc(user));
    res.json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// El JWT es stateless (Bearer header) — no hay cookie ni estado de servidor que limpiar;
// el cliente simplemente descarta el token guardado.
export const logout = (_req: Request, res: Response): void => {
  res.json({ message: 'Sesión cerrada correctamente.' });
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const user = await User.findById(req.user.id)
      .select('email name role status onboardingCompleted photoUrl phone gender address categoryIds tutorData')
      .lean();
    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Inicio de sesión / registro con Google (OAuth 2.0 + OpenID Connect). El
// frontend entrega el ID token del botón de Google; aquí se verifica contra
// Google y se emite NUESTRO JWT, igual que en el login con contraseña.
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!env.GOOGLE_CLIENT_ID) throw ServiceUnavailable('El inicio de sesión con Google no está configurado.');

    const { credential, role } = req.body as GoogleAuthInput;
    const profile = await verifyGoogleCredential(credential);

    // 1) cuenta ya vinculada a este Google; 2) cuenta con el mismo correo.
    let user = await User.findOne({ googleId: profile.googleId })
      ?? await User.findOne({ email: profile.email });
    let isNewUser = false;

    if (user) {
      // El panel de administración tiene su propio acceso (/admin/login).
      if (user.role === 'admin') {
        throw Forbidden('Los administradores deben ingresar desde el panel de administración.');
      }
      if (user.googleId && user.googleId !== profile.googleId) {
        throw Conflict('Ese correo ya está vinculado a otra cuenta de Google.');
      }
      // Correo verificado por Google: se vincula la cuenta existente (registrada
      // con contraseña) y se completa la foto si faltaba.
      if (!user.googleId || (!user.photoUrl && profile.photoUrl)) {
        user.googleId = profile.googleId;
        if (!user.photoUrl && profile.photoUrl) user.photoUrl = profile.photoUrl;
        await user.save();
      }
    } else {
      user = await User.create({
        email: profile.email,
        name: profile.name,
        photoUrl: profile.photoUrl,
        googleId: profile.googleId,
        role: role ?? 'student',
        onboardingCompleted: false,
      });
      isNewUser = true;
    }

    const token = signToken(buildAuthUserFromDoc(user));
    res.json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      token,
      isNewUser,
    });
  } catch (error) {
    next(error);
  }
};

// Genera token de reset, lo loguea en consola (no hay email real)
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      // Por seguridad, no revelar si el email existe
      res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    console.log(`[Password Reset] Token para ${email}: ${token}`);

    res.json({
      message: 'Si el correo existe, se ha enviado un enlace de recuperación.',
      // Solo en development, devolvemos el token para que se pueda probar
      ...(process.env.NODE_ENV !== 'production' ? { devToken: token } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body as ResetPasswordInput;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +password');
    if (!user) throw BadRequest('Token inválido o expirado.');

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    next(error);
  }
};
