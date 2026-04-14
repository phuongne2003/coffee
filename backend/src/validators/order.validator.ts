import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderItemInputSchema = z.object({
  menuItemId: z.string().regex(objectIdRegex, "Món ăn không hợp lệ"),
  quantity: z.coerce.number().int().min(1, "Số lượng phải lớn hơn 0"),
  note: z.string().trim().max(255).optional(),
});

const uniqueMenuItems = (items: { menuItemId: string }[]) =>
  new Set(items.map((item) => item.menuItemId)).size === items.length;

export const createMobileOrderSchema = z.object({
  tableCode: z
    .string()
    .trim()
    .min(2, "Mã bàn phải có ít nhất 2 ký tự")
    .max(30, "Mã bàn không vượt quá 30 ký tự")
    .transform((value) => value.toUpperCase()),
  items: z
    .array(orderItemInputSchema)
    .min(1, "Đơn hàng phải có ít nhất một món")
    .refine(uniqueMenuItems, {
      message: "Mỗi món chỉ được xuất hiện một lần trong đơn",
    }),
  note: z.string().trim().max(500).optional(),
  customerName: z.string().trim().max(100).optional(),
});

export const createPosOrderSchema = z.object({
  tableId: z.string().regex(objectIdRegex, "Bàn không hợp lệ"),
  items: z
    .array(orderItemInputSchema)
    .min(1, "Đơn hàng phải có ít nhất một món")
    .refine(uniqueMenuItems, {
      message: "Mỗi món chỉ được xuất hiện một lần trong đơn",
    }),
  note: z.string().trim().max(500).optional(),
  customerName: z.string().trim().max(100).optional(),
});

export const updateOrderItemsSchema = z.object({
  items: z
    .array(orderItemInputSchema)
    .min(1, "Đơn hàng phải có ít nhất một món")
    .refine(uniqueMenuItems, {
      message: "Mỗi món chỉ được xuất hiện một lần trong đơn",
    }),
  note: z.string().trim().max(500).optional(),
});

export const updateOrderTableSchema = z.object({
  tableId: z.string().regex(objectIdRegex, "Bàn không hợp lệ"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "preparing", "served", "paid", "cancelled"]),
});

export type CreateMobileOrderInput = z.infer<typeof createMobileOrderSchema>;
export type CreatePosOrderInput = z.infer<typeof createPosOrderSchema>;
export type UpdateOrderItemsInput = z.infer<typeof updateOrderItemsSchema>;
export type UpdateOrderTableInput = z.infer<typeof updateOrderTableSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
