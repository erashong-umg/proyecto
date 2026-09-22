import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error('[Error no controlado]', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
};
