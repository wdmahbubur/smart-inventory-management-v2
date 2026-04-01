import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useDashboard } from '../hooks/index';
import ActivityFeed from '../components/ActivityFeed';
import { StatCard, Badge, Spinner } from '../components/ui';
import {
  formatCurrency, formatDate,
  ORDER_STATUS_CONFIG, PRODUCT_STATUS_CONFIG,
} from '../utils/index';


// Revenue Chart
const RevenueChart = ({ data }) => {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
      No revenue data yet.
    </div>
  );

  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(v) => [formatCurrency(v), 'Revenue']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#6366f1" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Orders Chart
const OrdersChart = ({ data }) => {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
      No order data yet.
    </div>
  );

  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          formatter={(v) => [v, 'Orders']}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="order_count" fill="#10b981" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie-chart palette
const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

// Category Sales Pie Chart
const CategorySalesPieChart = ({ data }) => {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
      No sales data yet.
    </div>
  );

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  const enriched = data.map((d) => ({
    ...d,
    percent: totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : '0.0',
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = enriched[index]?.percent;
    if (parseFloat(pct) < 5) return null; // skip tiny slices
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={700}>
        {pct}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={enriched}
          dataKey="revenue"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          labelLine={false}
          label={renderCustomLabel}
        >
          {enriched.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(val, name) => [
            `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            name,
          ]}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend
          formatter={(value, entry) => (
            <span style={{ fontSize: 12, color: '#374151' }}>
              {value} ({enriched.find(d => d.category === value)?.percent}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Main Dashboard
export default function Dashboard({ onNavigate }) {
  const { data: summary, isLoading } = useDashboard();

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  if (!summary) return null;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Orders Today"
          value={summary.orders_today}
          icon="🛒"
          colorClass="bg-indigo-50 text-indigo-700"
          sub={`${summary.pending_orders} pending`}
        />        
        <StatCard
          label="Pending Orders"
          value={summary.pending_orders}
          icon="⏳"
          colorClass="bg-yellow-50 text-yellow-700"
        />
        <StatCard
          label="Completed Orders"
          value={summary.completed_orders}
          icon="✅"
          colorClass="bg-teal-50 text-teal-700"
          sub="Delivered"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(summary.revenue_today)}
          icon="💰"
          colorClass="bg-green-50 text-green-700"
          sub="Confirmed + shipped"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Products"
          value={summary.total_products}
          icon="📦"
          colorClass="bg-purple-50 text-purple-700"
          sub={`${summary.out_of_stock_products} out of stock`}
        />
        <StatCard
          label="Active Products"
          value={summary.active_products}
          icon="🟢"
          colorClass="bg-gray-50 text-gray-700"
        />
        <StatCard
          label="Low Stock"
          value={summary.low_stock_count}
          icon="⚠️"
          colorClass="bg-red-50 text-red-700"
          sub="Items need restocking"
        />
      </div>

      {/* Row 1: Revenue chart (2/3) + Category pie chart (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Revenue — Last 7 Days</h2>
          <RevenueChart data={summary.revenue_chart} />
        </div>
        <div className="card p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Sales by Category</h2>
          <div className="flex-1">
            <CategorySalesPieChart data={summary.category_sales} />
          </div>
        </div>
      </div>

      {/* Row 2: Orders chart (2/3) + Orders by Status (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Orders — Last 7 Days</h2>
          <OrdersChart data={summary.revenue_chart} />
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Orders by Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(summary.orders_by_status).map(([status, counts]) => {
              const cfg = ORDER_STATUS_CONFIG[status];
              return (
                <div
                  key={status}
                  onClick={() => onNavigate('orders')}
                  className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl font-bold text-gray-800">{counts.total}</span>
                  <Badge label={cfg?.label || status} colorClass={cfg?.color || 'bg-gray-100 text-gray-600'} />
                  <span className="text-xs text-indigo-500 mt-1">+{counts.today} today</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Low Stock table (2/3) + Activity Feed (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Low Stock Products</h2>
            <button
              onClick={() => onNavigate('restock')}
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              View Queue →
            </button>
          </div>
          {summary.low_stock_items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">✅ All products are well-stocked.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="table-th pl-0">Product</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Stock</th>
                    <th className="table-th">Threshold</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary.low_stock_items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-td pl-0 font-medium text-gray-900">{item.name}</td>
                      <td className="table-td text-gray-500">{item.category_name || '—'}</td>
                      <td className="table-td">
                        <span className={item.stock === 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-medium'}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="table-td text-gray-400">{item.min_threshold}</td>
                      <td className="table-td">
                        <Badge
                          label={item.stock_level.replace('_', ' ')}
                          colorClass={item.stock_level === 'Out of Stock' || item.stock_level === 'Low Stock'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
            <span className="text-xs text-gray-400">Live</span>
          </div>
          <ActivityFeed limit={8} />
        </div>
      </div>

      {/* Row 4: Recent Orders (full width) */}
      {summary.recent_orders?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
            <button onClick={() => onNavigate('orders')} className="text-xs text-indigo-600 font-medium hover:underline">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="table-th pl-0">Order #</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.recent_orders.map((o) => {
                  const cfg = ORDER_STATUS_CONFIG[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="table-td pl-0 font-mono text-xs font-medium text-indigo-600">{o.order_number}</td>
                      <td className="table-td font-medium text-gray-900">{o.customer_name}</td>
                      <td className="table-td text-gray-700">{formatCurrency(o.total_price)}</td>
                      <td className="table-td">
                        <Badge label={cfg?.label || o.status} colorClass={cfg?.color || ''} />
                      </td>
                      <td className="table-td text-gray-400">{formatDate(o.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
