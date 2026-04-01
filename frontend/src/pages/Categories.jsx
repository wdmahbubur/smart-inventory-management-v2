import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from '../hooks/index';
import {
  Modal, ConfirmDialog, EmptyState,
  Alert, Spinner, FormField,
} from '../components/ui';
import { formatDate } from '../utils/index';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { isAdmin } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [showAdd,  setShowAdd]  = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [name,     setName]     = useState('');
  const [formErr,  setFormErr]  = useState('');
  const [apiErr,   setApiErr]   = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (name.trim().length < 2) { setFormErr('Name must be at least 2 characters.'); return; }
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      setName('');
      setShowAdd(false);
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Failed to create category.');
    }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      await deleteMutation.mutateAsync(delTarget.id);
      setDelTarget(null);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to delete category.');
      setDelTarget(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories?.length || 0} categories</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <span>+</span> Add Category
        </button>
      </div>

      {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr('')} />}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : !categories?.length ? (
          <EmptyState
            icon="🏷️"
            title="No categories yet"
            description="Create your first category to organise products."
            action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add Category</button>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Products</th>
                <th className="table-th">Created</th>
                <th className="table-th">Created By</th>
                {isAdmin && <th className="table-th text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium text-gray-900">{cat.name}</td>
                  <td className="table-td">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {cat.product_count} products
                    </span>
                  </td>
                  <td className="table-td text-gray-400">{formatDate(cat.created_at)}</td>
                  <td className="table-td text-gray-500">{cat.created_by_name || '—'}</td>
                  {isAdmin && (
                    <td className="table-td text-right">
                      <button
                        onClick={() => setDelTarget(cat)}
                        disabled={parseInt(cat.product_count) > 0}
                        title={parseInt(cat.product_count) > 0 ? 'Cannot delete — has products' : 'Delete'}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setName(''); setFormErr(''); }} title="Add Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Category Name" required error={formErr}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electronics, Grocery…"
              className="input"
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
              {createMutation.isPending && <Spinner size="sm" />}
              Create Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Category"
        message={`Are you sure you want to delete "${delTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
