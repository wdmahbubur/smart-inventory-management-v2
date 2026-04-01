import api from './axios';

export const ordersApi = {
  list:         (params)       => api.get('/orders', { params }),
  get:          (id)           => api.get(`/orders/${id}`),
  create:       (data)         => api.post('/orders', data),
  updateStatus: (id, status)   => api.patch(`/orders/${id}/status`, { status }),
};
