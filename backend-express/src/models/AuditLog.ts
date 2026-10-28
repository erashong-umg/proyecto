import { Schema, model, Types, type Document } from 'mongoose';

export type AuditAction =
  | 'category.create'
  | 'category.update'
  | 'category.delete'
  | 'report.resolve'
  | 'appeal.resolve'
  | 'user.suspend'
  | 'user.reactivate'
  | 'tutor.approve';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  adminName: string;
  action: AuditAction;
  targetType: string;
  targetId?: Types.ObjectId;
  detail?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    detail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
