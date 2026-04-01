import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRestockQueue } from '../hooks/index';

// Navigation Sidebar
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '📊' },
  { id: 'orders',     label: 'Orders',       icon: '🛒' },
  { id: 'products',   label: 'Products',     icon: '📦' },
  { id: 'categories', label: 'Categories',   icon: '🏷️' },
  { id: 'restock',    label: 'Restock Queue',icon: '⚠️' },
  { id: 'users',      label: 'Team Access',  icon: '👥', adminOnly: true },
];

function Sidebar({ currentPage, onNavigate, collapsed, onToggle }) {
  const { user, logout, isAdmin }       = useAuth();
  const { data: restockItems }          = useRestockQueue();
  const urgentCount = restockItems?.filter((i) => i.priority === 'high').length || 0;

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <span className="text-base font-bold text-indigo-600 truncate">SmartInventory</span>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 shrink-0"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
          const isActive = currentPage === item.id;
          const badge = item.id === 'restock' && urgentCount > 0 ? urgentCount : null;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out →
          </button>
        </div>
      )}
    </aside>
  );
}

// Header Topbar
function TopBar({ currentPage, onNavigate }) {
  const { user } = useAuth();
  const PAGE_TITLES = {
    dashboard:  'Dashboard',
    orders:     'Orders',
    products:   'Products',
    categories: 'Categories',
    restock:    'Restock Queue',
    users:      'User Management',
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-gray-900">
        {PAGE_TITLES[currentPage] || 'Dashboard'}
      </h1>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
          ${user?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
          {user?.role}
        </span>
        <span className="text-sm text-gray-600">{user?.name}</span>
      </div>
    </header>
  );
}

// Main App Layout
export default function Layout({ children, currentPage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar currentPage={currentPage} onNavigate={onNavigate} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
