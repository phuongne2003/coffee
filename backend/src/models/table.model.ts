import { HydratedDocument, Schema, model } from "mongoose";

export interface ITable {
  code: string;
  name: string;
  capacity: number;
  status: "available" | "occupied";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      minlength: 2,
      maxlength: 30,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available",
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

export type TableDocument = HydratedDocument<ITable>;
export const Table = model<ITable>("Table", tableSchema);
