import { Category } from "../models/category.model";
import {
  CreateCategoryInput,
  ReorderCategoriesInput,
  ToggleCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validator";
import { HttpError } from "../utils/http-error";

const buildSearchFilter = (query: { search?: string; isActive?: boolean }) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  return filter;
};

export const createCategory = async (payload: CreateCategoryInput) => {
  const existed = await Category.findOne({ name: payload.name });

  if (existed) {
    throw new HttpError(409, "Danh mục đã tồn tại");
  }

  const category = await Category.create(payload);
  return category;
};

export const updateCategory = async (
  id: string,
  payload: UpdateCategoryInput,
) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }

  if (payload.name && payload.name !== category.name) {
    const existed = await Category.findOne({ name: payload.name });

    if (existed) {
      throw new HttpError(409, "Tên danh mục đã tồn tại");
    }
  }

  Object.assign(category, payload);
  await category.save();

  return category;
};

export const deleteCategory = async (id: string) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }

  if (!category.isActive) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }

  category.isActive = false;
  await category.save();

  return category;
};

export const toggleCategory = async (
  id: string,
  payload: ToggleCategoryInput,
) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }

  category.isActive = payload.isActive;
  await category.save();

  return category;
};

export const getCategoryById = async (id: string) => {
  const category = await Category.findById(id);

  if (!category || !category.isActive) {
    throw new HttpError(404, "Không tìm thấy danh mục");
  }

  return category;
};

export const listCategories = async (params: {
  search?: string;
  isActive?: boolean;
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
    Category.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Category.countDocuments(filter),
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

export const reorderCategories = async (payload: ReorderCategoriesInput) => {
  const ids = payload.items.map((item) => item.id);

  const existing = await Category.find({ _id: { $in: ids } }).select("_id");

  if (existing.length !== ids.length) {
    throw new HttpError(404, "Một hoặc nhiều danh mục không tồn tại");
  }

  const session = await Category.startSession();

  await session.withTransaction(async () => {
    await Promise.all(
      payload.items.map((item) =>
        Category.updateOne(
          { _id: item.id },
          {
            $set: {
              sortOrder: item.sortOrder,
            },
          },
          { session },
        ),
      ),
    );
  });

  await session.endSession();

  const updatedCategories = await Category.find({ _id: { $in: ids } }).sort({
    sortOrder: 1,
    createdAt: -1,
  });

  return updatedCategories;
};
