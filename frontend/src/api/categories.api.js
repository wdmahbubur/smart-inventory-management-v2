import api from './axios';

export const categoriesApi = {
  list:   ()      => api.get('/categories'),
  get:    (id)    => api.get(`/categories/${id}`),
  create: (data)  => api.post('/categories', data),
  remove: (id)    => api.delete(`/categories/${id}`),
};
