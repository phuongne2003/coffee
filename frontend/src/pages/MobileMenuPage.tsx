import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  ShoppingCart,
  X,
  Phone,
  Search,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuData {
  categories: Category[];
  items: MenuItem[];
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export default function MobileMenuPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualTableCode, setManualTableCode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Fetch menu data
  useEffect(() => {
    if (!tableCode) {
      setLoading(false);
      return;
    }

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4000/api/mobile/menu/${encodeURIComponent(tableCode)}`,
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              (response.status === 404
                ? "Bàn không tồn tại"
                : response.status === 409
                  ? "Bàn đã có đơn, vui lòng chọn bàn khác"
                  : "Lỗi tải menu"),
          );
        }

        if (!data.success) {
          throw new Error(data.message || "Lỗi tải menu");
        }

        // Backend returns menu items nested under each category in categories[].items.
        const categoriesRaw = Array.isArray(data.data?.categories)
          ? data.data.categories
          : [];

        const normalized: MenuData = {
          categories: categoriesRaw.map((c: any) => ({
            id: c._id || c.id,
            name: c.name,
          })),
          items: categoriesRaw.flatMap((c: any) => {
            const categoryId = c._id || c.id;
            const items = Array.isArray(c.items) ? c.items : [];

            return items.map((item: any) => ({
              id: item._id || item.id,
              name: item.name,
              price: item.price || 0,
              description: item.description,
              imageUrl: item.imageUrl,
              categoryId: item.categoryId?._id || item.categoryId || categoryId,
            }));
          }),
        };

        setMenuData(normalized);
        setSelectedCategory("");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi không xác định");
        setMenuData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [tableCode]);

  const openTableMenu = () => {
    const normalized = manualTableCode.trim().toLowerCase();

    if (!normalized) {
      showToast("Vui lòng nhập mã bàn", "error");
      return;
    }

    navigate(`/menu/${normalized}`);
  };

  const handleLogout = () => {
    logout();
    showToast("Đã đăng xuất", "success");
    navigate("/login", { replace: true });
  };

  // Filter items
  const filteredItems =
    menuData?.items.filter((item) => {
      const matchCategory =
        !selectedCategory || item.categoryId === selectedCategory;
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    }) || [];

  const hasMenuItems = (menuData?.items.length ?? 0) > 0;

  // Cart calculations
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartItemCount = cart.length;
  const cartQuantityCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add to cart
  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ]);
    }
    showToast(`${item.name} đã thêm vào giỏ`, "success");
  };

  // Remove from cart
  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((c) => c.menuItemId !== menuItemId));
  };

  // Update quantity
  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: Math.max(1, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!tableCode || cart.length === 0) {
      showToast("Vui lòng chọn ít nhất một món", "error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("http://localhost:4000/api/mobile/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableCode: tableCode.toUpperCase(),
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tạo đơn hàng");
      }

      setOrderId(data.data?.id || data.data?._id || "#" + Date.now());
      setCart([]);
      setShowCart(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Lỗi tạo đơn hàng",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-terracotta/20 mb-4">
            <ShoppingCart
              size={24}
              className="text-terracotta animate-bounce"
            />
          </div>
          <p className="text-espresso-400 text-sm">Đang tải menu...</p>
        </div>
      </div>
    );
  }

  if (!tableCode) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-serif text-2xl font-bold text-espresso">
              Chọn bàn để xem menu
            </h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cream-200 text-espresso-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors text-sm"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
          <p className="text-sm text-espresso-400 mb-4">
            Nếu bạn đã quét QR thì hãy mở đúng mã bàn. Nếu chưa, hãy nhập mã bàn
            hoặc nhờ nhân viên hỗ trợ.
          </p>

          <div className="space-y-3">
            <div>
              <label className="label">Mã bàn</label>
              <input
                type="text"
                placeholder="Ví dụ: table-1"
                className="input-field"
                value={manualTableCode}
                onChange={(e) => setManualTableCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openTableMenu();
                }}
              />
            </div>
            <button
              onClick={openTableMenu}
              className="w-full px-4 py-3 bg-terracotta hover:bg-terracotta-600 text-white rounded-xl font-semibold transition-all"
            >
              Mở menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isTableOccupiedError = error.toLowerCase().includes("đã có đơn");

    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-50 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-espresso mb-2">{error}</h2>
          <p className="text-sm text-espresso-400 mb-4">
            {isTableOccupiedError
              ? "Vui lòng quay lại để chọn bàn khác"
              : "Vui lòng kiểm tra mã QR hoặc liên hệ quán"}
          </p>
          <button
            onClick={() => navigate("/menu", { replace: true })}
            className="w-full px-4 py-2 bg-terracotta hover:bg-terracotta-600 text-white rounded-lg font-medium transition-all"
          >
            Quay lại chọn bàn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur-sm">
        <div className="px-4 py-3 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-cream-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-serif font-bold text-espresso tracking-tight">
                  ☕ Menu
                </h1>
                <p className="text-xs text-espresso-400 mt-0.5">
                  Bàn {tableCode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cream-200 text-espresso-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors text-sm"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-2 hover:bg-cream-100 rounded-lg transition-colors"
                >
                  <ShoppingCart size={20} className="text-terracotta" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300"
              />
              <input
                type="text"
                placeholder="Tìm món..."
                className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm text-espresso placeholder:text-espresso-300 focus:outline-none focus:ring-1 focus:ring-terracotta"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {menuData && menuData.categories.length > 0 && (
        <div className="sticky top-[94px] z-30 border-b border-cream-200 bg-white/95 backdrop-blur-sm overflow-x-auto">
          <div className="px-4 py-3 flex gap-2 max-w-5xl mx-auto">
            <button
              onClick={() => setSelectedCategory("")}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                !selectedCategory
                  ? "bg-terracotta text-white shadow-sm"
                  : "bg-cream-100 text-espresso-500 hover:bg-cream-200"
              }`}
            >
              Tất cả
            </button>
            {menuData.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-cream-100 text-espresso-500 hover:bg-cream-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="px-4 py-6 max-w-5xl mx-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-cream-300 bg-white/40">
            <ShoppingCart size={32} className="text-cream-300 mx-auto mb-3" />
            <p className="text-espresso-400 text-sm font-medium">
              {hasMenuItems
                ? "Không có món phù hợp với bộ lọc hiện tại"
                : "Hiện chưa có món nào đang bán"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`group relative text-left rounded-2xl border border-cream-200 bg-white p-2 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] ${
                    inCart ? "ring-2 ring-terracotta border-terracotta/40" : ""
                  }`}
                >
                  <div className="relative rounded-xl overflow-visible bg-[#eceff1]">
                    <img
                      src={
                        item.imageUrl ||
                        "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400"
                      }
                      alt={item.name}
                      className="w-full h-[124px] object-contain object-center transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 -mt-6 bg-gradient-to-r from-red-700 to-red-600 text-white px-2.5 py-1.5 rounded-b-xl shadow-[0_-6px_18px_rgba(127,29,29,0.35)] text-center">
                      <p className="text-[13px] font-semibold leading-tight line-clamp-1">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="px-1 pt-2 pb-1 min-h-[94px] bg-white">
                    <p className="text-[13px] text-espresso-500 line-clamp-2 min-h-[36px]">
                      {item.description?.trim() || "Chưa có mô tả"}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-emerald-700 font-extrabold text-[22px] leading-none font-serif tracking-tight">
                        ${item.price.toFixed(2)}
                      </span>
                      {inCart ? (
                        <span className="text-xs bg-terracotta text-white rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center font-bold shadow-sm">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center text-base font-semibold">
                          +
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-espresso">
                  Giỏ hàng
                </h2>
                <p className="text-xs text-espresso-400 mt-1">
                  Bàn {tableCode}
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 hover:bg-cream-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-espresso-400" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <ShoppingCart
                    size={28}
                    className="text-cream-300 mx-auto mb-2"
                  />
                  <p className="text-sm text-espresso-400">Giỏ hàng trống</p>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <p className="text-xs text-espresso-400 mb-2">
                  Có {cartItemCount} món trong giỏ (tổng số lượng:{" "}
                  {cartQuantityCount})
                </p>
                <div className="space-y-2 mb-4 overflow-y-auto max-h-[40vh] pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center gap-2 p-2 bg-cream-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-espresso-400">
                          ${item.price.toFixed(2)} / cái
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-6 h-6 rounded-full bg-white hover:bg-cream-100 flex items-center justify-center transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-6 h-6 rounded-full bg-white hover:bg-cream-100 flex items-center justify-center transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t border-cream-200 pt-3 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-espresso-400 text-sm">Tổng cộng</span>
                    <span className="font-serif text-xl font-bold text-terracotta">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCart(false)}
                      className="flex-1 px-4 py-2 bg-cream-100 hover:bg-cream-200 text-espresso rounded-lg font-medium transition-colors"
                    >
                      Tiếp tục chọn
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-terracotta hover:bg-terracotta-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Đang gửi..." : "Đặt đơn"}
                    </button>
                  </div>
                </div>

                {/* Support Info */}
                <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg text-xs text-sky-700">
                  <Phone size={14} />
                  Cần hỗ trợ? Gọi nhân viên
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartItemCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 px-4 py-3 bg-terracotta hover:bg-terracotta-600 text-white rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all active:scale-95"
        >
          <ShoppingCart size={18} />
          Giỏ {cartItemCount}
        </button>
      )}

      {/* Order Confirmation Modal */}
      {orderId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center sm:justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[60vh] sm:min-h-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <ShoppingCart size={32} className="text-emerald-600" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-espresso mb-2">
              Đặt đơn thành công!
            </h2>
            <p className="text-espresso-400 text-sm mb-6">
              Đơn hàng của bạn đã được gửi đến nhân viên.
            </p>
            <div className="bg-cream-50 rounded-xl px-4 py-3 mb-6 w-full">
              <p className="text-xs text-espresso-400 mb-1">Mã đơn hàng</p>
              <p className="font-mono text-xl font-bold text-terracotta">
                {orderId}
              </p>
            </div>
            <div className="bg-sky-50 rounded-xl px-4 py-3 mb-6 w-full flex items-start gap-3">
              <Phone size={16} className="text-sky-600 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-medium text-sky-700">Cần hỗ trợ?</p>
                <p className="text-xs text-sky-600">
                  Gọi nhân viên hoặc quét QR trên bàn
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOrderId(null);
                setSearch("");
                setSelectedCategory("");
              }}
              className="w-full px-4 py-2 bg-terracotta hover:bg-terracotta-600 text-white rounded-lg font-medium transition-all"
            >
              Quay lại menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
