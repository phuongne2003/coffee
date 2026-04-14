import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const recipeItemSchema = z.object({
  ingredientId: z.string().regex(objectIdRegex, "Nguyên liệu không hợp lệ"),
  quantity: z.coerce.number().positive("Định lượng nguyên liệu phải lớn hơn 0"),
});

const recipeSchema = z
  .array(recipeItemSchema)
  .refine(
    (items) =>
      new Set(items.map((item) => item.ingredientId)).size === items.length,
    {
      message: "Công thức không được chứa nguyên liệu trùng lặp",
    },
  );

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(2, "Tên món phải có ít nhất 2 ký tự"),
  categoryId: z.string().regex(objectIdRegex, "Danh mục không hợp lệ"),
  recipe: recipeSchema.optional(),
  price: z.coerce.number().min(0, "Giá không được âm"),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.url("URL ảnh không hợp lệ").optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const toggleMenuItemAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ToggleMenuItemAvailabilityInput = z.infer<
  typeof toggleMenuItemAvailabilitySchema
>;
