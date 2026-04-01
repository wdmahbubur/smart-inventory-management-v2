import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'inv_token';
const USER_KEY  = 'inv_user';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Sync axios default header whenever user changes
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const storeAuth = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password });
      storeAuth(res.data.data.token, res.data.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  const signup = useCallback(async (name, email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.signup({ name, email, password });
      storeAuth(res.data.data.token, res.data.data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [storeAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError('');
  }, []);

  // Demo login — pre-filled admin credentials from seed data
  const demoLogin = useCallback(() => {
    return login('eve.holt@reqres.in', 'cityslicka');
  }, [login]);

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  return (
    <AuthContext.Provider value={{
      user, loading, error, setError,
      login, signup, logout, demoLogin,
      isAdmin, isManager,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
