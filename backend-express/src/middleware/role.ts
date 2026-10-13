import type { Request, Response, NextFunction } from 'express';
import { Forbidden } from '../utils/errors';
import type { UserRole } from '../types/express';

export const roleMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Forbidden('Autenticación requerida.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(Forbidden(`Rol requerido: ${allowedRoles.join(' o ')}. Su rol es: ${req.user.role}.`));
    }
    next();
  };
};
