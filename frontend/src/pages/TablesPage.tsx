import { useEffect, useState, FormEvent } from "react";
import { Plus, Pencil, Trash2, Grid3x3, Users, QrCode } from "lucide-react";
import Modal, { ConfirmModal } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { AvailabilityBadge } from "../components/Badge";
import { useToast } from "../context/ToastContext";
import { tablesApi } from "../services/api";

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: string;
  qr_code: string;
}

interface FormState {
  number: string;
  capacity: string;
  status: string;
}

export default function TablesPage() {
  const { showToast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState<Table | null>(null);
  const [editing, setEditing] = useState<Table | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [form, setForm] = useState<FormState>({
    number: "",
    capacity: "4",
    status: "available",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await tablesApi.list();
      setTables(data as Table[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ number: "", capacity: "4", status: "available" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (table: Table) => {
    setEditing(table);
    setForm({
      number: String(table.number),
      capacity: String(table.capacity),
      status: table.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const num = parseInt(form.number);
    const cap = parseInt(form.capacity);
    if (isNaN(num) || num < 1) e.number = "Vui lòng nhập số bàn hợp lệ";
    else if (!editing && tables.find((t) => t.number === num))
      e.number = "Số bàn đã tồn tại";
    if (isNaN(cap) || cap < 1) e.capacity = "Vui lòng nhập sức chứa hợp lệ";
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
        await tablesApi.update(editing.id, {
          number: parseInt(form.number),
          capacity: parseInt(form.capacity),
          status: form.status,
        });
        showToast("Cập nhật bàn thành công", "success");
      } else {
        await tablesApi.create({
          number: parseInt(form.number),
          capacity: parseInt(form.capacity),
        });
        showToast("Thêm bàn thành công", "success");
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
      await tablesApi.delete(deleteTarget.id);
      showToast("Xóa bàn thành công", "success");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const available = tables.filter((t) => t.status === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Bàn</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 font-medium">
              {available} bàn trống
            </span>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
              {occupied} đang phục vụ
            </span>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Thêm bàn
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-skeleton space-y-3">
              <div className="h-12 bg-cream-200 rounded-lg" />
              <div className="h-4 bg-cream-200 rounded w-2/3 mx-auto" />
              <div className="h-6 bg-cream-200 rounded" />
            </div>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Grid3x3 size={28} />}
            title="Chưa có bàn"
            description="Hãy thêm bàn đầu tiên để bắt đầu nhận đơn"
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus size={14} />
                Thêm bàn
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`card p-5 transition-all hover:shadow-md ${
                table.status === "occupied"
                  ? "ring-2 ring-amber-300 bg-amber-50/30"
                  : "hover:ring-2 hover:ring-terracotta/20"
              }`}
            >
              <div className="text-center mb-3">
                <div
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2 ${
                    table.status === "occupied"
                      ? "bg-amber-100"
                      : "bg-terracotta/10"
                  }`}
                >
                  <span
                    className={`font-serif text-2xl font-bold ${
                      table.status === "occupied"
                        ? "text-amber-700"
                        : "text-terracotta"
                    }`}
                  >
                    {table.number}
                  </span>
                </div>
                <AvailabilityBadge status={table.status} />
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-espresso-400 mb-3">
                <Users size={12} />
                <span>{table.capacity} chỗ</span>
              </div>
              <div className="flex gap-1 justify-center">
                {table.qr_code && (
                  <button
                    onClick={() => setQrModal(table)}
                    className="flex-1 btn-ghost py-1 text-xs justify-center"
                    title="Xem mã QR"
                  >
                    <QrCode size={13} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(table)}
                  className="flex-1 btn-ghost py-1 text-xs justify-center"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(table)}
                  className="flex-1 btn-danger py-1 text-xs justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa bàn" : "Thêm bàn"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Số bàn *</label>
              <input
                type="number"
                min="1"
                className={`input-field ${formErrors.number ? "border-red-400" : ""}`}
                placeholder="Ví dụ: 1"
                value={form.number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, number: e.target.value }))
                }
              />
              {formErrors.number && (
                <p className="text-red-500 text-xs mt-1">{formErrors.number}</p>
              )}
            </div>
            <div>
              <label className="label">Sức chứa *</label>
              <input
                type="number"
                min="1"
                className={`input-field ${formErrors.capacity ? "border-red-400" : ""}`}
                placeholder="Ví dụ: 4"
                value={form.capacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity: e.target.value }))
                }
              />
              {formErrors.capacity && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.capacity}
                </p>
              )}
            </div>
          </div>
          {editing && (
            <div>
              <label className="label">Trạng thái</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="available">Bàn trống</option>
                <option value="occupied">Đang phục vụ</option>
              </select>
            </div>
          )}
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

      <Modal
        open={!!qrModal}
        onClose={() => setQrModal(null)}
        title={`Mã QR — Bàn ${qrModal?.number}`}
        size="sm"
      >
        {qrModal && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 bg-white rounded-xl border-2 border-cream-200 shadow-inner">
              <img
                src={qrModal.qr_code}
                alt={`QR Table ${qrModal.number}`}
                className="w-40 h-40"
              />
            </div>
            <p className="text-sm text-espresso-500">
              Quét để xem menu của Bàn {qrModal.number}
            </p>
            <a
              href={qrModal.qr_code}
              download={`table-${qrModal.number}-qr.png`}
              className="btn-secondary text-xs"
            >
              Tải mã QR
            </a>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bàn"
        message={`Bạn có chắc muốn xóa Bàn ${deleteTarget?.number}? Hành động này không thể hoàn tác.`}
        loading={saving}
      />
    </div>
  );
}
