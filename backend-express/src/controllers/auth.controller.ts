import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken, COOKIE_NAME, jwtCookieOptions } from '../utils/jwt';
import {
  BadRequest, Unauthorized, NotFound, Conflict,
} from '../utils/errors';
import type {
  RegisterInput, LoginInput, GoogleStubInput,
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
    res.cookie(COOKIE_NAME, token, jwtCookieOptions);
    res.status(201).json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
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

    if (user.status === 'suspended') {
      throw Unauthorized('Su cuenta está suspendida. Por favor, apele desde su perfil.');
    }

    const token = signToken(buildAuthUserFromDoc(user));
    res.cookie(COOKIE_NAME, token, jwtCookieOptions);
    res.json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
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

// Stub OAuth: simula el flujo de Google sin OAuth real (D4 del plan)
export const googleStub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name, photoUrl, role } = req.body as GoogleStubInput;

    let user = await User.findOne({ email });
    if (!user) {
      // Crear nuevo usuario sin password
      user = await User.create({
        email,
        name,
        photoUrl,
        role,
        onboardingCompleted: false,
      });
    }

    const token = signToken(buildAuthUserFromDoc(user));
    res.cookie(COOKIE_NAME, token, jwtCookieOptions);
    res.json({
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
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
