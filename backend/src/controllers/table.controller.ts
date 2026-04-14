import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as tableService from "../services/table.service";

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

export const createTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.createTable(req.body);
  return sendSuccess(res, 201, "Tạo bàn thành công", table);
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.updateTable(getParamId(req), req.body);
  return sendSuccess(res, 200, "Cập nhật bàn thành công", table);
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.deleteTable(getParamId(req));
  return sendSuccess(res, 200, "Xóa bàn thành công", table);
});

export const toggleTable = asyncHandler(async (req: Request, res: Response) => {
  const table = await tableService.toggleTable(getParamId(req), req.body);
  return sendSuccess(res, 200, "Cập nhật trạng thái bàn thành công", table);
});

export const getTableById = asyncHandler(
  async (req: Request, res: Response) => {
    const table = await tableService.getTableById(getParamId(req));
    return sendSuccess(res, 200, "Lấy bàn thành công", table);
  },
);

export const listTables = asyncHandler(async (req: Request, res: Response) => {
  const result = await tableService.listTables({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    isActive: toBoolean(req.query.isActive),
    page: toNumber(req.query.page, 1),
    limit: toNumber(req.query.limit, 10),
  });

  return sendSuccess(
    res,
    200,
    "Danh sách bàn",
    result.items,
    result.pagination,
  );
});
