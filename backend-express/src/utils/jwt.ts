import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser } from '../types/express';

export const signToken = (user: AuthUser): string => {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    options
  );
};

export const verifyToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AuthUser;
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
    status: decoded.status,
  };
};
