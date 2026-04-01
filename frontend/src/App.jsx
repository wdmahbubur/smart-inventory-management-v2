import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Layout     from './components/Layout';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Categories from './pages/Categories';
import Products   from './pages/Products';
import Orders     from './pages/Orders';
import RestockQueue from './pages/RestockQueue';
import Users      from './pages/Users';
import { Spinner } from './components/ui';

const PAGES = {
  dashboard:  Dashboard,
  orders:     Orders,
  products:   Products,
  categories: Categories,
  restock:    RestockQueue,
  users:      Users,
};

export default function App() {
  const { user } = useAuth();
  const [page, setPage] = useState('dashboard');

  // Not logged in → show Login screen
  if (!user) return <Login />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      <PageComponent onNavigate={setPage} />
    </Layout>
  );
}
