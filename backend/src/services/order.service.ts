import { ClientSession, Types } from "mongoose";
import { Ingredient } from "../models/ingredient.model";
import { InventoryTransaction } from "../models/inventory-transaction.model";
import { MenuItem } from "../models/menu-item.model";
import { Order, OrderStatus } from "../models/order.model";
import { Table } from "../models/table.model";
import {
  CreateMobileOrderInput,
  CreatePosOrderInput,
  UpdateOrderItemsInput,
  UpdateOrderStatusInput,
  UpdateOrderTableInput,
} from "../validators/order.validator";
import { HttpError } from "../utils/http-error";
import { UserRole } from "../models/user.model";
import { Category } from "../models/category.model";

const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["served", "cancelled"],
  served: ["paid"],
  paid: [],
  cancelled: [],
};

type NormalizedOrderItem = {
  menuItemId: Types.ObjectId;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  lineTotal: number;
};

const normalizeOrderItems = async (
  rawItems: Array<{ menuItemId: string; quantity: number; note?: string }>,
  session?: ClientSession,
): Promise<{
  normalizedItems: NormalizedOrderItem[];
  totalAmount: number;
}> => {
  const menuItemIds = rawItems.map((item) => item.menuItemId);
  const query = MenuItem.find({
    _id: { $in: menuItemIds },
    isActive: true,
    isAvailable: true,
  });

  const menuItems = session ? await query.session(session) : await query;

  if (menuItems.length !== rawItems.length) {
    throw new HttpError(
      404,
      "Một hoặc nhiều món không tồn tại hoặc đang ngừng bán",
    );
  }

  const menuItemMap = new Map(
    menuItems.map((item) => [String(item._id), item]),
  );

  const normalizedItems = rawItems.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);

    if (!menuItem) {
      throw new HttpError(404, "Không tìm thấy món ăn");
    }

    const lineTotal = menuItem.price * item.quantity;

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      unitPrice: menuItem.price,
      quantity: item.quantity,
      note: item.note,
      lineTotal,
    };
  });

  const totalAmount = normalizedItems.reduce(
    (total, item) => total + item.lineTotal,
    0,
  );

  return {
    normalizedItems,
    totalAmount,
  };
};

const ensureTableById = async (tableId: string, session?: ClientSession) => {
  const query = Table.findById(tableId);
  const table = session ? await query.session(session) : await query;

  if (!table || !table.isActive) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  return table;
};

const ensureTableByCode = async (
  tableCode: string,
  session?: ClientSession,
) => {
  const query = Table.findOne({
    code: tableCode.trim().toUpperCase(),
    isActive: true,
  });
  const table = session ? await query.session(session) : await query;

  if (!table) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  return table;
};

const ensureCanMutateOrder = (status: OrderStatus) => {
  if (status === "served" || status === "paid" || status === "cancelled") {
    throw new HttpError(
      400,
      "Không thể chỉnh sửa đơn khi đã served, paid hoặc cancelled",
    );
  }
};

