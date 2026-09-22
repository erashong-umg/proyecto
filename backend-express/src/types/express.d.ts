import 'express';
import { Types } from 'mongoose';

export type UserRole = 'student' | 'tutor' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface IAddress {
  street: string;
  coords: {
    lat: number;
    lng: number;
  };
}

export interface ITutorData {
  bio: string;
  cvUrl: string;          // D5: solo URL string
  portfolioUrl?: string;
  baseRate: number;        // Q/hora
  ratePerKm: number;       // Q/km
  categories: Types.ObjectId[];
  avgRating: number;
  reviewCount: number;
  approved: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
