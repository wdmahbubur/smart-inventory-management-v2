import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, Spinner } from '../components/ui';

export default function Login() {
  const { login, signup, demoLogin, loading } = useAuth();
  const [mode,  setMode]  = useState('login');   // 'login' | 'signup'
  const [error, setError] = useState('');
  const [form,  setForm]  = useState({ name: '', email: '', password: '' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await signup(form.name, form.email, form.password);
    if (!result.success) setError(result.error);
  };

  const handleDemo = async () => {
    setError('');
    const result = await demoLogin();
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SmartInventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Demo login banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-6">
            <p className="text-xs text-indigo-700 text-center mb-2 font-medium">
              Try the demo — no setup required
            </p>
            <button
              onClick={handleDemo}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Spinner size="sm" /> : '⚡'}
              {loading ? 'Signing in…' : 'Demo Login (Admin)'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or continue with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  className="input"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Your password'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={mode === 'signup' ? 8 : 1}
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="text-indigo-600 font-semibold hover:underline"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Demo credentials: admin@demo.com / demo1234
        </p>
      </div>
    </div>
  );
}
