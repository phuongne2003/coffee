import { Category } from "../models/category.model";
import { MenuItem } from "../models/menu-item.model";
import {
  CreateMenuItemInput,
  ToggleMenuItemAvailabilityInput,
  UpdateMenuItemInput,
} from "../validators/menu-item.validator";
import { HttpError } from "../utils/http-error";

const ensureCategoryExists = async (categoryId: string) => {
  const category = await Category.findById(categoryId);

  if (!category || !category.isActive) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }
};

const buildSearchFilter = (query: {
  search?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  categoryId?: string;
}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.isAvailable === "boolean") {
    filter.isAvailable = query.isAvailable;
  }

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  return filter;
};

export const createMenuItem = async (payload: CreateMenuItemInput) => {
  await ensureCategoryExists(payload.categoryId);

  const existed = await MenuItem.findOne({
    name: payload.name,
    categoryId: payload.categoryId,
  });

  if (existed) {
    throw new HttpError(409, "Món ăn đã tồn tại trong danh mục này");
  }

  const menuItem = await MenuItem.create(payload);

  return menuItem;
};

export const updateMenuItem = async (
  id: string,
  payload: UpdateMenuItemInput,
) => {
  const menuItem = await MenuItem.findById(id);

  if (!menuItem || !menuItem.isActive) {
    throw new HttpError(404, "Không tìm thấy món ăn");
  }

  if (payload.categoryId) {
    await ensureCategoryExists(payload.categoryId);
  }

  const nextName = payload.name ?? menuItem.name;
  const nextCategoryId = payload.categoryId ?? String(menuItem.categoryId);

  const existed = await MenuItem.findOne({
    _id: { $ne: menuItem._id },
    name: nextName,
    categoryId: nextCategoryId,
  });

  if (existed) {
    throw new HttpError(409, "Món ăn đã tồn tại trong danh mục này");
  }

  Object.assign(menuItem, payload);
  await menuItem.save();

  return menuItem;
};

export const deleteMenuItem = async (id: string) => {
  const menuItem = await MenuItem.findById(id);

  if (!menuItem || !menuItem.isActive) {
    throw new HttpError(404, "Không tìm thấy món ăn");
  }

  menuItem.isActive = false;
  await menuItem.save();

  return menuItem;
};

export const toggleMenuItemAvailability = async (
  id: string,
  payload: ToggleMenuItemAvailabilityInput,
) => {
  const menuItem = await MenuItem.findById(id);

  if (!menuItem || !menuItem.isActive) {
    throw new HttpError(404, "Không tìm thấy món ăn");
  }

  menuItem.isAvailable = payload.isAvailable;
  await menuItem.save();

  return menuItem;
};

export const getMenuItemById = async (id: string) => {
  const menuItem = await MenuItem.findById(id)
    .populate("categoryId", "name isActive sortOrder")
    .lean();

  if (!menuItem || !menuItem.isActive) {
    throw new HttpError(404, "Không tìm thấy món ăn");
  }

  return menuItem;
};

export const listMenuItems = async (params: {
  search?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  categoryId?: string;
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
    MenuItem.find(filter)
      .populate("categoryId", "name isActive sortOrder")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MenuItem.countDocuments(filter),
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
