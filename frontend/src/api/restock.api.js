import api from './axios';

export const restockApi = {
  list:    ()              => api.get('/restock'),
  history: (params)        => api.get('/restock/history', { params }),
  resolve: (id, data)      => api.patch(`/restock/${id}/resolve`, data),
  dismiss: (id)            => api.delete(`/restock/${id}`),
};
