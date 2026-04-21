import { Category } from "../models/category.model";
import { Ingredient } from "../models/ingredient.model";
import { MenuItem } from "../models/menu-item.model";
import { Order } from "../models/order.model";

type TopItem = { name: string; count: number };

type CategoryReportItem = {
  category: string;
  revenue: number;
  count: number;
};

type TrendItem = {
  date: string;
  revenue: number;
  orders: number;
};

type InventoryItem = {
  ingredient_id: string;
  name: string;
  stock: number;
  threshold: number;
  status: "ok" | "low" | "critical";
};

const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);

const getInventoryStatus = (
  stock: number,
  threshold: number,
): "ok" | "low" | "critical" => {
  if (threshold <= 0) return "ok";
  if (stock <= 0 || stock <= threshold / 2) return "critical";
  if (stock <= threshold) return "low";
  return "ok";
};

export const getSummaryReport = async () => {
  const orders = await Order.find({ status: { $ne: "cancelled" } })
    .select("items totalAmount")
    .lean();

  const total_orders = orders.length;
  const total_revenue = Number(
    orders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0).toFixed(2),
  );
  const avg_order_value = Number(
    (total_orders > 0 ? total_revenue / total_orders : 0).toFixed(2),
  );

  const topMap = new Map<string, TopItem>();

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const key = `${String(item.menuItemId)}:${item.name}`;
      const current = topMap.get(key);
      if (current) {
        current.count += item.quantity ?? 0;
      } else {
        topMap.set(key, { name: item.name, count: item.quantity ?? 0 });
      }
    }
  }

  const top_items = Array.from(topMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    total_revenue,
    total_orders,
    avg_order_value,
    top_items,
  };
};

export const getCategoryReport = async (): Promise<CategoryReportItem[]> => {
  const [categories, menuItems, orders] = await Promise.all([
    Category.find({ isActive: true }).select("name").lean(),
    MenuItem.find({ isActive: true }).select("_id categoryId").lean(),
    Order.find({ status: { $ne: "cancelled" } })
      .select("items")
      .lean(),
  ]);

  const categoryById = new Map<string, string>();
  categories.forEach((c) => categoryById.set(String(c._id), c.name));

  const menuItemCategory = new Map<string, string>();
  menuItems.forEach((m) =>
    menuItemCategory.set(String(m._id), String(m.categoryId)),
  );

  const resultMap = new Map<string, CategoryReportItem>();

  categories.forEach((c) => {
    resultMap.set(String(c._id), {
      category: c.name,
      revenue: 0,
      count: 0,
    });
  });

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const catId = menuItemCategory.get(String(item.menuItemId));
      if (!catId) continue;

      const current = resultMap.get(catId) ?? {
        category: categoryById.get(catId) ?? "Khác",
        revenue: 0,
        count: 0,
      };

      const lineTotal =
        item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 0);
      current.revenue += lineTotal;
      current.count += item.quantity ?? 0;
      resultMap.set(catId, current);
    }
  }

  return Array.from(resultMap.values()).map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(2)),
  }));
};

export const getTrendReport = async (): Promise<TrendItem[]> => {
  const now = new Date();
  const days: Date[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const start = new Date(days[0]);
  const end = new Date(now);

  const orders = await Order.find({
    status: { $ne: "cancelled" },
    createdAt: { $gte: start, $lte: end },
  })
    .select("createdAt totalAmount")
    .lean();

  const buckets = new Map<string, { revenue: number; orders: number }>();
  days.forEach((d) => {
    buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  });

  for (const order of orders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.totalAmount ?? 0;
    bucket.orders += 1;
  }

  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { revenue: 0, orders: 0 };

    return {
      date: dayLabel(d),
      revenue: Number(bucket.revenue.toFixed(2)),
      orders: bucket.orders,
    };
  });
};

export const getInventoryReport = async (): Promise<InventoryItem[]> => {
  const ingredients = await Ingredient.find({ isActive: true })
    .select("name currentStock alertThreshold")
    .lean();

  return ingredients
    .map((i) => ({
      ingredient_id: String(i._id),
      name: i.name,
      stock: i.currentStock,
      threshold: i.alertThreshold,
      status: getInventoryStatus(i.currentStock, i.alertThreshold),
    }))
    .sort((a, b) => {
      const weight = { critical: 0, low: 1, ok: 2 } as const;
      const diff = weight[a.status] - weight[b.status];
      if (diff !== 0) return diff;
      return a.stock - b.stock;
    });
};
