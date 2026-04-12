import { HydratedDocument, Schema, model } from "mongoose";

export interface IIngredient {
  name: string;
  unit: string;
  currentStock: number;
  alertThreshold: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 120,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    alertThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
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

export type IngredientDocument = HydratedDocument<IIngredient>;
export const Ingredient = model<IIngredient>("Ingredient", ingredientSchema);
