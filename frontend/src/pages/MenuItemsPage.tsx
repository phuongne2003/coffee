import { useEffect, useState, FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Coffee,
  Search,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
} from "lucide-react";
import Modal, { ConfirmModal } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/SkeletonLoader";
import { AvailabilityBadge } from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { menuItemsApi, categoriesApi, ingredientsApi } from "../services/api";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl?: string;
  isAvailable: boolean;
  recipe: Array<{ ingredientId: string; quantity: number }>;
}

interface Category {
  id: string;
  name: string;
}
interface Ingredient {
  id: string;
  name: string;
}

interface RecipeFormItem {
  ingredientId: string;
  quantity: string;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
  status: string;
  ingredients: RecipeFormItem[];
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const isValidImageReference = (value: string) => {
  if (!value) {
    return true;
  }

  if (value.startsWith("data:image/")) {
    return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Không đọc được ảnh"));
    };
    reader.onerror = () => reject(new Error("Không đọc được ảnh"));
    reader.readAsDataURL(file);
  });

export default function MenuItemsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    status: "available",
    ingredients: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleAvailability = async (item: MenuItem) => {
    try {
      setTogglingId(item.id);
      const newStatus = !item.isAvailable;
      await menuItemsApi.toggleAvailability(item.id, newStatus);
      showToast(
        newStatus ? "Đã bật hiển thị món" : "Đã tắt hiển thị món",
        "success",
      );
      // Refresh items
      await load();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Lỗi thay đổi trạng thái",
        "error",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [menuResult, categoryResult, ingredientResult] =
        await Promise.allSettled([
          menuItemsApi.list({ isActive: true, limit: 1000 }),
          categoriesApi.list(),
          ingredientsApi.list({ isActive: true, limit: 1000 }),
        ]);

      if (menuResult.status === "fulfilled") {
        setItems(menuResult.value as MenuItem[]);
      } else {
        showToast(
          `Không tải được danh sách món: ${menuResult.reason instanceof Error ? menuResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(categoryResult.value as Category[]);
      } else {
        showToast(
          `Không tải được danh mục: ${categoryResult.reason instanceof Error ? categoryResult.reason.message : "Lỗi không xác định"}`,
          "error",
        );
      }

      if (ingredientResult.status === "fulfilled") {
        setIngredients(ingredientResult.value as Ingredient[]);
      } else {
        showToast(
          `Không tải được nguyên liệu: ${ingredientResult.reason instanceof Error ? ingredientResult.reason.message : "Lỗi không xác định"}`,
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

  const emptyForm: FormState = {
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    status: "available",
    ingredients: [],
  };

  const isIngredientSelected = (ingredientId: string) =>
    form.ingredients.some((item) => item.ingredientId === ingredientId);

  const getIngredientQuantity = (ingredientId: string) =>
    form.ingredients.find((item) => item.ingredientId === ingredientId)
      ?.quantity ?? "1";

  const getTotalRecipeQuantity = (recipe: Array<{ quantity: number }>) =>
    recipe.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
    if (categories.length === 0) {
      showToast(
        "Chưa có danh mục. Hãy tạo danh mục trước khi thêm món.",
        "warning",
      );
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || "",
      status: item.isAvailable ? "available" : "unavailable",
      ingredients: (item.recipe || []).map((r) => ({
        ingredientId: r.ingredientId,
        quantity: String(r.quantity ?? 1),
      })),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên món là bắt buộc";
    const normalizedPrice = form.price.trim().replace(",", ".");
    const parsedPrice = Number(normalizedPrice);
    if (!normalizedPrice) {
      e.price = "Giá không được để trống";
    } else if (Number.isNaN(parsedPrice)) {
      e.price = "Giá phải là số";
    } else {
      if (parsedPrice <= 0) e.price = "Giá phải lớn hơn 0";
    }
    if (!form.categoryId) e.categoryId = "Vui lòng chọn danh mục";
    if (form.imageUrl && !isValidImageReference(form.imageUrl.trim())) {
      e.imageUrl = "URL ảnh không hợp lệ";
    }
    if (form.ingredients.length === 0) {
      e.recipe = "Vui lòng chọn ít nhất 1 nguyên liệu";
    }
    form.ingredients.forEach((item, index) => {
      const quantity = Number(item.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        e[`recipe-${index}`] = "Số lượng phải lớn hơn 0";
      }
    });
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price.trim().replace(",", ".")),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl.trim() || undefined,
        isAvailable: form.status === "available",
        recipe: form.ingredients.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: Number(item.quantity),
        })),
      };
      if (editing) {
        await menuItemsApi.update(editing.id, payload);
        showToast("Cập nhật món thành công", "success");
      } else {
        await menuItemsApi.create(payload);
        showToast("Thêm món thành công", "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setFormErrors((current) => ({
        ...current,
        imageUrl: "Ảnh phải có định dạng jpg, png hoặc webp",
      }));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormErrors((current) => ({
        ...current,
        imageUrl: "Ảnh phải nhỏ hơn hoặc bằng 5MB",
      }));
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, imageUrl: dataUrl }));
      setFormErrors((current) => {
        const next = { ...current };
        delete next.imageUrl;
        return next;
      });
    } catch (error) {
      setFormErrors((current) => ({
        ...current,
        imageUrl: error instanceof Error ? error.message : "Không đọc được ảnh",
      }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await menuItemsApi.delete(deleteTarget.id);
      showToast("Xóa món thành công", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleIngredient = (id: string) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.some((item) => item.ingredientId === id)
        ? f.ingredients.filter((item) => item.ingredientId !== id)
        : [...f.ingredients, { ingredientId: id, quantity: "1" }],
    }));
  };

  const updateIngredientQuantity = (ingredientId: string, quantity: string) => {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((item) =>
        item.ingredientId === ingredientId ? { ...item, quantity } : item,
      ),
    }));
  };

  const filtered = items.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || m.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  const hasNoCategories = categories.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Món ăn</h1>
          <p className="text-sm text-espresso-400">
            {items.length} món trong menu
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Thêm món
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300"
          />
          <input
            type="text"
            placeholder="Tìm món..."
            className="input-field pl-8 py-1.5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field py-1.5 w-auto"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 bg-cream-100 rounded-lg p-1 border border-cream-200">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm text-terracotta" : "text-espresso-400"}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm text-terracotta" : "text-espresso-400"}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Coffee size={28} />}
            title="Chưa có món nào"
            description="Hãy thêm món đầu tiên để bắt đầu"
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus size={14} />
                Thêm món
              </button>
            }
          />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card group hover:shadow-md transition-shadow"
            >
              <div className="relative overflow-hidden h-44 bg-cream-50 flex items-center justify-center">
                <img
                  src={
                    item.imageUrl ||
                    "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400"
                  }
                  alt={item.name}
                  className="w-full h-full object-contain object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                  }}
                />
                <div className="absolute top-2 right-2">
                  <AvailabilityBadge
                    status={item.isAvailable ? "available" : "unavailable"}
                  />
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-terracotta font-semibold mb-1">
                  {item.categoryName || "Khác"}
                </p>
                <h3 className="font-serif font-semibold text-espresso text-base leading-tight mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-espresso-400 mb-3 line-clamp-2">
                  {item.description?.trim() || "Chưa có mô tả"}
                </p>
                <div className="mb-3 flex items-center justify-between text-xs text-espresso-400">
                  <span>
                    Tổng định lượng: {getTotalRecipeQuantity(item.recipe)}
                  </span>
                  <span>{item.recipe.length} nguyên liệu</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-espresso text-lg">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleAvailability(item)}
                      disabled={togglingId === item.id}
                      className={`py-1 px-2 rounded transition-colors ${
                        item.isAvailable
                          ? "text-terracotta hover:bg-terracotta-50"
                          : "text-espresso-300 hover:bg-espresso-50"
                      } ${
                        togglingId === item.id
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-opacity-10"
                      }`}
                      title={item.isAvailable ? "Tắt hiển thị" : "Bật hiển thị"}
                    >
                      {item.isAvailable ? (
                        <Eye size={13} />
                      ) : (
                        <EyeOff size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="btn-ghost py-1 px-2"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="btn-danger py-1 px-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100 border-b border-cream-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Món
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Giá
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="table-row-stripe border-b border-cream-100"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-espresso">
                          {item.name}
                        </p>
                        <p className="text-xs text-espresso-400 truncate max-w-[160px]">
                          {item.description?.trim() || "Chưa có mô tả"}
                        </p>
                        <p className="text-[11px] text-espresso-400 mt-1">
                          Tổng định lượng: {getTotalRecipeQuantity(item.recipe)}{" "}
                          | {item.recipe.length} nguyên liệu
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-espresso-500">
                    {item.categoryName || "Khác"}
                  </td>
                  <td className="px-4 py-3 font-bold text-espresso">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge
                      status={item.isAvailable ? "available" : "unavailable"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAvailability(item)}
                        disabled={togglingId === item.id}
                        className={`py-1 px-2 rounded transition-colors ${
                          item.isAvailable
                            ? "text-terracotta hover:bg-terracotta-50"
                            : "text-espresso-300 hover:bg-espresso-50"
                        } ${
                          togglingId === item.id
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-opacity-10"
                        }`}
                        title={
                          item.isAvailable ? "Tắt hiển thị" : "Bật hiển thị"
                        }
                      >
                        {item.isAvailable ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="btn-ghost py-1 px-2"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="btn-danger py-1 px-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa món" : "Thêm món"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Tên món *</label>
              <input
                className={`input-field ${formErrors.name ? "border-red-400" : ""}`}
                placeholder="Ví dụ: Latte đặc biệt"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="label">Giá ($) *</label>
              <input
                type="text"
                inputMode="decimal"
                className={`input-field ${formErrors.price ? "border-red-400" : ""}`}
                placeholder="0.00"
                value={form.price}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setForm((f) => ({ ...f, price: nextValue }));
                  setFormErrors((current) => {
                    if (!current.price) return current;
                    const next = { ...current };
                    delete next.price;
                    return next;
                  });
                }}
              />
              {formErrors.price && (
                <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
              )}
            </div>
            <div>
              <label className="label">Danh mục *</label>
              <select
                className={`input-field ${formErrors.categoryId ? "border-red-400" : ""}`}
                value={form.categoryId}
                disabled={hasNoCategories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
              >
                <option value="">
                  {hasNoCategories ? "Chưa có danh mục nào" : "Chọn danh mục"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {hasNoCategories && (
                <p className="text-amber-700 text-xs mt-1">
                  Cần tạo ít nhất 1 danh mục ở trang Danh mục trước khi thêm
                  món.
                </p>
              )}
              {formErrors.categoryId && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.categoryId}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Mô tả</label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Mô tả ngắn..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className="label">Ảnh món</label>
              <div className="grid gap-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="input-field file:mr-4 file:rounded-md file:border-0 file:bg-terracotta file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-terracotta-600"
                  onChange={handleImageFileChange}
                />
                <input
                  className={`input-field ${formErrors.imageUrl ? "border-red-400" : ""}`}
                  placeholder="Hoặc dán URL ảnh"
                  value={
                    form.imageUrl.startsWith("data:image/") ? "" : form.imageUrl
                  }
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                />
                {formErrors.imageUrl && (
                  <p className="text-red-500 text-xs -mt-1">
                    {formErrors.imageUrl}
                  </p>
                )}
                {form.imageUrl && (
                  <div className="flex items-start gap-3 rounded-lg border border-cream-200 bg-cream-50 p-3">
                    <img
                      src={form.imageUrl}
                      alt="Xem trước ảnh món"
                      className="h-16 w-16 rounded-md object-cover"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src =
                          "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-espresso">
                        Ảnh xem trước
                      </p>
                      <p className="text-xs text-espresso-400 break-all">
                        {form.imageUrl.startsWith("data:image/")
                          ? "Ảnh đã được tải lên từ máy và lưu tạm dưới dạng dữ liệu ảnh"
                          : form.imageUrl}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-espresso-400">
                  Chấp nhận jpg, png, webp. Kích thước tối đa 5MB.
                </p>
              </div>
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="available">Đang bán</option>
                <option value="unavailable">Ngừng bán</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Nguyên liệu</label>
            <div className="grid gap-2 max-h-52 overflow-y-auto p-3 bg-cream-50 rounded-lg border border-cream-200">
              {ingredients.map((ing) => {
                const selected = isIngredientSelected(ing.id);
                const quantity = getIngredientQuantity(ing.id);

                return (
                  <div
                    key={ing.id}
                    className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-md border border-cream-200 bg-white px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-sm text-espresso cursor-pointer hover:text-terracotta min-w-0">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleIngredient(ing.id)}
                        className="accent-terracotta"
                      />
                      <span className="truncate">{ing.name}</span>
                    </label>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        disabled={!selected}
                        value={quantity}
                        onChange={(e) =>
                          updateIngredientQuantity(ing.id, e.target.value)
                        }
                        className="input-field py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Số lượng"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {formErrors.recipe && (
              <p className="text-red-500 text-xs mt-1">{formErrors.recipe}</p>
            )}
          </div>
          <div className="sticky bottom-[-1.25rem] -mx-6 px-6 py-3 bg-white border-t border-cream-200 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || hasNoCategories}
              className="btn-primary"
            >
              {saving
                ? "Đang lưu..."
                : hasNoCategories
                  ? "Cần tạo danh mục trước"
                  : editing
                    ? "Cập nhật"
                    : "Tạo mới"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa món"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.name}" khỏi menu?`}
        loading={saving}
      />
    </div>
  );
}
