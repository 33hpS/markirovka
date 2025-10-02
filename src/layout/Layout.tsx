import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import Badge from '../components/ui/Badge';
import { useBuildInfo } from '../hooks/useBuildInfo';

const nav = [
  { to: '/production', label: 'Производство', protected: true },
  { to: '/designer', label: 'Дизайнер' },
  { to: '/labels', label: 'Этикетки' },
  { to: '/printing', label: 'Печать' },
  { to: '/reports', label: 'Отчёты' },
  { to: '/users', label: 'Пользователи', protected: true },
  { to: '/docs', label: 'Документация' },
];

const Layout: React.FC = () => {
  const { data: build, loading } = useBuildInfo();
  const year = new Date().getFullYear();
  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100'>
      <header className='w-full border-b bg-white/70 backdrop-blur sticky top-0 z-20'>
        <div className='mx-auto max-w-6xl px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <NavLink
              to='/'
              className='text-xl font-bold tracking-tight text-gray-900'
            >
              Маркировка
            </NavLink>
            <Badge color='indigo'>{build?.version ?? 'v1.0.0'}</Badge>
            <Badge color='green'>Stable</Badge>
          </div>
          <nav className='hidden md:flex items-center gap-4 text-sm'>
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-2 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-gray-900 border-indigo-500 font-medium'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`
                }
                end
              >
                {item.label}
                {item.protected && (
                  <span className='ml-1 text-[10px] uppercase tracking-wide text-indigo-500'>
                    auth
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className='flex-1'>
        <Outlet />
      </main>
      <footer className='border-t bg-white'>
        <div className='mx-auto max-w-6xl px-6 py-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <span>© {year} Маркировочная система</span>
          <span className='flex items-center gap-2'>
            <Badge color='green'>CI Active</Badge>
            <Badge color='purple'>Caching</Badge>
            <Badge color='blue'>SPA</Badge>
          </span>
          <span className='flex items-center gap-3'>
            {loading && <Badge color='gray'>build...</Badge>}
            {build && (
              <Badge color='indigo'>
                {build.version} · {build.commit.slice(0, 7)}
              </Badge>
            )}
            <a
              href='https://github.com/33hpS/markirovka'
              target='_blank'
              rel='noreferrer'
              className='hover:text-gray-700'
            >
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
