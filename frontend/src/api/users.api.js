import api from './axios';

export const usersApi = {
  // Fetch all users
  getAll: () => api.get('/users'),

  // Update a user's role (admin/manager)
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};
