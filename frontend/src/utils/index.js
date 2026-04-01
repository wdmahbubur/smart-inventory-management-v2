// Formatter utilities
export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-US').format(val ?? 0);

// Log configuration mappings
export const LOG_CONFIG = {
  ORDER_CREATED:        { icon: '🛒', color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Order Created' },
  ORDER_STATUS_UPDATED: { icon: '🔄', color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Order Updated' },
  PRODUCT_CREATED:      { icon: '📦', color: 'text-green-600',   bg: 'bg-green-50',   label: 'Product Added' },
  PRODUCT_UPDATED:      { icon: '✏️',  color: 'text-yellow-600', bg: 'bg-yellow-50',  label: 'Product Updated' },
  PRODUCT_DELETED:      { icon: '🗑️',  color: 'text-red-500',    bg: 'bg-red-50',     label: 'Product Deleted' },
  STOCK_UPDATED:        { icon: '📊', color: 'text-teal-600',    bg: 'bg-teal-50',    label: 'Stock Updated' },
  STOCK_RESTORED:       { icon: '↩️',  color: 'text-teal-500',   bg: 'bg-teal-50',    label: 'Stock Restored' },
  RESTOCK_QUEUED:       { icon: '⚠️',  color: 'text-orange-500', bg: 'bg-orange-50',  label: 'Restock Queued' },
  RESTOCK_RESOLVED:     { icon: '✅', color: 'text-green-600',   bg: 'bg-green-50',   label: 'Restocked' },
  RESTOCK_DISMISSED:    { icon: '❌', color: 'text-gray-500',    bg: 'bg-gray-50',    label: 'Dismissed' },
  CATEGORY_CREATED:     { icon: '🏷️',  color: 'text-purple-600', bg: 'bg-purple-50',  label: 'Category Created' },
  CATEGORY_DELETED:     { icon: '🗑️',  color: 'text-red-500',    bg: 'bg-red-50',     label: 'Category Deleted' },
  USER_REGISTERED:      { icon: '👤', color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'User Registered' },
};

export const getLogConfig = (actionType) =>
  LOG_CONFIG[actionType] || { icon: '📝', color: 'text-gray-500', bg: 'bg-gray-50', label: actionType };

// Status and priority configuration objects
export const ORDER_STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100   text-blue-800'   },
  shipped:   { label: 'Shipped',   color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100  text-green-800'  },
  cancelled: { label: 'Cancelled', color: 'bg-red-100    text-red-700'    },
};

export const PRODUCT_STATUS_CONFIG = {
  active:       { label: 'Active',       color: 'bg-green-100 text-green-700' },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-100   text-red-700'   },
};

export const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'bg-red-100    text-red-700'    },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Low',    color: 'bg-blue-100   text-blue-700'   },
};

// Valid status transitions for order update UI
export const ORDER_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipped',   'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};
