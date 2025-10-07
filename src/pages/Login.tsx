import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if loading auth state
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600' />
      </div>
    );
  }
  // Redirect authenticated users away from login
  if (isAuthenticated) {
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ??
      '/home';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ??
        '/home';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <div className='w-full max-w-md'>
        <div className='bg-white border rounded-lg p-8 shadow-lg'>
          <div className='text-center mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Вход в систему
            </h1>
            <p className='text-sm text-gray-600'>Введите свои учётные данные</p>
          </div>

          {error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm font-medium text-red-800'>Ошибка входа</p>
              <p className='text-sm text-red-700 mt-1'>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label
                htmlFor='login-email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email
              </label>
              <input
                id='login-email'
                type='email'
                autoComplete='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50'
                placeholder='admin@markirovka.ru'
                required
              />
            </div>

            <div>
              <label
                htmlFor='login-password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Пароль
              </label>
              <input
                id='login-password'
                type='password'
                autoComplete='current-password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isSubmitting}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50'
                placeholder='••••••••'
                required
              />
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm disabled:bg-indigo-400'
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className='mt-6 pt-6 border-t border-gray-200'>
            <p className='text-xs text-center text-gray-600 mb-3'>
              Тестовые данные:
            </p>
            <div className='space-y-1 text-xs'>
              <div className='p-2 bg-gray-50 rounded text-center'>
                <code className='font-mono'>
                  admin@markirovka.ru / admin123
                </code>
              </div>
              <div className='p-2 bg-gray-50 rounded text-center'>
                <code className='font-mono'>
                  manager@markirovka.ru / manager123
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
