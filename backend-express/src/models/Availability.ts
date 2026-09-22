import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export interface ITimeSlot {
  dayOfWeek: number;        // 0=Dom, 1=Lun, ..., 6=Sáb
  startMinute: number;      // minutos desde 00:00 (ej. 540 = 09:00)
  endMinute: number;        // minutos desde 00:00
}

export interface IAvailability extends Document {
  _id: Types.ObjectId;
  tutorId: Types.ObjectId;
  slots: ITimeSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<ITimeSlot>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startMinute: { type: Number, required: true, min: 0, max: 1440 },
    endMinute: { type: Number, required: true, min: 0, max: 1440 },
  },
  { _id: false }
);

const availabilitySchema = new Schema<IAvailability>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    slots: { type: [slotSchema], default: [] },
  },
  { timestamps: true }
);

export const Availability = model<IAvailability>('Availability', availabilitySchema);
