import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, Wheat, Search, AlertTriangle } from 'lucide-react';
import Modal, { ConfirmModal } from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { ingredientsApi } from '../services/api';

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock_quantity: number;
}

interface FormState {
  name: string;
  unit: string;
  stock_quantity: string;
}

const LOW_STOCK_THRESHOLD = 5;

export default function IngredientsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', unit: '', stock_quantity: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await ingredientsApi.list();
      setItems(data as Ingredient[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', unit: 'kg', stock_quantity: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditing(item);
    setForm({ name: item.name, unit: item.unit, stock_quantity: String(item.stock_quantity) });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.unit.trim()) e.unit = 'Unit is required';
    const qty = parseFloat(form.stock_quantity);
    if (isNaN(qty) || qty < 0) e.stock_quantity = 'Enter a valid quantity';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, unit: form.unit, stock_quantity: parseFloat(form.stock_quantity) };
      if (editing) {
        await ingredientsApi.update(editing.id, payload);
        showToast('Ingredient updated', 'success');
      } else {
        await ingredientsApi.create(payload);
        showToast('Ingredient added', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await ingredientsApi.delete(deleteTarget.id);
      showToast('Ingredient deleted', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.unit.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter(i => i.stock_quantity < LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Ingredients</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-espresso-400">{items.length} ingredients</p>
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle size={11} /> {lowStockCount} low stock
              </span>
            )}
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-cream-200">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300" />
            <input
              type="text"
              placeholder="Search ingredients..."
              className="input-field pl-8 py-1.5"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-100 border-b border-cream-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<Wheat size={28} />}
                      title="No ingredients yet"
                      description="Track your stock by adding ingredients"
                      action={<button onClick={openAdd} className="btn-primary"><Plus size={14} />Add Ingredient</button>}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const isLow = item.stock_quantity < LOW_STOCK_THRESHOLD;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-cream-100 transition-colors ${
                        isLow ? 'bg-amber-50/50 hover:bg-amber-50' : 'table-row-stripe'
                      }`}
                    >
                      <td className="px-4 py-3 text-espresso-400 font-mono text-xs">#{item.id}</td>
                      <td className="px-4 py-3 font-semibold text-espresso flex items-center gap-2">
                        {item.name}
                        {isLow && <AlertTriangle size={13} className="text-amber-500" />}
                      </td>
                      <td className="px-4 py-3 text-espresso-500">{item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${isLow ? 'text-amber-600' : 'text-espresso'}`}>
                          {item.stock_quantity}
                        </span>
                        {isLow && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(item)} className="btn-ghost py-1 px-2">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(item)} className="btn-danger py-1 px-2">
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
        title={editing ? 'Edit Ingredient' : 'Add Ingredient'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className={`input-field ${formErrors.name ? 'border-red-400' : ''}`}
              placeholder="e.g. Espresso Beans"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Unit *</label>
              <select
                className={`input-field ${formErrors.unit ? 'border-red-400' : ''}`}
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="bottle">bottle</option>
                <option value="pack">pack</option>
                <option value="unit">unit</option>
              </select>
              {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
            </div>
            <div>
              <label className="label">Stock Qty *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`input-field ${formErrors.stock_quantity ? 'border-red-400' : ''}`}
                placeholder="0"
                value={form.stock_quantity}
                onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
              />
              {formErrors.stock_quantity && <p className="text-red-500 text-xs mt-1">{formErrors.stock_quantity}</p>}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Ingredient"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={saving}
      />
    </div>
  );
}
