import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export type ReportReason = 'inasistencia' | 'conducta' | 'cobros' | 'otro';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  targetUserId: Types.ObjectId;
  reason: ReportReason;
  evidence: string;        // texto que el usuario adjunta
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ['inasistencia', 'conducta', 'cobros', 'otro'],
      required: true
    },
    evidence: {
      type: String,
      required: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open'
    },
    resolutionNote: {
      type: String
    },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', reportSchema);
