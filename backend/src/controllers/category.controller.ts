import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as categoryService from "../services/category.service";

const getParamId = (req: Request): string => String(req.params.id);

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return undefined;
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, 201, "Tạo danh mục thành công", category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(getParamId(req), req.body);
  return sendSuccess(res, 200, "Cập nhật danh mục thành công", category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.deleteCategory(getParamId(req));
  return sendSuccess(res, 200, "Xóa danh mục thành công", category);
});

export const toggleCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.toggleCategory(getParamId(req), req.body);
  return sendSuccess(res, 200, "Cập nhật trạng thái danh mục thành công", category);
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(getParamId(req));
  return sendSuccess(res, 200, "Lấy danh mục thành công", category);
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.listCategories({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    isActive: toBoolean(req.query.isActive),
    page: toNumber(req.query.page, 1),
    limit: toNumber(req.query.limit, 10),
  });

  return sendSuccess(
    res,
    200,
    "Danh sách danh mục",
    result.items,
    result.pagination,
  );
});

export const reorderCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.reorderCategories(req.body);
  return sendSuccess(
    res,
    200,
    "Cập nhật thứ tự hiển thị danh mục thành công",
    categories,
  );
});
