import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as orderService from "../services/order.service";
import { getSocket } from "../socket/io";

const emitOrderCreate = (order: unknown) => {
  const io = getSocket();

  if (!io || !order || typeof order !== "object") {
    return;
  }

  io.emit("order.created", order);

  const orderObject = order as { tableId?: { _id?: string } | string };
  const tableId =
    typeof orderObject.tableId === "string"
      ? orderObject.tableId
      : orderObject.tableId?._id;

  if (tableId) {
    io.to(`table:${tableId}`).emit("order.created", order);
  }
};

export const getMobileMenuByTableCode = asyncHandler(
  async (req: Request, res: Response) => {
    const tableCode = String(req.params.tableCode);
    const result = await orderService.getMobileMenuByTableCode(tableCode);

    return sendSuccess(res, 200, "Lấy menu theo bàn thành công", result);
  },
);

export const listMobileAvailableTables = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await orderService.listMobileAvailableTables();
    return sendSuccess(
      res,
      200,
      "Lấy danh sách bàn khả dụng thành công",
      result,
    );
  },
);

export const createMobileOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.createMobileOrder(req.body);
    emitOrderCreate(order);

    return sendSuccess(res, 201, "Tạo đơn hàng thành công", order);
  },
);
