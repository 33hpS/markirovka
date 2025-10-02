import * as React from 'react';

const Login: React.FC = () => (
  <div className='min-h-screen flex items-center justify-center bg-gray-50'>
    <div className='w-full max-w-sm bg-white border rounded-lg p-6 shadow-sm'>
      <h1 className='text-xl font-semibold mb-4 text-gray-900'>Вход (WIP)</h1>
      <p className='text-sm text-gray-600 mb-6'>
        Форма авторизации появится позже (JWT + refresh).
      </p>
      <form className='space-y-4 opacity-50 pointer-events-none'>
        <div>
          <label
            htmlFor='login-email'
            className='block text-xs font-medium text-gray-700 mb-1'
          >
            Email
          </label>
          <input
            id='login-email'
            className='w-full border rounded px-3 py-2 text-sm'
            placeholder='user@example.com'
          />
        </div>
        <div>
          <label
            htmlFor='login-password'
            className='block text-xs font-medium text-gray-700 mb-1'
          >
            Пароль
          </label>
          <input
            id='login-password'
            type='password'
            className='w-full border rounded px-3 py-2 text-sm'
            placeholder='••••••••'
          />
        </div>
        <button
          type='button'
          className='w-full py-2 rounded bg-indigo-600 text-white text-sm font-medium'
        >
          Войти
        </button>
      </form>
    </div>
  </div>
);

export default Login;
