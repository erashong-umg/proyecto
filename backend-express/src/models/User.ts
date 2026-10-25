import mongoose, { Schema, model, Types, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IAddress, ITutorData, UserRole, UserStatus } from '../types/express';

export type IdDocumentType = 'dpi' | 'pasaporte';

export interface IIdDocument {
  type: IdDocumentType;
  number: string;           // normalizado: sin espacios ni guiones, en mayúsculas
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;        // ausente si viene de Google stub
  googleId?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  suspensionReason?: string;
  suspensionDate?: Date;
  onboardingCompleted: boolean;
  lastSeenAt?: Date;        // última desconexión del chat ("últ. vez")

  // Perfil
  photoUrl?: string;
  phone?: string;
  gender?: 'M' | 'F' | 'other';
  idDocument?: IIdDocument;  // documento de identificación personal (dato sensible, select: false)
  address?: IAddress;
  categoryIds: Types.ObjectId[];

  // Solo tutores
  tutorData?: ITutorData;

  // Reset password
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  comparePassword(plain: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { _id: false }
);

const tutorDataSchema = new Schema<ITutorData>(
  {
    bio: { type: String, required: true },
    cvUrl: { type: String, required: true },        // D5: solo URL string, sin upload
    portfolioUrl: { type: String },
    baseRate: { type: Number, required: true, min: 0 },
    ratePerKm: { type: Number, required: true, min: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    approved: { type: Boolean, default: false },
  },
  { _id: false }
);

const idDocumentSchema = new Schema<IIdDocument>(
  {
    type: { type: String, enum: ['dpi', 'pasaporte'], required: true },
    number: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['student', 'tutor', 'admin'], required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    suspensionReason: { type: String },
    suspensionDate: { type: Date },
    onboardingCompleted: { type: Boolean, default: false },
    lastSeenAt: { type: Date },

    photoUrl: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ['M', 'F', 'other'] },
    // Dato sensible: no se devuelve en ninguna consulta salvo que se pida con
    // .select('+idDocument') (hoy solo la revisión de tutores del admin).
    idDocument: { type: idDocumentSchema, select: false },
    address: { type: addressSchema },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],

    tutorData: { type: tutorDataSchema },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Un mismo documento no puede estar en dos cuentas. Parcial: las cuentas sin
// documento (admin, Google sin onboarding) no entran en el índice.
userSchema.index(
  { 'idDocument.type': 1, 'idDocument.number': 1 },
  { unique: true, partialFilterExpression: { 'idDocument.number': { $type: 'string' } } }
);

// Hash automático del password antes de guardar
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

export const User = model<IUser>('User', userSchema);
