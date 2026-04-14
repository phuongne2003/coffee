import { Table } from "../models/table.model";
import {
  CreateTableInput,
  ToggleTableInput,
  UpdateTableInput,
} from "../validators/table.validator";
import { HttpError } from "../utils/http-error";

const buildSearchFilter = (query: { search?: string; isActive?: boolean }) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    filter.$or = [
      { code: { $regex: query.search, $options: "i" } },
      { name: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

export const createTable = async (payload: CreateTableInput) => {
  const existed = await Table.findOne({ code: payload.code });

  if (existed) {
    throw new HttpError(409, "Mã bàn đã tồn tại");
  }

  const table = await Table.create(payload);
  return table;
};

export const updateTable = async (id: string, payload: UpdateTableInput) => {
  const table = await Table.findById(id);

  if (!table || !table.isActive) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  if (payload.code && payload.code !== table.code) {
    const existed = await Table.findOne({ code: payload.code });

    if (existed) {
      throw new HttpError(409, "Mã bàn đã tồn tại");
    }
  }

  Object.assign(table, payload);
  await table.save();

  return table;
};

export const deleteTable = async (id: string) => {
  const table = await Table.findById(id);

  if (!table) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  await Table.deleteOne({ _id: table._id });

  return table;
};

export const toggleTable = async (id: string, payload: ToggleTableInput) => {
  const table = await Table.findById(id);

  if (!table) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  table.isActive = payload.isActive;
  await table.save();

  return table;
};

export const getTableById = async (id: string) => {
  const table = await Table.findById(id);

  if (!table || !table.isActive) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  return table;
};

export const getTableByCode = async (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  const table = await Table.findOne({ code: normalizedCode, isActive: true });

  if (!table) {
    throw new HttpError(404, "Không tìm thấy bàn");
  }

  return table;
};

export const listTables = async (params: {
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
    Table.find(filter).sort({ code: 1 }).skip(skip).limit(limit),
    Table.countDocuments(filter),
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
