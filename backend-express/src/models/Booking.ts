import mongoose, { Schema, model, Types, type Document } from 'mongoose';
import type { Modality } from './Course';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface IPriceBreakdown {
  baseAmount: number;       // baseRate * horas
  distanceKm?: number;
  transportAmount?: number; // distanceKm * ratePerKm
  total: number;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  tutorId: Types.ObjectId;
  courseId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  durationMin: number;
  modality: Modality;
  status: BookingStatus;
  priceBreakdown: IPriceBreakdown;
  recurringGroupId?: string;  // agrupa bookings de una suscripción
  createdAt: Date;
  updatedAt: Date;
}

const priceBreakdownSchema = new Schema<IPriceBreakdown>(
  {
    baseAmount: { type: Number, required: true, min: 0 },
    distanceKm: { type: Number, min: 0 },
    transportAmount: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    tutorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    courseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Course', 
      required: true 
    },
    startsAt: { 
      type: Date, 
      required: true, 
      index: true 
    },
    endsAt: { 
      type: Date, 
      required: true 
    },
    durationMin: { 
      type: Number, 
      required: true, 
      min: 15 
    },
    modality: { 
      type: String, 
      enum: ['virtual', 'presencial-tutor', 'presencial-estudiante'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' 
    },
    priceBreakdown: { 
      type: priceBreakdownSchema, required: true 
    },
    recurringGroupId: { 
      type: String, index: true 
    },
  },
  { timestamps: true }
);

// Índices críticos para anti-traslape (Fase 2)
// Reserva para Fase 2: bookingSchema.index({ tutorId: 1, startsAt: 1, endsAt: 1 });
// Reserva para Fase 2: bookingSchema.index({ studentId: 1, startsAt: 1, endsAt: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
