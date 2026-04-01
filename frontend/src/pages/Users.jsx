import { useState } from 'react';
import { useUsers, useUpdateUserRole } from '../hooks/index';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge, Alert, EmptyState } from '../components/ui';
import { formatDate } from '../utils/index';

export default function Users() {
  const { isAdmin, user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const updateRoleMutation = useUpdateUserRole();

  const [apiErr, setApiErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAdmin) {
    return (
      <div className="p-6">
        <EmptyState 
          icon="🔒" 
          title="Access Denied" 
          description="You do not have permission to view the user management page." 
        />
      </div>
    );
  }

  const handleRoleChange = async (id, newRole) => {
    setApiErr('');
    setSuccessMsg('');
    try {
      await updateRoleMutation.mutateAsync({ id, role: newRole });
      setSuccessMsg('Role updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setApiErr(err.response?.data?.error || 'Failed to update role.');
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage system access and roles</p>
        </div>
      </div>

      {apiErr && <Alert type="error" message={apiErr} onClose={() => setApiErr('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="⚠" title="Error loading users" description="Please try again later." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-th text-left">Name</th>
                  <th className="table-th text-left">Email</th>
                  <th className="table-th text-left">Joined</th>
                  <th className="table-th text-left">Current Role</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users?.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-td font-medium text-gray-900 flex items-center gap-2">
                        {u.name} {isSelf && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 rounded-full">You</span>}
                      </td>
                      <td className="table-td text-gray-500">{u.email}</td>
                      <td className="table-td text-gray-400">{formatDate(u.created_at)}</td>
                      <td className="table-td">
                        <Badge 
                          label={u.role === 'admin' ? 'Admin' : 'Manager'} 
                          colorClass={u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} 
                        />
                      </td>
                      <td className="table-td text-right">
                        <select
                          className="input w-32 py-1.5 text-xs inline-block"
                          value={u.role}
                          disabled={isSelf || updateRoleMutation.isPending}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
