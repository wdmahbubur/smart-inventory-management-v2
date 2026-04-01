import { useState, useEffect } from 'react';
import {
  useOrders, useProducts, useCreateOrder, useUpdateOrderStatus,
} from '../hooks/index';
import {
  Modal, ConfirmDialog, EmptyState, Alert,
  Spinner, Badge, Pagination, SearchInput, FormField,
} from '../components/ui';
import {
  formatCurrency, formatDateTime,
  ORDER_STATUS_CONFIG, ORDER_TRANSITIONS,
} from '../utils/index';

// Helper to render an order line item in the form
const LineItem = ({ item, products, onChange, onRemove, existingProductIds }) => {
  const available = products.filter(
    (p) => p.status === 'active' && (p.id === item.product_id || !existingProductIds.includes(p.id))
  );
  const selected = products.find((p) => p.id === item.product_id);

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      {/* Product select */}
      <div className="flex-1">
        <select
          value={item.product_id}
          onChange={(e) => onChange({ ...item, product_id: e.target.value })}
          className="input text-sm"
        >
          <option value="">Select product…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatCurrency(p.price)} (stock: {p.stock})
            </option>
          ))}
        </select>
        {item.product_id && selected && item.quantity > selected.stock && (
          <p className="text-xs text-red-500 mt-1">
            ⚠ Only {selected.stock} unit(s) available
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="w-24 shrink-0">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: parseInt(e.target.value) || 1 })}
          className="input text-sm text-center"
          placeholder="Qty"
        />
      </div>

      {/* Line total */}
      <div className="w-24 shrink-0 pt-2 text-sm font-medium text-gray-700 text-right">
        {selected ? formatCurrency(parseFloat(selected.price) * item.quantity) : '—'}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 mt-0.5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// Form to create a new order
