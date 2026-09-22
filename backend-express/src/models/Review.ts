import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  tutorId: Types.ObjectId;
  studentId: Types.ObjectId;
  bookingId: Types.ObjectId;
  rating: number;          // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Review = model<IReview>('Review', reviewSchema);
