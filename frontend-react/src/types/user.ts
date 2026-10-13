export type UserRole = 'student' | 'tutor' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface Address {
  street: string;
  coords: { lat: number; lng: number };
}

export interface TutorData {
  bio: string;
  cvUrl: string;
  portfolioUrl?: string;
  baseRate: number;
  ratePerKm: number;
  categories: string[];
  avgRating: number;
  reviewCount: number;
  approved: boolean;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  onboardingCompleted: boolean;
  photoUrl?: string;
  phone?: string;
  gender?: 'M' | 'F' | 'other';
  address?: Address;
  categoryIds: string[];
  tutorData?: TutorData;
  suspensionReason?: string;
  suspensionDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
