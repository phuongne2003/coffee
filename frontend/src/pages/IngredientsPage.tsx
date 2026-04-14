import { useEffect, useState, FormEvent } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wheat,
  Search,
  AlertTriangle,
} from "lucide-react";
import Modal, { ConfirmModal } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { ingredientsApi } from "../services/api";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  alertThreshold: number;
  description?: string;
  isActive: boolean;
}

interface FormState {
  name: string;
  unit: string;
  currentStock: string;
  alertThreshold: string;
  description: string;
}

interface StockFormState {
  type: "in" | "out" | "adjustment";
  quantity: string;
  note: string;
}

export default function IngredientsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [stockTarget, setStockTarget] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    unit: "",
    currentStock: "0",
    alertThreshold: "0",
    description: "",
  });
  const [stockForm, setStockForm] = useState<StockFormState>({
    type: "adjustment",
    quantity: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ingredientsApi.list({ isActive: true });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      unit: "ml",
      currentStock: "0",
      alertThreshold: "0",
      description: "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditing(item);
    setForm({
      name: item.name,
      unit: item.unit,
      currentStock: String(item.currentStock),
      alertThreshold: String(item.alertThreshold),
      description: item.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openStock = (item: Ingredient) => {
    setStockTarget(item);
    setStockForm({ type: "adjustment", quantity: "", note: "" });
    setStockErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên nguyên liệu là bắt buộc";
    if (!form.unit.trim()) e.unit = "Đơn vị là bắt buộc";
    const qty = Number(form.currentStock);
    if (Number.isNaN(qty) || qty < 0)
      e.currentStock = "Vui lòng nhập tồn kho hợp lệ";
    const threshold = Number(form.alertThreshold);
    if (Number.isNaN(threshold) || threshold < 0)
      e.alertThreshold = "Vui lòng nhập ngưỡng cảnh báo hợp lệ";
    return e;
  };

  const validateStock = () => {
    const e: Record<string, string> = {};
    const quantity = Number(stockForm.quantity);
    if (Number.isNaN(quantity) || quantity <= 0)
      e.quantity = "Số lượng phải lớn hơn 0";
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
        unit: form.unit.trim(),
        currentStock: Number(form.currentStock),
        alertThreshold: Number(form.alertThreshold),
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await ingredientsApi.update(editing.id, payload);
        showToast("Cập nhật nguyên liệu thành công", "success");
      } else {
        await ingredientsApi.create(payload);
        showToast("Thêm nguyên liệu thành công", "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await ingredientsApi.delete(deleteTarget.id);
      showToast("Xóa nguyên liệu thành công", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stockTarget) return;
    const errs = validateStock();
    if (Object.keys(errs).length) {
      setStockErrors(errs);
      return;
    }

    setStockSaving(true);
    try {
      await ingredientsApi.updateStock(stockTarget.id, {
        type: stockForm.type,
        quantity: Number(stockForm.quantity),
        note: stockForm.note.trim() || undefined,
      });
      showToast("Cập nhật tồn kho thành công", "success");
      setStockTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setStockSaving(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.unit.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = items.filter(
    (i) => i.currentStock <= i.alertThreshold,
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Nguyên liệu</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-espresso-400">
              {items.length} nguyên liệu
            </p>
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle size={11} /> {lowStockCount} sắp hết
              </span>
            )}
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Thêm nguyên liệu
        </button>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-cream-200">
          <div className="relative max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300"
            />
            <input
              type="text"
              placeholder="Tìm nguyên liệu..."
              className="input-field pl-8 py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100 border-b border-cream-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Đơn vị
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Tồn kho
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Ngưỡng cảnh báo
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Wheat size={28} />}
                      title="Chưa có nguyên liệu"
                      description="Bắt đầu quản lý kho bằng cách thêm nguyên liệu"
                      action={
                        <button onClick={openAdd} className="btn-primary">
                          <Plus size={14} />
                          Thêm nguyên liệu
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.currentStock <= item.alertThreshold;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-cream-100 transition-colors ${
                        isLow
                          ? "bg-amber-50/50 hover:bg-amber-50"
                          : "table-row-stripe"
                      }`}
                    >
                      <td className="px-4 py-3 text-espresso-400 font-mono text-xs">
                        #{item.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-espresso flex items-center gap-2">
                        {item.name}
                        {isLow && (
                          <AlertTriangle size={13} className="text-amber-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-espresso-500">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${isLow ? "text-amber-600" : "text-espresso"}`}
                        >
                          {item.currentStock}
                        </span>
                        {isLow && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            Thấp
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-espresso-500">
                        {item.alertThreshold}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openStock(item)}
                            className="btn-ghost py-1 px-2"
                          >
                            <span className="text-xs font-semibold">Kho</span>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa nguyên liệu" : "Thêm nguyên liệu"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tên nguyên liệu *</label>
            <input
              className={`input-field ${formErrors.name ? "border-red-400" : ""}`}
              placeholder="Ví dụ: Hạt cà phê Espresso"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Đơn vị *</label>
              <select
                className={`input-field ${formErrors.unit ? "border-red-400" : ""}`}
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="bottle">bottle</option>
                <option value="pack">pack</option>
                <option value="unit">unit</option>
              </select>
              {formErrors.unit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>
              )}
            </div>
            <div>
              <label className="label">Tồn kho hiện tại *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input-field ${formErrors.currentStock ? "border-red-400" : ""}`}
                placeholder="0"
                value={form.currentStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentStock: e.target.value }))
                }
              />
              {formErrors.currentStock && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.currentStock}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="label">Ngưỡng cảnh báo *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`input-field ${formErrors.alertThreshold ? "border-red-400" : ""}`}
              placeholder="0"
              value={form.alertThreshold}
              onChange={(e) =>
                setForm((f) => ({ ...f, alertThreshold: e.target.value }))
              }
            />
            {formErrors.alertThreshold && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.alertThreshold}
              </p>
            )}
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea
              className="input-field min-h-[90px]"
              placeholder="Ghi chú (không bắt buộc)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa nguyên liệu"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        loading={saving}
      />

      <Modal
        open={!!stockTarget}
        onClose={() => setStockTarget(null)}
        title={
          stockTarget
            ? `Điều chỉnh kho - ${stockTarget.name}`
            : "Điều chỉnh kho"
        }
        size="sm"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div>
            <label className="label">Loại điều chỉnh</label>
            <select
              className="input-field"
              value={stockForm.type}
              onChange={(e) =>
                setStockForm((f) => ({
                  ...f,
                  type: e.target.value as StockFormState["type"],
                }))
              }
            >
              <option value="in">Nhập kho</option>
              <option value="out">Xuất kho</option>
              <option value="adjustment">Đặt lại tồn kho</option>
            </select>
          </div>
          <div>
            <label className="label">Số lượng *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`input-field ${stockErrors.quantity ? "border-red-400" : ""}`}
              placeholder="0"
              value={stockForm.quantity}
              onChange={(e) =>
                setStockForm((f) => ({ ...f, quantity: e.target.value }))
              }
            />
            {stockErrors.quantity && (
              <p className="text-red-500 text-xs mt-1">
                {stockErrors.quantity}
              </p>
            )}
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="input-field min-h-[90px]"
              placeholder="Ghi chú (không bắt buộc)"
              value={stockForm.note}
              onChange={(e) =>
                setStockForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setStockTarget(null)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={stockSaving}
              className="btn-primary"
            >
              {stockSaving ? "Đang lưu..." : "Cập nhật tồn kho"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
