import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface IMenuItem {
  name: string;
  categoryId: Types.ObjectId;
  recipe: {
    ingredientId: Types.ObjectId;
    quantity: number;
  }[];
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
    recipe: {
      type: [
        {
          ingredientId: {
            type: Schema.Types.ObjectId,
            ref: "Ingredient",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 0.0001,
          },
        },
      ],
      default: [],
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
