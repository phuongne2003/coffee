import { HydratedDocument, Schema, Types, model } from "mongoose";
import { UserRole } from "./user.model";

export type InventoryTransactionType = "in" | "out" | "adjustment";

export interface IInventoryTransaction {
  ingredientId: Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  note?: string;
  performedBy?: Types.ObjectId;
  performedRole?: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    type: {
      type: String,
      enum: ["in", "out", "adjustment"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    performedRole: {
      type: String,
      enum: ["manager", "staff", "customer"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type InventoryTransactionDocument =
  HydratedDocument<IInventoryTransaction>;
export const InventoryTransaction = model<IInventoryTransaction>(
  "InventoryTransaction",
  inventoryTransactionSchema,
);
