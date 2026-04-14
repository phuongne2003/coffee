import { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as orderService from "../services/order.service";
import { getSocket } from "../socket/io";

const getParamId = (req: Request): string => String(req.params.id);

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const emitOrderUpdate = (event: string, order: unknown) => {
  const io = getSocket();

  if (!io || !order || typeof order !== "object") {
    return;
  }

  io.emit(event, order);

  const orderObject = order as { tableId?: { _id?: string } | string };
  const tableId =
    typeof orderObject.tableId === "string"
      ? orderObject.tableId
      : orderObject.tableId?._id;

  if (tableId) {
    io.to(`table:${tableId}`).emit(event, order);
  }
};

export const createPosOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.createPosOrder(req.body, {
      userId: req.user!.userId,
    });

    emitOrderUpdate("order.created", order);
    return sendSuccess(res, 201, "Tạo đơn hàng thành công", order);
  },
);

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;

  const result = await orderService.listOrders({
    tableId:
      typeof req.query.tableId === "string" ? req.query.tableId : undefined,
    status:
      status === "pending" ||
      status === "preparing" ||
      status === "served" ||
      status === "paid" ||
      status === "cancelled"
        ? status
        : undefined,
    page: toNumber(req.query.page, 1),
    limit: toNumber(req.query.limit, 10),
  });

  return sendSuccess(
    res,
    200,
    "Danh sách đơn hàng",
    result.items,
    result.pagination,
  );
});

export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(getParamId(req));
    return sendSuccess(res, 200, "Lấy đơn hàng thành công", order);
  },
);

export const updateOrderItems = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.updateOrderItems(
      getParamId(req),
      req.body,
    );
    emitOrderUpdate("order.updated", order);
    return sendSuccess(res, 200, "Cập nhật món trong đơn thành công", order);
  },
);

export const updateOrderTable = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.updateOrderTable(
      getParamId(req),
      req.body,
    );
    emitOrderUpdate("order.updated", order);
    return sendSuccess(res, 200, "Cập nhật bàn cho đơn hàng thành công", order);
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.updateOrderStatus(
      getParamId(req),
      req.body,
      {
        performedBy: req.user ? new Types.ObjectId(req.user.userId) : undefined,
        performedRole: req.user?.role,
      },
    );

    emitOrderUpdate("order.status-updated", order);
    return sendSuccess(
      res,
      200,
      "Cập nhật trạng thái đơn hàng thành công",
      order,
    );
  },
);

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.deleteOrder(getParamId(req));
  emitOrderUpdate("order.deleted", order);
  return sendSuccess(res, 200, "Xóa đơn hàng thành công", order);
});
