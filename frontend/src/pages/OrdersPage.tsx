import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ClipboardList,
  ShoppingCart,
  X,
  Minus,
  Search,
} from "lucide-react";
import { ConfirmModal } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import {
  ordersApi,
  menuItemsApi,
  tablesApi,
  categoriesApi,
  type CategoryRecord,
  type MenuItemRecord,
  type OrderRecord,
} from "../services/api";

type OrderStatus = OrderRecord["status"];

interface TableOption {
  id: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  preparing: "Đang pha chế",
  served: "Đã phục vụ",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["served", "cancelled"],
  served: ["paid"],
  paid: [],
  cancelled: [],
};

export default function OrdersPage() {
  const { showToast } = useToast();
  const [view, setView] = useState<"list" | "pos">("list");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [selectedTable, setSelectedTable] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [posSubmitting, setPosSubmitting] = useState(false);

  const normalizeTable = (table: {
    _id?: string;
    id?: string;
    code?: string;
    name?: string;
    capacity?: number;
    isActive?: boolean;
    number?: number;
    status?: string;
  }): TableOption => ({
    id: table.id ?? table._id ?? String(table.number ?? ""),
    code: table.code ?? String(table.number ?? table.id ?? table._id ?? ""),
    name: table.name ?? `Bàn ${table.code ?? table.number ?? table.id ?? ""}`,
    capacity: table.capacity ?? 0,
    isActive:
      typeof table.isActive === "boolean"
        ? table.isActive
        : table.status
          ? table.status === "available" || table.status === "occupied"
          : true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [ordersResult, menuResult, tablesResult, categoryResult] =
        await Promise.allSettled([
          ordersApi.list(),
          menuItemsApi.list({ limit: 1000 }),
          tablesApi.list(),
          categoriesApi.list(),
        ]);

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value);
      } else {
        showToast(
          `Không tải được danh sách đơn: ${ordersResult.reason instanceof Error ? ordersResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }

      if (menuResult.status === "fulfilled") {
        setMenuItems(menuResult.value);
      } else {
        showToast(
          `Không tải được món ăn: ${menuResult.reason instanceof Error ? menuResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }

      if (tablesResult.status === "fulfilled") {
        setTables(
          (tablesResult.value as Array<Record<string, unknown>>).map((table) =>
            normalizeTable(table as never),
          ),
        );
      } else {
        showToast(
          `Không tải được danh sách bàn: ${tablesResult.reason instanceof Error ? tablesResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(categoryResult.value);
      } else {
        showToast(
          `Không tải được danh mục: ${categoryResult.reason instanceof Error ? categoryResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await ordersApi.updateStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      showToast("Cập nhật trạng thái đơn thành công", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await ordersApi.delete(deleteTarget.id);
      showToast("Xóa đơn hàng thành công", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const addToCart = (item: MenuItemRecord) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing)
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((c) =>
        c.menuItemId === id ? { ...c, quantity: c.quantity + delta } : c,
      );
      return updated.filter((c) => c.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const submitOrder = async () => {
    if (!selectedTable) {
      showToast("Vui lòng chọn bàn trước", "warning");
      return;
    }
    if (cart.length === 0) {
      showToast("Vui lòng thêm món vào giỏ", "warning");
      return;
    }
    setPosSubmitting(true);
    try {
      await ordersApi.create({
        tableId: selectedTable,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
      });
      showToast("Tạo đơn hàng thành công", "success");
      setCart([]);
      setSelectedTable("");
      setView("list");
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setPosSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = !filterStatus || o.status === filterStatus;
    const matchSearch =
      !search ||
      String(o.id).includes(search) ||
      (o.table?.name || o.table?.code || "").includes(search);
    return matchStatus && matchSearch;
  });

  const filteredMenu = menuItems.filter((m) => {
    const matchCat = !selectedCategory || m.categoryId === selectedCategory;
    const matchSearch = m.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchCat && matchSearch && m.isAvailable;
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " · " +
      d.toLocaleDateString()
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Đơn hàng</h1>
          <p className="text-sm text-espresso-400">
            Tổng {orders.length} đơn hàng
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-cream-100 rounded-lg p-1 border border-cream-200">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${view === "list" ? "bg-white shadow-sm text-terracotta" : "text-espresso-400"}`}
            >
              <span className="flex items-center gap-1.5">
                <ClipboardList size={14} />
                Danh sách đơn
              </span>
            </button>
            <button
              onClick={() => setView("pos")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${view === "pos" ? "bg-white shadow-sm text-terracotta" : "text-espresso-400"}`}
            >
              <span className="flex items-center gap-1.5">
                <Plus size={14} />
                Tạo đơn mới
              </span>
            </button>
          </div>
        </div>
      </div>

      {view === "list" ? (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300"
              />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, bàn..."
                className="input-field pl-8 py-1.5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field py-1.5 w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                <option key={s} value={s} className="capitalize">
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-100 border-b border-cream-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Bàn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Món
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={5} cols={7} />
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<ClipboardList size={28} />}
                        title="Không tìm thấy đơn hàng"
                        description="Tạo đơn mới từ khu vực POS"
                        action={
                          <button
                            onClick={() => setView("pos")}
                            className="btn-primary"
                          >
                            <Plus size={14} />
                            Tạo đơn mới
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="table-row-stripe border-b border-cream-100"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-espresso-400">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-espresso">
                        {order.table?.name || order.table?.code || "Chưa rõ"}
                      </td>
                      <td className="px-4 py-3 text-espresso-500 max-w-[180px]">
                        <div className="truncate text-xs">
                          {order.items
                            .map((i) => `${i.name}×${i.quantity}`)
                            .join(", ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-espresso">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <select
                            className="input-field py-1 text-xs min-w-[150px]"
                            value={order.status}
                            onChange={(e) => {
                              const next = e.target.value as OrderStatus;
                              if (next !== order.status) {
                                handleStatusChange(order.id, next);
                              }
                            }}
                            disabled={
                              STATUS_TRANSITIONS[order.status].length === 0
                            }
                          >
                            <option value={order.status}>
                              {STATUS_LABELS[order.status]}
                            </option>
                            {STATUS_TRANSITIONS[order.status].map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-espresso-400 whitespace-nowrap">
                        {formatTime(
                          order.createdAt || new Date().toISOString(),
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setDeleteTarget(order)}
                            className="btn-danger py-1 px-2"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[160px]">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300"
                />
                <input
                  type="text"
                  placeholder="Tìm món..."
                  className="input-field pl-8 py-1.5"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? "bg-terracotta text-white" : "bg-white border border-cream-200 text-espresso-500 hover:bg-cream-100"}`}
                >
                  Tất cả
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(String(c.id))}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === String(c.id) ? "bg-terracotta text-white" : "bg-white border border-cream-200 text-espresso-500 hover:bg-cream-100"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenu.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`card text-left hover:shadow-md transition-all p-3 group active:scale-95 ${inCart ? "ring-2 ring-terracotta" : ""}`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-24 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                      }}
                    />
                    <p className="font-semibold text-espresso text-sm leading-tight">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-terracotta font-bold text-sm">
                        ${item.price.toFixed(2)}
                      </span>
                      {inCart && (
                        <span className="text-xs bg-terracotta text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-4 flex flex-col h-fit lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cream-200">
              <ShoppingCart size={18} className="text-terracotta" />
              <h3 className="font-serif text-lg font-semibold text-espresso">
                Tóm tắt đơn hàng
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="ml-auto text-xs text-espresso-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Bàn</label>
              <select
                className="input-field"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">Chọn bàn...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.code ? `(${t.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart size={32} className="text-cream-300 mb-2" />
                <p className="text-sm text-espresso-400">
                  Nhấn vào món để thêm vào giỏ
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-espresso truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-espresso-400">
                        ${item.price.toFixed(2)} / món
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQty(item.menuItemId, -1)}
                        className="w-6 h-6 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-espresso">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.menuItemId, 1)}
                        className="w-6 h-6 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-espresso w-14 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-cream-200 pt-3 space-y-3">
              <div className="flex justify-between text-base font-bold text-espresso">
                <span>Tổng cộng</span>
                <span className="font-serif text-lg">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={submitOrder}
                disabled={posSubmitting || cart.length === 0 || !selectedTable}
                className="w-full py-3 bg-terracotta hover:bg-terracotta-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {posSubmitting ? "Đang tạo đơn..." : "Tạo đơn hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa đơn hàng"
        message={`Bạn có chắc muốn xóa đơn #${deleteTarget?.id}? Hành động này không thể hoàn tác.`}
        loading={saving}
      />
    </div>
  );
}