const deductIngredientsForOrder = async (
  orderId: string,
  session: ClientSession,
  context: {
    performedBy?: Types.ObjectId;
    performedRole?: UserRole;
  },
) => {
  const order = await Order.findById(orderId).session(session);

  if (!order) {
    throw new HttpError(404, "Không tìm thấy đơn hàng");
  }

  const menuItemIds = order.items.map((item) => item.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).session(
    session,
  );
  const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));

  const requiredByIngredient = new Map<string, number>();

  for (const orderItem of order.items) {
    const menuItem = menuMap.get(String(orderItem.menuItemId));

    if (!menuItem || !menuItem.recipe || menuItem.recipe.length === 0) {
      throw new HttpError(
        400,
        `Món ${orderItem.name} chưa có công thức nguyên liệu để trừ kho`,
      );
    }

    for (const recipeItem of menuItem.recipe) {
      const key = String(recipeItem.ingredientId);
      const current = requiredByIngredient.get(key) ?? 0;
      requiredByIngredient.set(
        key,
        current + recipeItem.quantity * orderItem.quantity,
      );
    }
  }

  const ingredientIds = Array.from(requiredByIngredient.keys());
  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } })
    .session(session)
    .sort({ createdAt: 1 });

  if (ingredients.length !== ingredientIds.length) {
    throw new HttpError(
      400,
      "Một hoặc nhiều nguyên liệu trong recipe không tồn tại",
    );
  }

  for (const ingredient of ingredients) {
    if (!ingredient.isActive) {
      throw new HttpError(
        400,
        `Nguyên liệu ${ingredient.name} đã bị vô hiệu hóa, không thể trừ kho`,
      );
    }

    const requiredQuantity =
      requiredByIngredient.get(String(ingredient._id)) ?? 0;

    if (ingredient.currentStock < requiredQuantity) {
      throw new HttpError(
        400,
        `Không đủ tồn kho cho nguyên liệu ${ingredient.name}`,
      );
    }
  }

  const transactions = [];

  for (const ingredient of ingredients) {
    const requiredQuantity =
      requiredByIngredient.get(String(ingredient._id)) ?? 0;
    const previousStock = ingredient.currentStock;
    const newStock = previousStock - requiredQuantity;

    ingredient.currentStock = newStock;
    await ingredient.save({ session });

    transactions.push({
      ingredientId: ingredient._id,
      type: "out",
      quantity: requiredQuantity,
      previousStock,
      newStock,
      note: `Tự động trừ kho từ đơn ${order._id.toString()}`,
      performedBy: context.performedBy,
      performedRole: context.performedRole,
    });
  }

  if (transactions.length > 0) {
    await InventoryTransaction.create(transactions, { session });
  }
};

export const createMobileOrder = async (payload: CreateMobileOrderInput) => {
  const session = await Order.startSession();
  let createdOrderId: string | undefined;

  await session.withTransaction(async () => {
    const table = await ensureTableByCode(payload.tableCode, session);
    const { normalizedItems, totalAmount } = await normalizeOrderItems(
      payload.items,
      session,
    );

    const created = await Order.create(
      [
        {
          tableId: table._id,
          items: normalizedItems,
          status: "pending",
          source: "mobile",
          note: payload.note,
          customerName: payload.customerName,
          totalAmount,
        },
      ],
      { session },
    );

    createdOrderId = created[0]._id.toString();
  });

  await session.endSession();

  if (!createdOrderId) {
    throw new HttpError(500, "Không thể tạo đơn hàng");
  }

  return getOrderById(createdOrderId);
};

export const createPosOrder = async (
  payload: CreatePosOrderInput,
  context: { userId: string },
) => {
  const session = await Order.startSession();
  let createdOrderId: string | undefined;

  await session.withTransaction(async () => {
    const table = await ensureTableById(payload.tableId, session);
    const { normalizedItems, totalAmount } = await normalizeOrderItems(
      payload.items,
      session,
    );

    const created = await Order.create(
      [
        {
          tableId: table._id,
          items: normalizedItems,
          status: "pending",
          source: "pos",
          note: payload.note,
          customerName: payload.customerName,
          totalAmount,
          createdBy: new Types.ObjectId(context.userId),
        },
      ],
      { session },
    );

    createdOrderId = created[0]._id.toString();
  });

  await session.endSession();

  if (!createdOrderId) {
    throw new HttpError(500, "Không thể tạo đơn hàng");
  }

  return getOrderById(createdOrderId);
};

