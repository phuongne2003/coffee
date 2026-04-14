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
} from "lucide-react";
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
  const { showToast } = useToast();

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualTableCode, setManualTableCode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showCart, setShowCart] = useState(false);

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

        if (!response.ok) {
          throw new Error(
            response.status === 404 ? "Bàn không tồn tại" : "Lỗi tải menu",
          );
        }

        const data = await response.json();

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
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          customerName: customerName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi tạo đơn hàng");
      }

      showToast("Đặt đơn thành công! Cảm ơn bạn.", "success");
      setCart([]);
      setCustomerName("");
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
          <h1 className="font-serif text-2xl font-bold text-espresso mb-2">
            Chọn bàn để xem menu
          </h1>
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-50 px-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-espresso mb-2">{error}</h2>
          <p className="text-sm text-espresso-400 mb-4">
            Vui lòng kiểm tra mã QR hoặc liên hệ quán
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-terracotta hover:bg-terracotta-600 text-white rounded-lg font-medium transition-all"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-cream-200 shadow-sm">
        <div className="px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-serif font-bold text-espresso">
                ☕ Menu
              </h1>
              <p className="text-xs text-espresso-400">Bàn {tableCode}</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} className="text-terracotta" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-terracotta text-white text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
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
              className="w-full pl-8 pr-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm text-espresso placeholder:text-espresso-300 focus:outline-none focus:ring-1 focus:ring-terracotta"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {menuData && menuData.categories.length > 0 && (
        <div className="sticky top-16 z-30 bg-white border-b border-cream-200 overflow-x-auto">
          <div className="px-4 py-3 flex gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedCategory("")}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                !selectedCategory
                  ? "bg-terracotta text-white shadow-md"
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
                    ? "bg-terracotta text-white shadow-md"
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
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={32} className="text-cream-300 mx-auto mb-3" />
            <p className="text-espresso-400 text-sm">
              {hasMenuItems
                ? "Không có món phù hợp với bộ lọc hiện tại"
                : "Hiện chưa có món nào đang bán"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`relative group card text-left hover:shadow-md transition-all p-3 active:scale-95 ${
                    inCart ? "ring-2 ring-terracotta" : ""
                  }`}
                >
                  {/* Image */}
                  <img
                    src={
                      item.imageUrl ||
                      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400"
                    }
                    alt={item.name}
                    className="w-full h-24 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                    }}
                  />

                  {/* Name & Price */}
                  <p className="font-semibold text-espresso text-sm leading-tight line-clamp-2">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
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
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl sm:max-h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-espresso">
                Giỏ hàng
              </h2>
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
                <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-48">
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

                {/* Customer Name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-espresso-400 mb-1">
                    Tên khách (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Tên của bạn..."
                    className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm text-espresso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
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
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 px-4 py-3 bg-terracotta hover:bg-terracotta-600 text-white rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all active:scale-95"
        >
          <ShoppingCart size={18} />
          Giỏ {cartCount}
        </button>
      )}
    </div>
  );
}
