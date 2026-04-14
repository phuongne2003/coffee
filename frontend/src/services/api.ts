import { mockMenuItems, mockOrders, mockTables, mockReports } from "./mockData";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type BackendErrorBody = {
  message?: string;
  error?: string | { message?: string };
};

type BackendSuccessEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let _mockMenuItems = [...mockMenuItems];
let _mockOrders = [...mockOrders];
let _mockTables = [...mockTables];
let _nextId = 100;

function getToken() {
  return localStorage.getItem("cafe_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as BackendErrorBody;
    const msg =
      typeof err.error === "string"
        ? err.error
        : typeof err.error === "object" &&
            err.error &&
            typeof err.error.message === "string"
          ? err.error.message
          : typeof err.message === "string"
            ? err.message
            : res.statusText || "Request failed";
    throw new ApiError(msg, res.status);
  }

  const parsed = (await res.json()) as BackendSuccessEnvelope<T> | T;

  if (
    parsed &&
    typeof parsed === "object" &&
    "success" in parsed &&
    (parsed as BackendSuccessEnvelope<T>).success === true &&
    "data" in parsed
  ) {
    return (parsed as BackendSuccessEnvelope<T>).data as T;
  }

  return parsed as T;
}

function delay(ms = 400) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockResponse<T>(data: T): Promise<T> {
  return delay().then(() => data);
}

async function tryRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  mockFallback?: () => T | undefined,
): Promise<T> {
  try {
    return await request<T>(method, path, body);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (mockFallback) {
      const fallback = mockFallback();
      if (fallback !== undefined) return mockResponse(fallback);
    }
    throw new Error("API unreachable and no mock available");
  }
}

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("POST", "/auth/login", data),
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    role?: "customer" | "staff" | "manager";
  }) => request<AuthResponse>("POST", "/auth/register", data),
  me: () =>
    request<{ userId: string; email: string; role: string }>("GET", "/auth/me"),
};

export type CategoryRecord = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
};

type BackendCategoryRecord = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
};

const normalizeCategory = (item: BackendCategoryRecord): CategoryRecord => ({
  id: item.id ?? item._id ?? "",
  name: item.name,
  description: item.description,
  isActive: item.isActive,
  sortOrder: item.sortOrder,
});

