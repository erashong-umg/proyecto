import type { Request, Response, NextFunction } from 'express';
import { Forbidden } from '@/utils/errors';

// Rutas que un usuario suspendido SÍ puede acceder (apelación)
const SUSPENSION_ALLOWED = ['/api/auth/me', '/api/auth/logout', '/api/appeals'];

export const statusMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(); // sin usuario, asume que authMiddleware rechazó antes

  if (req.user.status === 'suspended') {
    const isAllowed = SUSPENSION_ALLOWED.some((path) => req.path.startsWith(path));
    if (!isAllowed) {
      return next(Forbidden('Su cuenta está suspendida. Por favor, apele desde su perfil.'));
    }
  }
  next();
};
