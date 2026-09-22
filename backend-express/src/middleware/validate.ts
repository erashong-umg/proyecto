import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequest } from '../utils/errors';

export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const result = schema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten();
      return next(BadRequest('Datos inválidos', flat.fieldErrors));
    }
    // Reemplazar con datos limpios (sin strings vacíos, sin campos extras)
    if (source === 'body') req.body = result.data;
    else if (source === 'query') (req as any).validatedQuery = result.data;
    next();
  };
};
