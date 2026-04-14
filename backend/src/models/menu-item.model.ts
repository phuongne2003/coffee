import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface IMenuItem {
  name: string;
  categoryId: Types.ObjectId;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

menuItemSchema.index({ name: 1, categoryId: 1 }, { unique: true });

export type MenuItemDocument = HydratedDocument<IMenuItem>;
export const MenuItem = model<IMenuItem>("MenuItem", menuItemSchema);
