import { ClientSession, Types } from "mongoose";
import { Ingredient } from "../models/ingredient.model";
import { MenuItem } from "../models/menu-item.model";
import {
  InventoryTransaction,
  InventoryTransactionType,
} from "../models/inventory-transaction.model";
import {
  CreateIngredientInput,
  UpdateIngredientInput,
  UpdateIngredientStockInput,
} from "../validators/ingredient.validator";
import { HttpError } from "../utils/http-error";

const STOCK_PRECISION = 1_000_000;

const normalizeIngredientName = (name: string) =>
  name.trim().replace(/\s+/g, " ");

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findIngredientByName = async (name: string, excludeId?: string) => {
  const exactNamePattern = `^${escapeRegex(name)}$`;
  const filter: Record<string, unknown> = {
    name: { $regex: exactNamePattern, $options: "i" },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Ingredient.findOne(filter);
};

const roundStock = (value: number) =>
  Math.round((value + Number.EPSILON) * STOCK_PRECISION) / STOCK_PRECISION;

const buildSearchFilter = (query: {
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  if (typeof query.lowStock === "boolean" && query.lowStock) {
    filter.$expr = { $lte: ["$currentStock", "$alertThreshold"] };
    filter.isActive = true;
  }

  return filter;
};

const createMovement = async (
  session: ClientSession,
  payload: {
    ingredientId: Types.ObjectId;
    type: InventoryTransactionType;
    quantity: number;
    previousStock: number;
    newStock: number;
    note?: string;
    performedBy?: Types.ObjectId;
    performedRole?: "manager" | "staff" | "customer";
  },
) => {
  await InventoryTransaction.create(
    [
      {
        ...payload,
      },
    ],
    { session },
  );
};

export const createIngredient = async (payload: CreateIngredientInput) => {
  const normalizedName = normalizeIngredientName(payload.name);
  const existed = await findIngredientByName(normalizedName);

  if (existed) {
    throw new HttpError(409, "Nguyên liệu đã tồn tại");
  }

  const ingredient = await Ingredient.create({
    ...payload,
    name: normalizedName,
  });

  return ingredient;
};

export const updateIngredient = async (
  id: string,
  payload: UpdateIngredientInput,
) => {
  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    throw new HttpError(404, "Không tìm thấy nguyên liệu");
  }

  if (payload.name) {
    const normalizedName = normalizeIngredientName(payload.name);
    const existed = await findIngredientByName(normalizedName, id);

    if (existed) {
      throw new HttpError(409, "Nguyên liệu đã tồn tại");
    }

    payload.name = normalizedName;
  }

  Object.assign(ingredient, payload);
  await ingredient.save();

  return ingredient;
};

export const deleteIngredient = async (id: string) => {
  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    throw new HttpError(404, "Không tìm thấy nguyên liệu");
  }

  const ingredientId = ingredient._id;

  await Promise.all([
    // Remove ingredient traces in menu recipes to avoid dangling references.
    MenuItem.updateMany(
      { "recipe.ingredientId": ingredientId },
      { $pull: { recipe: { ingredientId } } },
    ),
    InventoryTransaction.deleteMany({ ingredientId }),
    Ingredient.deleteOne({ _id: ingredientId }),
  ]);

  return ingredient;
};

export const getIngredientById = async (id: string) => {
  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    throw new HttpError(404, "Không tìm thấy nguyên liệu");
  }

  return ingredient;
};

export const listIngredients = async (params: {
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;
  const filter = buildSearchFilter({
    ...params,
    isActive: params.isActive ?? true,
  });

  const [items, totalItems] = await Promise.all([
    Ingredient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Ingredient.countDocuments(filter),
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

export const getLowStockIngredients = async () => {
  const items = await Ingredient.find({
    isActive: true,
    $expr: { $lte: ["$currentStock", "$alertThreshold"] },
  }).sort({ currentStock: 1 });

  return items;
};

export const updateIngredientStock = async (
  id: string,
  payload: UpdateIngredientStockInput,
  context: {
    performedBy?: Types.ObjectId;
    performedRole?: "manager" | "staff" | "customer";
  },
) => {
  const session = await Ingredient.startSession();
  let updatedIngredient;

  await session.withTransaction(async () => {
    const ingredient = await Ingredient.findById(id).session(session);

    if (!ingredient) {
      throw new HttpError(404, "Không tìm thấy nguyên liệu");
    }

    if (!ingredient.isActive) {
      throw new HttpError(400, "Nguyên liệu đã bị vô hiệu hóa");
    }

    const previousStock = ingredient.currentStock;
    let newStock = previousStock;

    if (payload.type === "in") {
      newStock = roundStock(newStock + payload.quantity);
    }

    if (payload.type === "out") {
      newStock = roundStock(newStock - payload.quantity);
    }

    if (payload.type === "adjustment") {
      newStock = roundStock(payload.quantity);
    }

    if (newStock < 0) {
      throw new HttpError(400, "Tồn kho không đủ để xuất kho");
    }

    ingredient.currentStock = newStock;
    await ingredient.save({ session });

    await createMovement(session, {
      ingredientId: ingredient._id,
      type: payload.type,
      quantity: payload.quantity,
      previousStock,
      newStock,
      note: payload.note,
      performedBy: context.performedBy,
      performedRole: context.performedRole,
    });

    updatedIngredient = ingredient;
  });

  await session.endSession();
  return updatedIngredient;
};

export const listMovementsByIngredient = async (id: string) => {
  const ingredient = await Ingredient.findById(id);

  if (!ingredient) {
    throw new HttpError(404, "Không tìm thấy nguyên liệu");
  }

  const movements = await InventoryTransaction.find({ ingredientId: id })
    .sort({ createdAt: -1 })
    .populate("performedBy", "fullName email role");

  return {
    ingredient,
    movements,
  };
};
