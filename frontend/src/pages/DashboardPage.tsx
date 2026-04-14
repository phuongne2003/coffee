import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Star, AlertTriangle, BarChart2 } from 'lucide-react';
import { reportsApi } from '../services/api';
import { SkeletonKPI } from '../components/SkeletonLoader';

const COLORS = ['#c4622d', '#d4a853', '#8b6340', '#5c3d20'];

interface Summary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  top_items: { name: string; count: number }[];
}
interface CategoryData { category: string; revenue: number; count: number }
interface TrendData { date: string; revenue: number; orders: number }
interface InventoryData { ingredient_id: number; name: string; stock: number; threshold: number; status: string }

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryData[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsApi.summary(),
      reportsApi.byCategory(),
      reportsApi.trend(),
      reportsApi.inventory(),
    ]).then(([s, c, t, i]) => {
      setSummary(s as Summary);
      setByCategory(c as CategoryData[]);
      setTrend(t as TrendData[]);
      setInventory(i as InventoryData[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const kpis = summary ? [
    {
      label: 'Total Revenue',
      value: `$${summary.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      sub: 'This period',
      color: 'text-terracotta',
      bg: 'bg-terracotta/10',
    },
    {
      label: 'Total Orders',
      value: summary.total_orders.toLocaleString(),
      icon: ShoppingBag,
      sub: 'All time',
      color: 'text-gold-600',
      bg: 'bg-gold/10',
    },
    {
      label: 'Avg Order Value',
      value: `$${summary.avg_order_value.toFixed(2)}`,
      icon: TrendingUp,
      sub: 'Per order',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Top Item',
      value: summary.top_items[0]?.name || '—',
      icon: Star,
      sub: `${summary.top_items[0]?.count || 0} orders`,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ] : [];

  const stockColor = (status: string) => {
    if (status === 'critical') return 'text-red-600 bg-red-50 border-red-200';
    if (status === 'low') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="text-sm text-espresso-400 mt-0.5">Overview of your café performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
          : kpis.map(({ label, value, icon: Icon, sub, color, bg }) => (
              <div key={label} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={20} className={color} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-espresso-400 uppercase tracking-wide">{label}</p>
                <p className="font-serif text-2xl font-bold text-espresso mt-1 leading-none">{value}</p>
                <p className="text-xs text-espresso-400 mt-1">{sub}</p>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-terracotta" />
            <h3 className="font-serif text-lg font-semibold text-espresso">Revenue Trend</h3>
            <span className="text-xs text-espresso-400 ml-auto">Last 7 days</span>
          </div>
          {loading ? (
            <div className="h-56 bg-cream-100 rounded-lg animate-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8d5b7" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8b6340' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8b6340' }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #ead9c4', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#c4622d" strokeWidth={2} dot={{ fill: '#c4622d', r: 3 }} name="Revenue ($)" />
                <Line type="monotone" dataKey="orders" stroke="#d4a853" strokeWidth={2} dot={{ fill: '#d4a853', r: 3 }} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-serif text-lg font-semibold text-espresso mb-4">Revenue by Category</h3>
          {loading ? (
            <div className="h-56 bg-cream-100 rounded-lg animate-skeleton" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {byCategory.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-espresso-500">{item.category}</span>
                    </div>
                    <span className="font-semibold text-espresso">${item.revenue}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-gold" />
            <h3 className="font-serif text-lg font-semibold text-espresso">Top Selling Items</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({length: 3}).map((_, i) => <div key={i} className="h-10 bg-cream-100 rounded-lg animate-skeleton" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.top_items.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-espresso">{item.name}</span>
                  <span className="text-xs font-semibold text-espresso-400">{item.count} orders</span>
                  <div className="w-20 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terracotta rounded-full"
                      style={{ width: `${(item.count / (summary?.top_items[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-serif text-lg font-semibold text-espresso">Inventory Alerts</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({length: 5}).map((_, i) => <div key={i} className="h-9 bg-cream-100 rounded-lg animate-skeleton" />)}
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {inventory.map(item => (
                <div
                  key={item.ingredient_id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${stockColor(item.status)}`}
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span>{item.stock} / {item.threshold} {item.status !== 'ok' && '⚠'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
