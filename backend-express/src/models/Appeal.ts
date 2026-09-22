import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export type AppealStatus = 'pending' | 'accepted' | 'rejected';

export interface IAppeal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  status: AppealStatus;
  adminResponse?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const appealSchema = new Schema<IAppeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    adminResponse: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Appeal = model<IAppeal>('Appeal', appealSchema);
