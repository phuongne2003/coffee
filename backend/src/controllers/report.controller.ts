import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as reportService from "../services/report.service";

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportService.getSummaryReport();
  return sendSuccess(res, 200, "Lấy báo cáo tổng quan thành công", data);
});

export const byCategory = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportService.getCategoryReport();
  return sendSuccess(
    res,
    200,
    "Lấy báo cáo doanh thu theo danh mục thành công",
    data,
  );
});

export const trend = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportService.getTrendReport();
  return sendSuccess(res, 200, "Lấy báo cáo xu hướng thành công", data);
});

export const inventory = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportService.getInventoryReport();
  return sendSuccess(res, 200, "Lấy báo cáo tồn kho thành công", data);
});