const OrderForm = ({ onSave, onCancel, loading }) => {
  const { data } = useProducts({ limit: 200 });
  const products = data?.data || [];

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes]               = useState('');
  const [items, setItems]               = useState([{ id: 1, product_id: '', quantity: 1 }]);
  const [errors, setErrors]             = useState({});
  const [stockErrors, setStockErrors]   = useState([]);
  const nextId = () => Date.now();

  const existingProductIds = items.map((i) => i.product_id).filter(Boolean);

  const addItem = () =>
    setItems((prev) => [...prev, { id: nextId(), product_id: '', quantity: 1 }]);

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id, updated) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));

  const total = items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.product_id);
    return sum + (p ? parseFloat(p.price) * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setStockErrors([]);

    const errs = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required.';
    if (items.some((i) => !i.product_id)) errs.items = 'All items must have a product selected.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      customer_name: customerName.trim(),
      notes: notes.trim() || null,
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };

    try {
      await onSave(payload);
    } catch (err) {
      const { conflictType, details, error } = err.response?.data || {};
      if (conflictType === 'INSUFFICIENT_STOCK') setStockErrors(details || []);
      else if (conflictType === 'DUPLICATE_PRODUCT') setErrors({ items: error });
      else if (conflictType === 'INACTIVE_PRODUCT') setErrors({ items: error });
      else setErrors({ items: error || 'Failed to create order.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Customer Name" required error={errors.customerName}>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer full name"
          className="input"
          autoFocus
        />
      </FormField>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Order Items <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-400 w-64">
            <span className="col-span-1 text-right">Qty</span>
            <span className="col-span-1 text-right">Total</span>
            <span />
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <LineItem
              key={item.id}
              item={item}
              products={products}
              existingProductIds={existingProductIds.filter((id) => id !== item.product_id)}
              onChange={(updated) => updateItem(item.id, updated)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}

        {stockErrors.length > 0 && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-red-700">Stock Issues:</p>
            {stockErrors.map((e, i) => (
              <p key={i} className="text-xs text-red-600">{e.message}</p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          + Add Item
        </button>
      </div>

      <FormField label="Notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Special instructions…"
          className="input resize-none"
        />
      </FormField>

      {/* Total */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600">Order Total</span>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Spinner size="sm" />} Place Order
        </button>
      </div>
    </form>
  );
}

// Order detail view and status update modal content
const OrderDetail = ({ order, onClose, onStatusUpdate }) => {
  const updateMutation = useUpdateOrderStatus();
  const transitions    = ORDER_TRANSITIONS[order.status] || [];
  const [err, setErr]  = useState('');

  const handleStatus = async (newStatus) => {
    setErr('');
    try {
      await updateMutation.mutateAsync({ id: order.id, status: newStatus });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update status.');
    }
  };

  const cfg = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="space-y-5">
      {err && <Alert type="error" message={err} onClose={() => setErr('')} />}

      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-sm font-bold text-indigo-600">{order.order_number}</p>
          <p className="text-base font-semibold text-gray-900 mt-0.5">{order.customer_name}</p>
          <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
        </div>
        <Badge label={cfg?.label || order.status} colorClass={cfg?.color || ''} />
      </div>

      {/* Items table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th text-center">Qty</th>
              <th className="table-th text-right">Unit Price</th>
              <th className="table-th text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items?.map((item, i) => (
              <tr key={i}>
                <td className="table-td font-medium">{item.product_name}</td>
                <td className="table-td text-center">{item.quantity}</td>
                <td className="table-td text-right">{formatCurrency(item.price_at_order)}</td>
                <td className="table-td text-right font-medium">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={3} className="table-td text-right font-semibold text-gray-700">Total</td>
              <td className="table-td text-right font-bold text-gray-900 text-base">
                {formatCurrency(order.total_price)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.notes && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => {
              const tCfg = ORDER_STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  disabled={updateMutation.isPending}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                    ${s === 'cancelled'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}
                    disabled:opacity-50`}
                >
                  {updateMutation.isPending ? <Spinner size="sm" /> : `Mark as ${tCfg?.label || s}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Orders list page
export default function Orders() {
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [viewOrder,    setViewOrder]    = useState(null);
  const [apiErr,       setApiErr]       = useState('');

  useEffect(() => setPage(1), [search, statusFilter, dateFrom, dateTo]);

  const params = {
    page, limit: 15,
    ...(search       && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(dateFrom     && { from: dateFrom }),
    ...(dateTo       && { to: dateTo }),
  };

  const { data, isLoading }  = useOrders(params);
  const createMutation       = useCreateOrder();

  const orders = data?.data || [];
  const meta   = data?.meta || {};

  const handleCreate = async (payload) => {
    await createMutation.mutateAsync(payload);
    setShowCreate(false);
  };

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta.total ?? 0} orders</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> New Order
        </button>
      </div>

      {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr('')} />}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by order # or customer…"
          className="flex-1 min-w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-44"
        >
          <option value="">All Statuses</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input w-36 text-sm"
          />
          <span className="text-xs text-gray-400 shrink-0">To</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="input w-36 text-sm"
          />
        </div>

        {(search || statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : !orders.length ? (
          <EmptyState icon="🛒" title="No orders found" description="Try adjusting your filters or create a new order." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-th">Order #</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Items</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Created By</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const cfg = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td">
                          <span className="font-mono text-xs font-semibold text-indigo-600">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="table-td font-medium text-gray-900">{order.customer_name}</td>
                        <td className="table-td text-gray-500">{order.items?.length ?? 0} items</td>
                        <td className="table-td font-semibold">{formatCurrency(order.total_price)}</td>
                        <td className="table-td">
                          <Badge label={cfg?.label || order.status} colorClass={cfg?.color || ''} />
                        </td>
                        <td className="table-td text-gray-400">{formatDateTime(order.created_at)}</td>
                        <td className="table-td text-gray-500">{order.created_by_name || '—'}</td>
                        <td className="table-td text-right">
                          <button
                            onClick={() => setViewOrder(order)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-gray-100">
              <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Order" width="max-w-2xl">
        <OrderForm
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* View / Update Modal */}
      <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.order_number || ''}`} width="max-w-xl">
        {viewOrder && (
          <OrderDetail
            order={viewOrder}
            onClose={() => setViewOrder(null)}
            onStatusUpdate={() => setViewOrder(null)}
          />
        )}
      </Modal>
    </div>
  );
}
