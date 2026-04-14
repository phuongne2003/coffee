import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, Coffee, Search, LayoutGrid, List } from 'lucide-react';
import Modal, { ConfirmModal } from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonLoader';
import { AvailabilityBadge } from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { menuItemsApi, categoriesApi, ingredientsApi } from '../services/api';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category: string;
  image_url: string;
  status: string;
  ingredients: number[];
}

interface Category { id: number; name: string }
interface Ingredient { id: number; name: string }

interface FormState {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  status: string;
  ingredients: number[];
}

export default function MenuItemsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', description: '', price: '', category_id: '', image_url: '', status: 'available', ingredients: [] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [menuData, catData, ingData] = await Promise.all([
        menuItemsApi.list(),
        categoriesApi.list(),
        ingredientsApi.list(),
      ]);
      setItems(menuData as MenuItem[]);
      setCategories(catData as Category[]);
      setIngredients(ingData as Ingredient[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const emptyForm: FormState = { name: '', description: '', price: '', category_id: '', image_url: '', status: 'available', ingredients: [] };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category_id: String(item.category_id),
      image_url: item.image_url,
      status: item.status,
      ingredients: item.ingredients || [],
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) e.price = 'Enter a valid price';
    if (!form.category_id) e.category_id = 'Select a category';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category_id: parseInt(form.category_id),
        image_url: form.image_url,
        status: form.status,
        ingredients: form.ingredients,
      };
      if (editing) {
        await menuItemsApi.update(editing.id, payload);
        showToast('Menu item updated', 'success');
      } else {
        await menuItemsApi.create(payload);
        showToast('Menu item created', 'success');
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
      await menuItemsApi.delete(deleteTarget.id);
      showToast('Menu item deleted', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleIngredient = (id: number) => {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.includes(id)
        ? f.ingredients.filter(i => i !== id)
        : [...f.ingredients, id],
    }));
  };

  const filtered = items.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || String(m.category_id) === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Menu Items</h1>
          <p className="text-sm text-espresso-400">{items.length} items on menu</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-300" />
          <input
            type="text"
            placeholder="Search items..."
            className="input-field pl-8 py-1.5"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field py-1.5 w-auto"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <div className="flex gap-1 bg-cream-100 rounded-lg p-1 border border-cream-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-terracotta' : 'text-espresso-400'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-terracotta' : 'text-espresso-400'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Coffee size={28} />}
            title="No menu items"
            description="Add your first menu item to get started"
            action={<button onClick={openAdd} className="btn-primary"><Plus size={14} />Add Item</button>}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="card group hover:shadow-md transition-shadow">
              <div className="relative overflow-hidden h-44">
                <img
                  src={item.image_url || 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400'; }}
                />
                <div className="absolute top-2 right-2">
                  <AvailabilityBadge status={item.status} />
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-terracotta font-semibold mb-1">{item.category}</p>
                <h3 className="font-serif font-semibold text-espresso text-base leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-espresso-400 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-espresso text-lg">${item.price.toFixed(2)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="btn-ghost py-1 px-2">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="btn-danger py-1 px-2">
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-espresso-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-espresso-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="table-row-stripe border-b border-cream-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400'; }}
                      />
                      <div>
                        <p className="font-semibold text-espresso">{item.name}</p>
                        <p className="text-xs text-espresso-400 truncate max-w-[160px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-espresso-500">{item.category}</td>
                  <td className="px-4 py-3 font-bold text-espresso">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3"><AvailabilityBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="btn-ghost py-1 px-2"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="btn-danger py-1 px-2"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Menu Item' : 'Add Menu Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input className={`input-field ${formErrors.name ? 'border-red-400' : ''}`} placeholder="e.g. Signature Latte" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="label">Price ($) *</label>
              <input type="number" step="0.01" min="0" className={`input-field ${formErrors.price ? 'border-red-400' : ''}`} placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select className={`input-field ${formErrors.category_id ? 'border-red-400' : ''}`} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
              {formErrors.category_id && <p className="text-red-500 text-xs mt-1">{formErrors.category_id}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Image URL</label>
              <input className="input-field" placeholder="https://..." value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Ingredients</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 bg-cream-50 rounded-lg border border-cream-200">
              {ingredients.map(ing => (
                <label key={ing.id} className="flex items-center gap-2 text-sm text-espresso cursor-pointer hover:text-terracotta">
                  <input
                    type="checkbox"
                    checked={form.ingredients.includes(ing.id)}
                    onChange={() => toggleIngredient(ing.id)}
                    className="accent-terracotta"
                  />
                  {ing.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Menu Item"
        message={`Delete "${deleteTarget?.name}" from the menu?`}
        loading={saving}
      />
    </div>
  );
}
