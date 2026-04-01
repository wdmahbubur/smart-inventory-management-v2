import api from './axios';

export const productsApi = {
  list:         (params)       => api.get('/products', { params }),
  get:          (id)           => api.get(`/products/${id}`),
  create:       (data)         => api.post('/products', data),
  update:       (id, data)     => api.put(`/products/${id}`, data),
  remove:       (id)           => api.delete(`/products/${id}`),
  quickRestock: (id, data)     => api.patch(`/products/${id}/restock`, data),
};
