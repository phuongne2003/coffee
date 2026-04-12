import { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as ingredientService from "../services/ingredient.service";

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

export const createIngredient = asyncHandler(
  async (req: Request, res: Response) => {
    const ingredient = await ingredientService.createIngredient(req.body);
    return sendSuccess(res, 201, "Tạo nguyên liệu thành công", ingredient);
  },
);

export const updateIngredient = asyncHandler(
  async (req: Request, res: Response) => {
    const ingredient = await ingredientService.updateIngredient(
      getParamId(req),
      req.body,
    );
    return sendSuccess(res, 200, "Cập nhật nguyên liệu thành công", ingredient);
  },
);

export const deleteIngredient = asyncHandler(
  async (req: Request, res: Response) => {
    const ingredient = await ingredientService.deleteIngredient(
      getParamId(req),
    );
    return sendSuccess(res, 200, "Xóa nguyên liệu thành công", ingredient);
  },
);

export const getIngredientById = asyncHandler(
  async (req: Request, res: Response) => {
    const ingredient = await ingredientService.getIngredientById(
      getParamId(req),
    );
    return sendSuccess(res, 200, "Lấy nguyên liệu thành công", ingredient);
  },
);

export const listIngredients = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await ingredientService.listIngredients({
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      isActive: toBoolean(req.query.isActive),
      lowStock: toBoolean(req.query.lowStock),
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 10),
    });

    return sendSuccess(
      res,
      200,
      "Danh sách nguyên liệu",
      result.items,
      result.pagination,
    );
  },
);

export const getLowStockIngredients = asyncHandler(
  async (_req: Request, res: Response) => {
    const items = await ingredientService.getLowStockIngredients();
    return sendSuccess(res, 200, "Danh sách nguyên liệu sắp hết", items);
  },
);

export const updateIngredientStock = asyncHandler(
  async (req: Request, res: Response) => {
    const ingredient = await ingredientService.updateIngredientStock(
      getParamId(req),
      req.body,
      {
        performedBy: req.user ? new Types.ObjectId(req.user.userId) : undefined,
        performedRole: req.user?.role,
      },
    );

    return sendSuccess(res, 200, "Cập nhật tồn kho thành công", ingredient);
  },
);

export const listMovementsByIngredient = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await ingredientService.listMovementsByIngredient(
      getParamId(req),
    );
    return sendSuccess(res, 200, "Lịch sử biến động kho", result);
  },
);
