import {
  mockCategories,
  mockIngredients,
  mockMenuItems,
  mockOrders,
  mockTables,
  mockReports,
} from "./mockData";

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

let _mockCategories = [...mockCategories];
let _mockIngredients = [...mockIngredients];
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
    throw new Error(msg);
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
  mockFallback?: () => T,
): Promise<T> {
  try {
    return await request<T>(method, path, body);
  } catch {
    if (mockFallback) return mockResponse(mockFallback());
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

export const categoriesApi = {
  list: () =>
    tryRequest<typeof mockCategories>(
      "GET",
      "/categories",
      undefined,
      () => _mockCategories,
    ),
  get: (id: number) =>
    tryRequest("GET", `/categories/${id}`, undefined, () =>
      _mockCategories.find((c) => c.id === id),
    ),
  create: (data: { name: string; description: string }) =>
    tryRequest("POST", "/categories", data, () => {
      const item = { id: _nextId++, ...data };
      _mockCategories.push(item);
      return item;
    }),
  update: (id: number, data: { name: string; description: string }) =>
    tryRequest("PUT", `/categories/${id}`, data, () => {
      _mockCategories = _mockCategories.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      );
      return _mockCategories.find((c) => c.id === id);
    }),
  delete: (id: number) =>
    tryRequest("DELETE", `/categories/${id}`, undefined, () => {
      _mockCategories = _mockCategories.filter((c) => c.id !== id);
      return { success: true };
    }),
};

export const ingredientsApi = {
  list: () =>
    tryRequest<typeof mockIngredients>(
      "GET",
      "/ingredients",
      undefined,
      () => _mockIngredients,
    ),
  get: (id: number) =>
    tryRequest("GET", `/ingredients/${id}`, undefined, () =>
      _mockIngredients.find((i) => i.id === id),
    ),
  create: (data: { name: string; unit: string; stock_quantity: number }) =>
    tryRequest("POST", "/ingredients", data, () => {
      const item = { id: _nextId++, ...data };
      _mockIngredients.push(item);
      return item;
    }),
  update: (
    id: number,
    data: { name: string; unit: string; stock_quantity: number },
  ) =>
    tryRequest("PUT", `/ingredients/${id}`, data, () => {
      _mockIngredients = _mockIngredients.map((i) =>
        i.id === id ? { ...i, ...data } : i,
      );
      return _mockIngredients.find((i) => i.id === id);
    }),
  delete: (id: number) =>
    tryRequest("DELETE", `/ingredients/${id}`, undefined, () => {
      _mockIngredients = _mockIngredients.filter((i) => i.id !== id);
      return { success: true };
    }),
};

export const menuItemsApi = {
  list: () =>
    tryRequest<typeof mockMenuItems>(
      "GET",
      "/menu-items",
      undefined,
      () => _mockMenuItems,
    ),
  get: (id: number) =>
    tryRequest("GET", `/menu-items/${id}`, undefined, () =>
      _mockMenuItems.find((m) => m.id === id),
    ),
  create: (data: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    image_url: string;
    status: string;
    ingredients: number[];
  }) =>
    tryRequest("POST", "/menu-items", data, () => {
      const cat = _mockCategories.find((c) => c.id === data.category_id);
      const item = { id: _nextId++, ...data, category: cat?.name || "" };
      _mockMenuItems.push(item);
      return item;
    }),
  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category_id: number;
      image_url: string;
      status: string;
      ingredients: number[];
    }>,
  ) =>
    tryRequest("PUT", `/menu-items/${id}`, data, () => {
      _mockMenuItems = _mockMenuItems.map((m) =>
        m.id === id ? { ...m, ...data } : m,
      );
      return _mockMenuItems.find((m) => m.id === id);
    }),
  delete: (id: number) =>
    tryRequest("DELETE", `/menu-items/${id}`, undefined, () => {
      _mockMenuItems = _mockMenuItems.filter((m) => m.id !== id);
      return { success: true };
    }),
};

export const ordersApi = {
  list: (params?: { status?: string; from?: string; to?: string }) => {
    const query = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return tryRequest<typeof mockOrders>(
      "GET",
      `/orders${query}`,
      undefined,
      () => {
        let orders = [..._mockOrders];
        if (params?.status)
          orders = orders.filter((o) => o.status === params.status);
        return orders;
      },
    );
  },
  get: (id: number) =>
    tryRequest("GET", `/orders/${id}`, undefined, () =>
      _mockOrders.find((o) => o.id === id),
    ),
  create: (data: {
    table_id: number;
    items: { menu_item_id: number; quantity: number; price: number }[];
  }) =>
    tryRequest("POST", "/orders", data, () => {
      const table = _mockTables.find((t) => t.id === data.table_id);
      const total = data.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
      const menuItemMap = Object.fromEntries(
        _mockMenuItems.map((m) => [m.id, m.name]),
      );
      const order = {
        id: _nextId++,
        table_id: data.table_id,
        table_number: table?.number || 0,
        items: data.items.map((i) => ({
          ...i,
          name: menuItemMap[i.menu_item_id] || "",
        })),
        total: Math.round(total * 100) / 100,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      _mockOrders.unshift(order);
      if (table) {
        _mockTables = _mockTables.map((t) =>
          t.id === data.table_id ? { ...t, status: "occupied" } : t,
        );
      }
      return order;
    }),
  updateStatus: (id: number, status: string) =>
    tryRequest("PUT", `/orders/${id}/status`, { status }, () => {
      _mockOrders = _mockOrders.map((o) =>
        o.id === id ? { ...o, status } : o,
      );
      return _mockOrders.find((o) => o.id === id);
    }),
  delete: (id: number) =>
    tryRequest("DELETE", `/orders/${id}`, undefined, () => {
      _mockOrders = _mockOrders.filter((o) => o.id !== id);
      return { success: true };
    }),
};

export const tablesApi = {
  list: () =>
    tryRequest<typeof mockTables>(
      "GET",
      "/tables",
      undefined,
      () => _mockTables,
    ),
  get: (id: number) =>
    tryRequest("GET", `/tables/${id}`, undefined, () =>
      _mockTables.find((t) => t.id === id),
    ),
  create: (data: { number: number; capacity: number }) =>
    tryRequest("POST", "/tables", data, () => {
      const item = {
        id: _nextId++,
        ...data,
        status: "available",
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?data=table-${data.number}&size=100x100`,
      };
      _mockTables.push(item);
      return item;
    }),
  update: (
    id: number,
    data: { number: number; capacity: number; status: string },
  ) =>
    tryRequest("PUT", `/tables/${id}`, data, () => {
      _mockTables = _mockTables.map((t) =>
        t.id === id ? { ...t, ...data } : t,
      );
      return _mockTables.find((t) => t.id === id);
    }),
  delete: (id: number) =>
    tryRequest("DELETE", `/tables/${id}`, undefined, () => {
      _mockTables = _mockTables.filter((t) => t.id !== id);
      return { success: true };
    }),
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
