import { useEffect, useState, FormEvent } from "react";
import { Plus, Pencil, Trash2, FolderOpen, Search } from "lucide-react";
import Modal, { ConfirmModal } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonTable } from "../components/SkeletonLoader";
import { useToast } from "../context/ToastContext";
import { categoriesApi } from "../services/api";

interface Category {
  id: number;
  name: string;
  description: string;
}

interface FormState {
  name: string;
  description: string;
}

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      setItems(data as Category[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên danh mục là bắt buộc";
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
      if (editing) {
        await categoriesApi.update(editing.id, form);
        showToast("Cập nhật danh mục thành công", "success");
      } else {
        await categoriesApi.create(form);
        showToast("Tạo danh mục thành công", "success");
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
      await categoriesApi.delete(deleteTarget.id);
      showToast("Xóa danh mục thành công", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Danh mục</h1>
          <p className="text-sm text-espresso-400">
            Tổng {items.length} danh mục
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Thêm danh mục
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
              placeholder="Tìm danh mục..."
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
                  Mô tả
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={4} cols={4} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<FolderOpen size={28} />}
                      title="Chưa có danh mục"
                      description="Hãy tạo danh mục đầu tiên cho menu"
                      action={
                        <button onClick={openAdd} className="btn-primary">
                          <Plus size={14} />
                          Thêm danh mục
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr
                    key={cat.id}
                    className="table-row-stripe border-b border-cream-100"
                  >
                    <td className="px-4 py-3 text-espresso-400 font-mono text-xs">
                      #{cat.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-espresso">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-espresso-500 max-w-xs truncate">
                      {cat.description || "Chưa có mô tả"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="btn-ghost py-1 px-2"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="btn-danger py-1 px-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tên danh mục *</label>
            <input
              className={`input-field ${formErrors.name ? "border-red-400" : ""}`}
              placeholder="Ví dụ: Cà phê nóng"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Mô tả ngắn..."
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
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        loading={saving}
      />
    </div>
  );
}
