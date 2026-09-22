import type { Request, Response, NextFunction } from 'express';
import { COOKIE_NAME, verifyToken } from '../utils/jwt';
import { Unauthorized } from '../utils/errors';
import { User } from '../models/User';

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) throw Unauthorized('No hay sesión activa. Por favor, inicie sesión.');

    const decoded = verifyToken(token);

    // Verificar que el usuario aún existe y su estado actual
    const user = await User.findById(decoded.id).select('role status name email').lean();
    if (!user) throw Unauthorized('Usuario no encontrado.');

    req.user = {
      id: decoded.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};
