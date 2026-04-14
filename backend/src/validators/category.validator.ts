import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce
    .number()
    .int("Thứ tự hiển thị phải là số nguyên")
    .min(0, "Thứ tự hiển thị không được âm")
    .default(0),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const toggleCategorySchema = z.object({
  isActive: z.boolean(),
});

export const reorderCategoriesSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string().regex(objectIdRegex, "ID danh mục không hợp lệ"),
          sortOrder: z.coerce
            .number()
            .int("Thứ tự hiển thị phải là số nguyên")
            .min(0, "Thứ tự hiển thị không được âm"),
        }),
      )
      .min(1, "Danh sách sắp xếp không được rỗng"),
  })
  .refine(
    (data) => new Set(data.items.map((item) => item.id)).size === data.items.length,
    {
      message: "Danh sách sắp xếp chứa ID trùng lặp",
      path: ["items"],
    },
  );

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ToggleCategoryInput = z.infer<typeof toggleCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