export const listOrders = async (params: {
  tableId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (params.tableId) {
    filter.tableId = params.tableId;
  }

  if (params.status) {
    filter.status = params.status;
  }

  const [items, totalItems] = await Promise.all([
    Order.find(filter)
      .populate("tableId", "code name capacity isActive")
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getOrderById = async (id: string) => {
  const order = await Order.findById(id)
    .populate("tableId", "code name capacity isActive")
    .populate("createdBy", "fullName email role");

  if (!order) {
    throw new HttpError(404, "Không tìm thấy đơn hàng");
  }

  return order;
};

export const updateOrderItems = async (
  id: string,
  payload: UpdateOrderItemsInput,
) => {
  const session = await Order.startSession();
  let updatedOrderId: string | undefined;

  await session.withTransaction(async () => {
    const order = await Order.findById(id).session(session);

    if (!order) {
      throw new HttpError(404, "Không tìm thấy đơn hàng");
    }

    ensureCanMutateOrder(order.status);

    const { normalizedItems, totalAmount } = await normalizeOrderItems(
      payload.items,
      session,
    );

    order.items = normalizedItems;
    order.totalAmount = totalAmount;

    if (payload.note !== undefined) {
      order.note = payload.note;
    }

    await order.save({ session });
    updatedOrderId = order._id.toString();
  });

  await session.endSession();

  if (!updatedOrderId) {
    throw new HttpError(500, "Không thể cập nhật đơn hàng");
  }

  return getOrderById(updatedOrderId);
};

export const updateOrderTable = async (
  id: string,
  payload: UpdateOrderTableInput,
) => {
  const session = await Order.startSession();
  let updatedOrderId: string | undefined;

  await session.withTransaction(async () => {
    const order = await Order.findById(id).session(session);

    if (!order) {
      throw new HttpError(404, "Không tìm thấy đơn hàng");
    }

    ensureCanMutateOrder(order.status);

    const table = await ensureTableById(payload.tableId, session);
    order.tableId = table._id;

    await order.save({ session });
    updatedOrderId = order._id.toString();
  });

  await session.endSession();

  if (!updatedOrderId) {
    throw new HttpError(500, "Không thể cập nhật bàn cho đơn hàng");
  }

  return getOrderById(updatedOrderId);
};

export const updateOrderStatus = async (
  id: string,
  payload: UpdateOrderStatusInput,
  context: {
    performedBy?: Types.ObjectId;
    performedRole?: UserRole;
  },
) => {
  const session = await Order.startSession();
  let updatedOrderId: string | undefined;

  await session.withTransaction(async () => {
    const order = await Order.findById(id).session(session);

    if (!order) {
      throw new HttpError(404, "Không tìm thấy đơn hàng");
    }

    if (order.status === payload.status) {
      throw new HttpError(400, "Đơn hàng đã ở trạng thái này");
    }

    const allowedNextStatuses = orderStatusTransitions[order.status];

    if (!allowedNextStatuses.includes(payload.status)) {
      throw new HttpError(
        400,
        `Không thể chuyển trạng thái từ ${order.status} sang ${payload.status}`,
      );
    }

    if (payload.status === "served") {
      await deductIngredientsForOrder(order._id.toString(), session, context);
      order.servedAt = new Date();
    }

    if (payload.status === "paid") {
      order.paidAt = new Date();
    }

    order.status = payload.status;
    await order.save({ session });
    updatedOrderId = order._id.toString();
  });

  await session.endSession();

  if (!updatedOrderId) {
    throw new HttpError(500, "Không thể cập nhật trạng thái đơn hàng");
  }

  return getOrderById(updatedOrderId);
};

export const cancelOrder = async (id: string) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new HttpError(404, "Không tìm thấy đơn hàng");
  }

  if (order.status === "served" || order.status === "paid") {
    throw new HttpError(400, "Không thể hủy đơn đã served hoặc paid");
  }

  if (order.status === "cancelled") {
    throw new HttpError(400, "Đơn hàng đã bị hủy");
  }

  order.status = "cancelled";
  await order.save();

  return getOrderById(order._id.toString());
};

export const getMobileMenuByTableCode = async (tableCode: string) => {
  const table = await ensureTableByCode(tableCode);

  const [categories, menuItems] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }),
    MenuItem.find({ isActive: true, isAvailable: true })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const grouped = categories.map((category) => {
    const items = menuItems.filter(
      (item) => String(item.categoryId) === String(category._id),
    );

    return {
      _id: category._id,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      items,
    };
  });

  return {
    table,
    categories: grouped,
  };
};
