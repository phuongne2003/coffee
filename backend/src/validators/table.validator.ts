import { z } from "zod";

export const createTableSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Mã bàn phải có ít nhất 2 ký tự")
    .max(30, "Mã bàn không vượt quá 30 ký tự")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Tên bàn phải có ít nhất 2 ký tự"),
  capacity: z.coerce
    .number()
    .int()
    .min(1, "Sức chứa tối thiểu là 1")
    .default(4),
  isActive: z.boolean().optional(),
});

export const updateTableSchema = createTableSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const toggleTableSchema = z.object({
  isActive: z.boolean(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type ToggleTableInput = z.infer<typeof toggleTableSchema>;
