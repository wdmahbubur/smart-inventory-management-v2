import { useState } from 'react';
import {
  useRestockQueue,
  useResolveRestock,
  useDismissRestock,
} from '../hooks/index';
import {
  EmptyState, Alert, Spinner, Badge, ConfirmDialog, Modal, FormField,
} from '../components/ui';
import { formatCurrency, PRIORITY_CONFIG } from '../utils/index';


// Restock Modal
const RestockModal = ({ item, onSave, onClose, loading }) => {
  const [qty, setQty] = useState('');
  const [err, setErr] = useState('');

  const handle = (e) => {
    e.preventDefault();
    const n = parseInt(qty);
    if (!n || n < 1) { setErr('Enter a valid quantity (min 1).'); return; }
    onSave(n);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 space-y-1">
        <p className="font-semibold text-gray-900">{item.product_name}</p>
        <p className="text-sm text-gray-500">{item.category_name || 'Uncategorized'}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm">
          <span className="text-gray-500">Current: <strong className="text-red-600">{item.current_stock}</strong></span>
          <span className="text-gray-500">Threshold: <strong>{item.min_threshold}</strong></span>
          <span className="text-gray-500">Price: <strong>{formatCurrency(item.price)}</strong></span>
        </div>
      </div>


      <form onSubmit={handle} className="space-y-3">
        <FormField label="Units to Add" required error={err}>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => { setQty(e.target.value); setErr(''); }}
            placeholder="e.g. 50"
            className="input"
            autoFocus
          />
        </FormField>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Spinner size="sm" />} Restock
          </button>
        </div>
      </form>
    </div>
  );
}

// Restock Queue Page
export default function RestockQueue() {
  const { data: items, isLoading } = useRestockQueue();
  const resolveMutation            = useResolveRestock();
  const dismissMutation            = useDismissRestock();

  const [restockTarget, setRestockTarget] = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);
  const [apiErr,        setApiErr]        = useState('');

  const handleResolve = async (qty) => {
    try {
      await resolveMutation.mutateAsync({ id: restockTarget.id, add_quantity: qty });
      setRestockTarget(null);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to restock.');
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissMutation.mutateAsync(dismissTarget.id);
      setDismissTarget(null);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to dismiss.');
      setDismissTarget(null);
    }
  };

  // Group by priority for summary
  const highCount   = items?.filter((i) => i.priority === 'high').length   || 0;
  const mediumCount = items?.filter((i) => i.priority === 'medium').length || 0;
  const lowCount    = items?.filter((i) => i.priority === 'low').length    || 0;

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">Restock Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items?.length || 0} items need attention</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {highCount > 0 && (
            <span className="bg-red-100 text-red-700 font-medium px-2.5 py-1 rounded-full">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 font-medium px-2.5 py-1 rounded-full">
              {mediumCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="bg-blue-100 text-blue-700 font-medium px-2.5 py-1 rounded-full">
              {lowCount} Low
            </span>
          )}
        </div>
      </div>

      {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr('')} />}

      {/* Queue Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : !items?.length ? (
          <EmptyState
            icon="✅"
            title="All stocked up!"
            description="No products are below their minimum threshold right now."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Product</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Threshold</th>
                  <th className="table-th">Stock %</th>
                  <th className="table-th">Price</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const pCfg   = PRIORITY_CONFIG[item.priority];
                  const pct    = parseInt(item.stock_pct) || 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td">
                        <Badge label={pCfg?.label || item.priority} colorClass={pCfg?.color || ''} />
                      </td>
                      <td className="table-td font-medium text-gray-900">
                        {item.product_name}
                        {item.product_status === 'out_of_stock' && (
                          <span className="ml-2 text-xs text-red-500 font-normal">Out of stock</span>
                        )}
                      </td>
                      <td className="table-td text-gray-500">{item.category_name || '—'}</td>
                      <td className="table-td">
                        <span className={`font-bold ${item.current_stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td className="table-td text-gray-500">{item.min_threshold}</td>
                      <td className="table-td w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct <= 30 ? 'bg-red-500' : pct <= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="table-td text-gray-600">{formatCurrency(item.price)}</td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRestockTarget(item)}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => setDismissTarget(item)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      <Modal
        open={!!restockTarget}
        onClose={() => setRestockTarget(null)}
        title={`Restock — ${restockTarget?.product_name}`}
        width="max-w-md"
      >
        {restockTarget && (
          <RestockModal
            item={restockTarget}
            onSave={handleResolve}
            onClose={() => setRestockTarget(null)}
            loading={resolveMutation.isPending}
          />
        )}
      </Modal>

      {/* Dismiss Confirm */}
      <ConfirmDialog
        open={!!dismissTarget}
        onClose={() => setDismissTarget(null)}
        onConfirm={handleDismiss}
        loading={dismissMutation.isPending}
        title="Dismiss from Queue"
        message={`Remove "${dismissTarget?.product_name}" from the restock queue without restocking? It will be re-added automatically if stock drops further.`}
        confirmLabel="Dismiss"
        danger={false}
      />
    </div>
  );
}
