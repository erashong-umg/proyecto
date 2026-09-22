import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export type Modality = 'virtual' | 'presencial-tutor' | 'presencial-estudiante';

export interface ICourse extends Document {
  _id: Types.ObjectId;
  tutorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  description: string;
  modalities: Modality[];
  baseRate: number;        // Q/hora
  ratePerKm: number;       // Q/km (solo si modalidad incluye presencial-estudiante)
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    modalities: [{
      type: String,
      enum: ['virtual', 'presencial-tutor', 'presencial-estudiante'],
      required: true,
    }],
    baseRate: { type: Number, required: true, min: 0 },
    ratePerKm: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Course = model<ICourse>('Course', courseSchema);
