import { HydratedDocument, Schema, Types, model } from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "preparing",
  "served",
  "paid",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_SOURCES = ["mobile", "pos"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  lineTotal: number;
}

export interface IOrder {
  tableId: Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  source: OrderSource;
  note?: string;
  customerName?: string;
  createdBy?: Types.ObjectId;
  totalAmount: number;
  servedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema<IOrder>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Đơn hàng phải có ít nhất một món",
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      required: true,
    },
    source: {
      type: String,
      enum: ORDER_SOURCES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    servedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ tableId: 1, status: 1, createdAt: -1 });

export type OrderDocument = HydratedDocument<IOrder>;
export const Order = model<IOrder>("Order", orderSchema);
