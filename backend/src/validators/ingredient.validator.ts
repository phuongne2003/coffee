import { z } from "zod";

const normalizedUnitSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;

    const unit = value.trim().toLowerCase();

    if (unit === "gram" || unit === "g" || unit === "kg") return "gram";
    if (unit === "ml" || unit === "l") return "ml";
    if (
      unit === "cái" ||
      unit === "unit" ||
      unit === "pack" ||
      unit === "bottle"
    ) {
      return "cái";
    }

    return value;
  },
  z.enum(["gram", "ml", "cái"]),
);

export const createIngredientSchema = z.object({
  name: z.string().trim().min(2, "Tên nguyên liệu phải có ít nhất 2 ký tự"),
  unit: normalizedUnitSchema,
  currentStock: z.coerce
    .number()
    .min(0, "Số lượng không được là số âm")
    .default(0),
  alertThreshold: z.coerce
    .number()
    .min(0, "Ngưỡng cảnh báo không được là số âm")
    .default(0),
  description: z.string().trim().max(500).optional(),
});

export const updateIngredientSchema = createIngredientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateIngredientStockSchema = z.object({
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.coerce.number().positive("Số lượng nhập phải lớn hơn 0"),
  note: z.string().trim().max(255).optional(),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type UpdateIngredientStockInput = z.infer<
  typeof updateIngredientStockSchema
>;
