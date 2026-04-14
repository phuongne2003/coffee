import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as menuItemService from "../services/menu-item.service";

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

export const createMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItem = await menuItemService.createMenuItem(req.body);
    return sendSuccess(res, 201, "Tạo món ăn thành công", menuItem);
  },
);

export const updateMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItem = await menuItemService.updateMenuItem(
      getParamId(req),
      req.body,
    );
    return sendSuccess(res, 200, "Cập nhật món ăn thành công", menuItem);
  },
);

export const deleteMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItem = await menuItemService.deleteMenuItem(getParamId(req));
    return sendSuccess(res, 200, "Xóa món ăn thành công", menuItem);
  },
);

export const toggleMenuItemAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItem = await menuItemService.toggleMenuItemAvailability(
      getParamId(req),
      req.body,
    );

    return sendSuccess(
      res,
      200,
      "Cập nhật trạng thái bán của món ăn thành công",
      menuItem,
    );
  },
);

export const getMenuItemById = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItem = await menuItemService.getMenuItemById(getParamId(req));
    return sendSuccess(res, 200, "Lấy món ăn thành công", menuItem);
  },
);

export const listMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await menuItemService.listMenuItems({
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      categoryId:
        typeof req.query.categoryId === "string"
          ? req.query.categoryId
          : undefined,
      isActive: toBoolean(req.query.isActive),
      isAvailable: toBoolean(req.query.isAvailable),
      page: toNumber(req.query.page, 1),
      limit: toNumber(req.query.limit, 10),
    });

    return sendSuccess(
      res,
      200,
      "Danh sách món ăn",
      result.items,
      result.pagination,
    );
  },
);
