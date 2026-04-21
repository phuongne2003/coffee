import { Category } from "../models/category.model";
import { Ingredient } from "../models/ingredient.model";
import { MenuItem } from "../models/menu-item.model";
import { Order } from "../models/order.model";

export type ReportSummary = {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  top_items: { name: string; count: number }[];
};

export type ReportCategoryItem = {
  category: string;
  revenue: number;
  count: number;
};

export type ReportTrendItem = {
  date: string;
  revenue: number;
  orders: number;
};

export type ReportInventoryItem = {
  ingredient_id: string;
  name: string;
  stock: number;
  threshold: number;
  status: "ok" | "low" | "critical";
};

const REPORT_TIME_ZONE = "Asia/Ho_Chi_Minh";

const DATE_LABEL_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: REPORT_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

const DATE_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toDateParts = (date: Date | string) => {
  const parts = DATE_KEY_FORMAT.formatToParts(new Date(date));
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return { year, month, day };
};

const toDateKey = (date: Date | string) => {
  const { year, month, day } = toDateParts(date);
  return `${year}-${month}-${day}`;
};

const toDateLabel = (date: Date) => DATE_LABEL_FORMAT.format(date);

const startOfToday = () => {
  const now = new Date();
  const { year, month, day } = toDateParts(now);
  return new Date(`${year}-${month}-${day}T00:00:00+07:00`);
};

const createTrendWindow = (days = 7) => {
  const today = startOfToday();
  const window: { key: string; date: Date; label: string }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    window.push({
      key: toDateKey(date),
      date,
      label: toDateLabel(date),
    });
  }

  return window;
};

const getInventoryStatus = (
  stock: number,
  threshold: number,
): "ok" | "low" | "critical" => {
  if (threshold <= 0) {
    return "ok";
  }

  if (stock <= 0 || stock <= threshold / 2) {
    return "critical";
  }

  if (stock <= threshold) {
    return "low";
  }

  return "ok";
};

export const getSummaryReport = async (): Promise<ReportSummary> => {
  const orders = await Order.find({ status: { $ne: "cancelled" } })
    .select("items totalAmount")
    .lean();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.totalAmount ?? 0),
    0,
  );

  const topItemsMap = new Map<string, number>();
  const topItemNames = new Map<string, string>();

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const key = String(item.menuItemId);
      topItemNames.set(key, item.name);
      topItemsMap.set(key, (topItemsMap.get(key) ?? 0) + (item.quantity ?? 0));
    }
  }

  const topItems = Array.from(topItemsMap.entries())
    .map(([key, count]) => ({
      name: topItemNames.get(key) ?? "Không rõ",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    total_revenue: Number(totalRevenue.toFixed(2)),
    total_orders: totalOrders,
    avg_order_value: Number(
      (totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2),
    ),
    top_items: topItems,
  };
};

export const getCategoryReport = async (): Promise<ReportCategoryItem[]> => {
  const [categories, menuItems, orders] = await Promise.all([
    Category.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean(),
    MenuItem.find({ isActive: true, isAvailable: true })
      .select("_id categoryId")
      .lean(),
    Order.find({ status: { $ne: "cancelled" } })
      .select("items")
      .lean(),
  ]);

  const categoryNameMap = new Map<string, string>();
  const categoryTotals = new Map<
    string,
    { category: string; revenue: number; count: number }
  >();

  for (const category of categories) {
    const categoryId = String(category._id);
    categoryNameMap.set(categoryId, category.name);
    categoryTotals.set(categoryId, {
      category: category.name,
      revenue: 0,
      count: 0,
    });
  }

  const menuItemCategoryMap = new Map<string, string>();
  for (const menuItem of menuItems) {
    menuItemCategoryMap.set(String(menuItem._id), String(menuItem.categoryId));
  }

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const menuItemId = String(item.menuItemId);
      const categoryId = menuItemCategoryMap.get(menuItemId);

      if (!categoryId) {
        continue;
      }

      const current = categoryTotals.get(categoryId) ?? {
        category: categoryNameMap.get(categoryId) ?? "Khác",
        revenue: 0,
        count: 0,
      };

      const lineTotal =
        item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 0);

      current.revenue += lineTotal;
      current.count += item.quantity ?? 0;
      categoryTotals.set(categoryId, current);
    }
  }

  return Array.from(categoryTotals.values()).map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(2)),
  }));
};

export const getTrendReport = async (): Promise<ReportTrendItem[]> => {
  const trendWindow = createTrendWindow(7);
  const orderBuckets = new Map<string, { revenue: number; orders: number }>();

  for (const item of trendWindow) {
    orderBuckets.set(item.key, { revenue: 0, orders: 0 });
  }

  const orders = await Order.find({ status: { $ne: "cancelled" } })
    .select("totalAmount createdAt")
    .lean();

  for (const order of orders) {
    const key = toDateKey(order.createdAt);
    const bucket = orderBuckets.get(key);

    if (!bucket) {
      continue;
    }

    bucket.revenue += order.totalAmount ?? 0;
    bucket.orders += 1;
  }

  return trendWindow.map((item) => ({
    date: item.label,
    revenue: Number((orderBuckets.get(item.key)?.revenue ?? 0).toFixed(2)),
    orders: orderBuckets.get(item.key)?.orders ?? 0,
  }));
};

export const getInventoryReport = async (): Promise<ReportInventoryItem[]> => {
  const ingredients = await Ingredient.find({ isActive: true })
    .sort({ currentStock: 1, name: 1 })
    .lean();

  return ingredients
    .map((ingredient) => ({
      ingredient_id: String(ingredient._id),
      name: ingredient.name,
      stock: ingredient.currentStock,
      threshold: ingredient.alertThreshold,
      status: getInventoryStatus(
        ingredient.currentStock,
        ingredient.alertThreshold,
      ),
    }))
    .sort((a, b) => {
      const severityOrder = { critical: 0, low: 1, ok: 2 } as const;
      const severityDiff = severityOrder[a.status] - severityOrder[b.status];

      if (severityDiff !== 0) {
        return severityDiff;
      }

      return a.stock - b.stock;
    });
};