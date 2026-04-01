import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import { productsApi }   from '../api/products.api';
import { ordersApi }     from '../api/orders.api';
import { restockApi }    from '../api/restock.api';
import { dashboardApi }  from '../api/dashboard.api';
import { logsApi }       from '../api/logs.api';


// --- Categories ---
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoriesApi.list().then((r) => r.data.data),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => categoriesApi.create(data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoriesApi.remove(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// --- Products ---
export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn:  () => productsApi.list(params).then((r) => r.data),
  });

export const useProduct = (id) =>
  useQuery({
    queryKey: ['products', id],
    queryFn:  () => productsApi.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.create(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useQuickRestock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, add_quantity }) => productsApi.quickRestock(id, { add_quantity }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

// --- Orders ---
export const useOrders = (params = {}) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn:  () => ordersApi.list(params).then((r) => r.data),
  });

export const useOrder = (id) =>
  useQuery({
    queryKey: ['orders', id],
    queryFn:  () => ordersApi.get(id).then((r) => r.data.data),
    enabled:  !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['restock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

// --- Restock Queue ---
export const useRestockQueue = () =>
  useQuery({
    queryKey:       ['restock'],
    queryFn:        () => restockApi.list().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

export const useResolveRestock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, add_quantity }) => restockApi.resolve(id, { add_quantity }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['restock'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useDismissRestock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => restockApi.dismiss(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['restock'] }),
  });
};

// --- Dashboard ---
export const useDashboard = () =>
  useQuery({
    queryKey:       ['dashboard'],
    queryFn:        () => dashboardApi.summary().then((r) => r.data.data),
    refetchInterval: 30_000,
    staleTime:       20_000,
  });

// --- Activity Logs ---
export const useLogs = (params = { limit: 10 }) =>
  useQuery({
    queryKey:       ['logs', params],
    queryFn:        () => logsApi.list(params).then((r) => r.data.data),
    refetchInterval: 15_000,
  });


