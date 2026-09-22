import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  threadId: string;        // formato: `${userA}_${userB}` (ordenado alfabéticamente)
  senderId: Types.ObjectId;
  content: string;
  readBy: Types.ObjectId[];  // usuarios que marcaron como leído
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    threadId: {
      type: String,
      required: true, index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
  },
  { timestamps: true }
);

messageSchema.index({ threadId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