export const categoriesApi = {
  list: (params?: { search?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive === "boolean") {
      query.set("isActive", String(params.isActive));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";

    return request<BackendCategoryRecord[]>("GET", `/categories${suffix}`).then(
      (items) => items.map(normalizeCategory),
    );
  },
  get: (id: string) =>
    request<BackendCategoryRecord>("GET", `/categories/${id}`).then(
      normalizeCategory,
    ),
  create: (data: {
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) =>
    request<BackendCategoryRecord>("POST", "/categories", data).then(
      normalizeCategory,
    ),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) =>
    request<BackendCategoryRecord>("PATCH", `/categories/${id}`, data).then(
      normalizeCategory,
    ),
  delete: (id: string) =>
    request<BackendCategoryRecord>("DELETE", `/categories/${id}`).then(
      normalizeCategory,
    ),
};

export type IngredientRecord = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  alertThreshold: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendIngredientRecord = {
  _id?: string;
  id?: string;
  name: string;
  unit: string;
  currentStock: number;
  alertThreshold: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeIngredient = (
  item: BackendIngredientRecord,
): IngredientRecord => ({
  id: item.id ?? item._id ?? "",
  name: item.name,
  unit: item.unit,
  currentStock: item.currentStock,
  alertThreshold: item.alertThreshold,
  description: item.description,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const ingredientsApi = {
  list: (params?: {
    search?: string;
    isActive?: boolean;
    lowStock?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive === "boolean")
      query.set("isActive", String(params.isActive));
    if (typeof params?.lowStock === "boolean")
      query.set("lowStock", String(params.lowStock));
    const suffix = query.toString() ? `?${query.toString()}` : "";

    return request<BackendIngredientRecord[]>(
      "GET",
      `/ingredients${suffix}`,
    ).then((items) => items.map(normalizeIngredient));
  },
  get: (id: string) =>
    request<BackendIngredientRecord>("GET", `/ingredients/${id}`).then(
      normalizeIngredient,
    ),
  create: (data: {
    name: string;
    unit: string;
    currentStock: number;
    alertThreshold: number;
    description?: string;
  }) =>
    request<BackendIngredientRecord>("POST", "/ingredients", data).then(
      normalizeIngredient,
    ),
  update: (
    id: string,
    data: Partial<{
      name: string;
      unit: string;
      currentStock: number;
      alertThreshold: number;
      description?: string;
      isActive: boolean;
    }>,
  ) =>
    request<BackendIngredientRecord>("PATCH", `/ingredients/${id}`, data).then(
      normalizeIngredient,
    ),
  delete: (id: string) =>
    request<BackendIngredientRecord>("DELETE", `/ingredients/${id}`).then(
      normalizeIngredient,
    ),
  updateStock: (
    id: string,
    data: {
      type: "in" | "out" | "adjustment";
      quantity: number;
      note?: string;
    },
  ) =>
    request<BackendIngredientRecord>(
      "PATCH",
      `/ingredients/${id}/stock`,
      data,
    ).then(normalizeIngredient),
  lowStock: () =>
    request<BackendIngredientRecord[]>(
      "GET",
      "/ingredients/alerts/low-stock",
    ).then((items) => items.map(normalizeIngredient)),
  movements: (id: string) =>
    request<{
      ingredient: BackendIngredientRecord;
      movements: Array<Record<string, unknown>>;
    }>("GET", `/ingredients/${id}/movements`).then((result) => ({
      ...result,
      ingredient: normalizeIngredient(result.ingredient),
    })),
};

export const menuItemsApi = {
  list: (params?: {
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
    isActive?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (typeof params?.isAvailable === "boolean") {
      query.set("isAvailable", String(params.isAvailable));
    }
    if (typeof params?.isActive === "boolean") {
      query.set("isActive", String(params.isActive));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";

    return request<BackendMenuItemRecord[]>("GET", `/menu-items${suffix}`).then(
      (items) => items.map(normalizeMenuItem),
    );
  },
  get: (id: string) =>
    request<BackendMenuItemRecord>("GET", `/menu-items/${id}`).then(
      normalizeMenuItem,
    ),
  create: (data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
    isAvailable?: boolean;
    recipe?: Array<{ ingredientId: string; quantity: number }>;
  }) =>
    request<BackendMenuItemRecord>("POST", "/menu-items", data).then(
      normalizeMenuItem,
    ),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      price: number;
      categoryId: string;
      imageUrl?: string;
      isAvailable: boolean;
      recipe: Array<{ ingredientId: string; quantity: number }>;
    }>,
  ) =>
    request<BackendMenuItemRecord>("PATCH", `/menu-items/${id}`, data).then(
      normalizeMenuItem,
    ),
  delete: (id: string) =>
    request<BackendMenuItemRecord>("DELETE", `/menu-items/${id}`).then(
      normalizeMenuItem,
    ),
  toggleAvailability: (id: string, isAvailable: boolean) =>
    request<BackendMenuItemRecord>("PATCH", `/menu-items/${id}/availability`, {
      isAvailable,
    }).then(normalizeMenuItem),
};

export type MenuItemRecord = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  recipe: Array<{ ingredientId: string; quantity: number }>;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendMenuItemRecord = {
  _id?: string;
  id?: string;
  name: string;
  categoryId:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
      }
    | null;
  recipe?: Array<{
    ingredientId: string | { _id?: string; id?: string } | null;
    quantity: number;
  }>;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeMenuItem = (item: BackendMenuItemRecord): MenuItemRecord => {
  const categoryRef = item.categoryId;
  const categoryId =
    typeof categoryRef === "string"
      ? categoryRef
      : categoryRef && typeof categoryRef === "object"
        ? (categoryRef.id ?? categoryRef._id ?? "")
        : "";
  const categoryName =
    categoryRef && typeof categoryRef === "object"
      ? (categoryRef.name ?? "")
      : "";

  return {
    id: item.id ?? item._id ?? "",
    name: item.name,
    categoryId,
    categoryName,
    recipe: (item.recipe ?? [])
      .map((r) => {
        const ingredientRef = r.ingredientId;
        const ingredientId =
          typeof ingredientRef === "string"
            ? ingredientRef
            : ingredientRef && typeof ingredientRef === "object"
              ? (ingredientRef.id ?? ingredientRef._id ?? "")
              : "";

        return {
          ingredientId,
          quantity: r.quantity,
        };
      })
      .filter((r) => Boolean(r.ingredientId)),
    price: item.price,
    description: item.description,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

type OrderStatus = "pending" | "preparing" | "served" | "paid" | "cancelled";

export type OrderTableRecord = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
};

export type OrderItemRecord = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  lineTotal: number;
};

export type OrderRecord = {
  id: string;
  tableId: string;
  table: OrderTableRecord | null;
  items: OrderItemRecord[];
  totalAmount: number;
  status: OrderStatus;
  source: "pos" | "mobile" | string;
  note?: string;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
  servedAt?: string;
  paidAt?: string;
};

type BackendOrderRecord = {
  _id?: string;
  id?: string | number;
  tableId?:
    | string
    | {
        _id?: string;
        id?: string;
        code?: string;
        name?: string;
        capacity?: number;
        isActive?: boolean;
      }
    | null;
  table_id?: string | number;
  table_number?: number;
  table_name?: string;
  items?: Array<{
    menuItemId?: string | number | { _id?: string; id?: string } | null;
    menu_item_id?: string | number | null;
    name: string;
    unitPrice?: number;
    price?: number;
    quantity: number;
    note?: string;
    lineTotal?: number;
  }>;
  totalAmount?: number;
  total?: number;
  status: OrderStatus | string;
  source?: "pos" | "mobile" | string;
  note?: string;
  customerName?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  servedAt?: string;
  paidAt?: string;
};

const normalizeOrderTable = (
  tableRef:
    | BackendOrderRecord["tableId"]
    | {
        _id?: string;
        id?: string;
        code?: string;
        name?: string;
        capacity?: number;
        isActive?: boolean;
      }
    | null
    | undefined,
  fallback: {
    tableId?: string | number;
    table_number?: number;
    table_name?: string;
  } = {},
): OrderTableRecord | null => {
  if (
    !tableRef &&
    fallback.tableId === undefined &&
    fallback.table_number === undefined
  ) {
    return null;
  }

  if (typeof tableRef === "string") {
    return {
      id: tableRef,
      code: tableRef,
      name: fallback.table_name || `Bàn ${fallback.table_number ?? tableRef}`,
      capacity: 0,
      isActive: true,
    };
  }

  if (tableRef && typeof tableRef === "object") {
    const id = tableRef.id ?? tableRef._id ?? "";
    return {
      id,
      code: tableRef.code ?? tableRef.name ?? id,
      name: tableRef.name ?? tableRef.code ?? `Bàn ${id}`,
      capacity: tableRef.capacity ?? 0,
      isActive: tableRef.isActive ?? true,
    };
  }

  const id = String(fallback.tableId ?? fallback.table_number ?? "");
  return {
    id,
    code: String(fallback.table_number ?? fallback.tableId ?? id),
    name: fallback.table_name || `Bàn ${fallback.table_number ?? id}`,
    capacity: 0,
    isActive: true,
  };
};

const normalizeOrder = (item: BackendOrderRecord): OrderRecord => {
  const normalizedStatus: OrderStatus =
    item.status === "pending" ||
    item.status === "preparing" ||
    item.status === "served" ||
    item.status === "paid" ||
    item.status === "cancelled"
      ? item.status
      : "pending";

  const table = normalizeOrderTable(item.tableId, {
    tableId: item.table_id,
    table_number: item.table_number,
    table_name: item.table_name,
  });

  const rawItems = item.items ?? [];
  const items = rawItems
    .map((orderItem) => {
      const menuItemRef =
        orderItem.menuItemId ?? orderItem.menu_item_id ?? null;
      const menuItemId =
        typeof menuItemRef === "string"
          ? menuItemRef
          : typeof menuItemRef === "number"
            ? String(menuItemRef)
            : menuItemRef && typeof menuItemRef === "object"
              ? (menuItemRef.id ?? menuItemRef._id ?? "")
              : "";

      return {
        menuItemId,
        name: orderItem.name,
        unitPrice: orderItem.unitPrice ?? orderItem.price ?? 0,
        quantity: orderItem.quantity,
        note: orderItem.note,
        lineTotal:
          orderItem.lineTotal ??
          (orderItem.unitPrice ?? orderItem.price ?? 0) * orderItem.quantity,
      };
    })
    .filter((orderItem) => Boolean(orderItem.menuItemId));

  return {
    id: String(item.id ?? item._id ?? ""),
    tableId: table?.id ?? String(item.table_id ?? ""),
    table,
    items,
    totalAmount:
      item.totalAmount ??
      item.total ??
      items.reduce((sum, orderItem) => sum + orderItem.lineTotal, 0),
    status: normalizedStatus,
    source: item.source ?? "pos",
    note: item.note,
    customerName: item.customerName,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt,
    servedAt: item.servedAt,
    paidAt: item.paidAt,
  };
};

export const ordersApi = {
  list: (params?: { status?: string; from?: string; to?: string }) => {
    const query = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return tryRequest<BackendOrderRecord[]>(
      "GET",
      `/orders${query}`,
      undefined,
      () => {
        let orders = [..._mockOrders] as unknown as BackendOrderRecord[];
        if (params?.status) {
          orders = orders.filter((o) => o.status === params.status);
        }
        return orders;
      },
    ).then((items) =>
      (items ?? [])
        .filter((item): item is BackendOrderRecord => Boolean(item))
        .map(normalizeOrder),
    );
  },
  get: (id: string) =>
    tryRequest<BackendOrderRecord>("GET", `/orders/${id}`, undefined, () =>
      _mockOrders.find(
        (o) => String((o as { id?: string | number }).id) === id,
      ),
    ).then((item) => {
      if (!item) {
        throw new Error("Không tìm thấy đơn hàng");
      }
      return normalizeOrder(item);
    }),
  create: (data: {
    tableId: string;
    items: { menuItemId: string; quantity: number; note?: string }[];
    note?: string;
    customerName?: string;
  }) =>
    tryRequest<BackendOrderRecord>("POST", "/orders", data, () => {
      const table = _mockTables.find(
        (t) => String((t as { id?: string | number }).id) === data.tableId,
      ) as
        | {
            id?: string | number;
            number?: number;
            name?: string;
            capacity?: number;
          }
        | undefined;
      const menuItemMap = new Map(
        _mockMenuItems.map((m) => [
          String((m as { id?: string | number }).id),
          m,
        ]),
      );
      const items = data.items.map((item) => {
        const menuItem = menuItemMap.get(item.menuItemId) as
          | { id?: string | number; name?: string; price?: number }
          | undefined;
        const unitPrice = menuItem?.price ?? 0;

        return {
          menuItemId: item.menuItemId,
          name: menuItem?.name ?? "",
          unitPrice,
          quantity: item.quantity,
          note: item.note,
          lineTotal: unitPrice * item.quantity,
        };
      });
      const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const order = {
        id: String(_nextId++),
        tableId: table
          ? {
              id: String(table.id ?? data.tableId),
              code: String(table.number ?? table.id ?? data.tableId),
              name:
                table.name ?? `Bàn ${table.number ?? table.id ?? data.tableId}`,
              capacity: table.capacity ?? 0,
              isActive: true,
            }
          : null,
        items,
        totalAmount: Math.round(totalAmount * 100) / 100,
        status: "pending" as OrderStatus,
        source: "pos",
        note: data.note,
        customerName: data.customerName,
        createdAt: new Date().toISOString(),
      };
      _mockOrders.unshift(order as never);
      return order;
    }).then((item) => {
      if (!item) {
        throw new Error("Không thể tạo đơn hàng");
      }
      return normalizeOrder(item);
    }),
  updateStatus: (id: string, status: string) =>
    tryRequest<BackendOrderRecord>(
      "PATCH",
      `/orders/${id}/status`,
      { status },
      () => {
        _mockOrders = _mockOrders.map((o) => {
          if (String((o as { id?: string | number }).id) !== id) {
            return o;
          }

          const base =
            typeof o === "object" && o !== null
              ? (o as Record<string, unknown>)
              : {};

          return {
            ...base,
            status,
          } as unknown as (typeof _mockOrders)[number];
        });
        return _mockOrders.find(
          (o) => String((o as { id?: string | number }).id) === id,
        ) as BackendOrderRecord | undefined;
      },
    ).then((item) => {
      if (!item) {
        throw new Error("Không tìm thấy đơn hàng để cập nhật trạng thái");
      }
      return normalizeOrder(item);
    }),
  delete: (id: string) =>
    tryRequest<BackendOrderRecord>("DELETE", `/orders/${id}`, undefined, () => {
      _mockOrders = _mockOrders.filter(
        (o) => String((o as { id?: string | number }).id) !== id,
      );
      return {
        id,
        status: "cancelled",
        items: [],
        totalAmount: 0,
        source: "pos",
      } as BackendOrderRecord;
    }).then((item) => {
      if (!item) {
        throw new Error("Không tìm thấy đơn hàng để xóa");
      }
      return normalizeOrder(item);
    }),
};

type BackendTableRecord = {
  _id?: string;
  id?: string;
  code?: string;
  name?: string;
  capacity?: number;
  isActive?: boolean;
  number?: number;
  status?: string;
  qr_code?: string;
};

export type TableRecord = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  // Legacy compatibility fields used by current UI pages.
  number: number;
  status: string;
  qr_code: string;
};

const normalizeTable = (item: BackendTableRecord): TableRecord => {
  const id = item.id ?? item._id ?? "";
  const code = item.code ?? (item.number ? String(item.number) : id);
  const parsedNumber = Number.parseInt(code.replace(/\D+/g, ""), 10);
  const isActive =
    typeof item.isActive === "boolean"
      ? item.isActive
      : item.status
        ? item.status !== "inactive"
        : true;

  // Generate menu URL for QR code
  const menuUrl = `${window.location.origin}/menu/table-${code}`;

  return {
    id,
    code,
    name: item.name ?? `Bàn ${code}`,
    capacity: item.capacity ?? 0,
    isActive,
    number: Number.isNaN(parsedNumber) ? 0 : parsedNumber,
    status: isActive ? "available" : "unavailable",
    qr_code:
      item.qr_code ??
      `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(menuUrl)}&size=180x180`,
  };
};

export const tablesApi = {
  list: () =>
    tryRequest<BackendTableRecord[]>(
      "GET",
      "/tables",
      undefined,
      () => _mockTables as unknown as BackendTableRecord[],
    ).then((items) => items.map(normalizeTable)),
  get: (id: string) =>
    tryRequest<BackendTableRecord>("GET", `/tables/${id}`, undefined, () =>
      (_mockTables as unknown as BackendTableRecord[]).find(
        (t) => String(t.id) === id,
      ),
    ).then(normalizeTable),
  create: (data: { number: number; capacity: number }) => {
    const payload = {
      code: `T${data.number}`,
      name: `Bàn ${data.number}`,
      capacity: data.capacity,
    };

    return tryRequest<BackendTableRecord>("POST", "/tables", payload, () => {
      const item: BackendTableRecord = {
        id: String(_nextId++),
        code: payload.code,
        name: payload.name,
        capacity: payload.capacity,
        isActive: true,
      };
      _mockTables.push(item as never);
      return item;
    }).then(normalizeTable);
  },
  update: (
    id: string,
    data: { number: number; capacity: number; status: string },
  ) => {
    const updatePayload = {
      code: `T${data.number}`,
      name: `Bàn ${data.number}`,
      capacity: data.capacity,
    };

    return tryRequest<BackendTableRecord>(
      "PATCH",
      `/tables/${id}`,
      updatePayload,
      () => {
        _mockTables = (_mockTables as unknown as BackendTableRecord[]).map(
          (t) => (String(t.id) === id ? { ...t, ...updatePayload } : t),
        ) as never[];
        return (_mockTables as unknown as BackendTableRecord[]).find(
          (t) => String(t.id) === id,
        ) as BackendTableRecord | undefined;
      },
    ).then(normalizeTable);
  },
  delete: (id: string) =>
    tryRequest<BackendTableRecord>("DELETE", `/tables/${id}`, undefined, () => {
      _mockTables = (_mockTables as unknown as BackendTableRecord[]).filter(
        (t) => String(t.id) !== id,
      ) as never[];
      return {
        id,
        code: id,
        name: `Bàn ${id}`,
        capacity: 0,
        isActive: false,
      };
    }).then(normalizeTable),
};

export const reportsApi = {
  summary: () =>
    tryRequest("GET", "/reports/summary", undefined, () => mockReports.summary),
  byCategory: () =>
    tryRequest(
      "GET",
      "/reports/by-category",
      undefined,
      () => mockReports.by_category,
    ),
  trend: () =>
    tryRequest("GET", "/reports/trend", undefined, () => mockReports.trend),
  inventory: () =>
    tryRequest(
      "GET",
      "/reports/inventory",
      undefined,
      () => mockReports.inventory,
    ),
};
