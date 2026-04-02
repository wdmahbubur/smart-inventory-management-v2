import { useState, useEffect } from 'react';
import {
  useProducts, useCategories, useCreateProduct,
  useUpdateProduct, useDeleteProduct,
} from '../hooks/index';
import {
  Modal, ConfirmDialog, EmptyState, Alert,
  Spinner, Badge, Pagination, SearchInput, FormField,
} from '../components/ui';
import { formatCurrency, formatDate, PRODUCT_STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/index';
import { useAuth } from '../context/AuthContext';

// Product Form component for create/edit
const ProductForm = ({ initial, onSave, onCancel, loading }) => {
  const { data: catData }    = useCategories();
  const categories           = catData || [];

  const [form, setForm] = useState({
    name:          initial?.name          || '',
    description:   initial?.description   || '',
    category_id:   initial?.category_id   || '',
    price:         initial?.price         || '',
    stock:         initial?.stock         ?? '',
    min_threshold: initial?.min_threshold ?? 5,
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name         = 'Name is required.';
    if (!form.category_id)       e.category_id  = 'Category is required.';
    if (form.price === '' || isNaN(form.price) || +form.price < 0) e.price = 'Valid price required.';
    if (form.stock === '' || isNaN(form.stock) || +form.stock < 0) e.stock = 'Valid stock required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name:          form.name.trim(),
      description:   form.description.trim() || null,
      category_id:   form.category_id,
      price:         parseFloat(form.price),
      stock:         parseInt(form.stock),
      min_threshold: parseInt(form.min_threshold) || 5,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Product Name" required error={errors.name}>
        <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. iPhone 13" className="input" autoFocus />
      </FormField>

      <FormField label="Category" required error={errors.category_id}>
        <select value={form.category_id} onChange={set('category_id')} className="input">
          <option value="">Select category…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Price ($)" required error={errors.price}>
          <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="0.00" className="input" />
        </FormField>
        <FormField label="Stock Quantity" required error={errors.stock}>
          <input type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" className="input" />
        </FormField>
      </div>

      <FormField label="Min Stock Threshold" hint="Alert when stock falls below this">
        <input type="number" min="0" value={form.min_threshold} onChange={set('min_threshold')} className="input" />
      </FormField>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={3}
          placeholder="Product description…"
          className="input resize-none"
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Spinner size="sm" />}
          {initial ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}

// Main Products management page
export default function Products() {
  const { isAdmin } = useAuth();

  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStock,   setLowStock]   = useState(false);

  const [showAdd,    setShowAdd]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);
  const [apiErr,     setApiErr]     = useState('');

  const params = {
    page, limit: 15,
    ...(search     && { search }),
    ...(catFilter  && { category: catFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(lowStock   && { low_stock: true }),
  };

  // Reset page on filter change
  useEffect(() => setPage(1), [search, catFilter, statusFilter, lowStock]);

  const { data, isLoading }    = useProducts(params);
  const { data: catData }      = useCategories();
  const createMutation         = useCreateProduct();
  const updateMutation         = useUpdateProduct();
  const deleteMutation         = useDeleteProduct();

  const products   = data?.data || [];
  const meta       = data?.meta || {};
  const categories = catData    || [];

  const handleCreate = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      setShowAdd(false);
    } catch (err) { setApiErr(err.response?.data?.error || 'Failed to create product.'); }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, data: formData });
      setEditTarget(null);
    } catch (err) { setApiErr(err.response?.data?.error || 'Failed to update product.'); }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(delTarget.id);
      setDelTarget(null);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to delete product.');
      setDelTarget(null);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-header">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta.total ?? 0} products</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <span>+</span> Add Product
        </button>
      </div>

      {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr('')} />}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products…"
          className="flex-1 min-w-48"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input w-44"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="rounded text-indigo-600"
          />
          Low Stock Only
        </label>
        {(search || catFilter || statusFilter || lowStock) && (
          <button
            onClick={() => { setSearch(''); setCatFilter(''); setStatusFilter(''); setLowStock(false); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : !products.length ? (
          <EmptyState icon="📦" title="No products found" description="Try adjusting your filters or add a new product." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th">Category</th>
                    <th className="table-th">Price</th>
                    <th className="table-th">Stock</th>
                    <th className="table-th">Threshold</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => {
                    const sCfg = PRODUCT_STATUS_CONFIG[p.status];
                    const pCfg = PRIORITY_CONFIG[p.restock_priority];
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-td">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">{p.description}</div>
                          )}
                        </td>
                        <td className="table-td text-gray-500">{p.category_name || '—'}</td>
                        <td className="table-td font-medium">{formatCurrency(p.price)}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${
                              p.stock === 0 ? 'text-red-600' :
                              p.is_low_stock ? 'text-orange-500' : 'text-gray-900'
                            }`}>
                              {p.stock}
                            </span>
                            {p.in_restock_queue && pCfg && (
                              <Badge label={pCfg.label} colorClass={pCfg.color} />
                            )}
                          </div>
                        </td>
                        <td className="table-td text-gray-400">{p.min_threshold}</td>
                        <td className="table-td">
                          <Badge label={sCfg?.label || p.status} colorClass={sCfg?.color || ''} />
                        </td>
                        <td className="table-td text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditTarget(p)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setDelTarget(p)}
                                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product" width="max-w-xl">
        <ProductForm
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Product" width="max-w-xl">
        {editTarget && (
          <ProductForm
            initial={editTarget}
            onSave={handleUpdate}
            onCancel={() => setEditTarget(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Product"
        message={`Delete "${delTarget?.name}"? This cannot be undone. Products with existing orders cannot be deleted.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
