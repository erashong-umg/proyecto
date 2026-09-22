import mongoose, { Schema, model, Types, type Document } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });

export const Category = model<ICategory>('Category', categorySchema);
