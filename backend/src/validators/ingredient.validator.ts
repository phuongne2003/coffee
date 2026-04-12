import { z } from "zod";

export const createIngredientSchema = z.object({
  name: z.string().trim().min(2, "Tên nguyên liệu phải có ít nhất 2 ký tự"),
  unit: z.string().trim().min(1, "Đơn vị không được để trống"),
  currentStock: z.coerce.number().min(0, "Tồn kho không được âm").default(0),
  alertThreshold: z.coerce
    .number()
    .min(0, "Ngưỡng cảnh báo không được âm")
    .default(0),
  description: z.string().trim().max(500).optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateIngredientStockSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce.number().positive("Số lượng phải lớn hơn 0"),
  note: z.string().trim().max(255).optional(),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type UpdateIngredientStockInput = z.infer<
  typeof updateIngredientStockSchema
>;
