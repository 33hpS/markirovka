import { NavLink, Outlet } from 'react-router-dom';

import { Badge } from '../components/ui/Badge';
import { LanguageThemeControls } from '../components/ui/LanguageThemeControls';
import { MobileNavigation } from '../components/ui/MobileNavigation';
import { useBuildInfo } from '../hooks/useBuildInfo';
import { useLanguage } from '../hooks/useLanguage';

const Layout: React.FC = () => {
  const { data: build, loading, error } = useBuildInfo();
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const nav = [
    { to: '/production', label: t.production, protected: true },
    { to: '/designer', label: t.designer },
    { to: '/labels', label: t.labels },
    { to: '/products', label: 'Товары' },
    { to: '/line-operator', label: 'Оператор линии' },
    { to: '/printing', label: t.printing },
    { to: '/reports', label: t.reports },
    { to: '/users', label: t.users, protected: true },
    { to: '/docs', label: t.docs },
  ];

  const connectionBadge: { color: 'yellow' | 'red' | 'green'; label: string } =
    loading
      ? { color: 'yellow', label: 'Проверка связи' }
      : error
        ? { color: 'red', label: 'Нет подключения' }
        : { color: 'green', label: 'Подключено' };

  return (
    <div className='min-h-screen w-full flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <header className='w-full border-b bg-white/70 dark:bg-gray-800/70 backdrop-blur sticky top-0 z-20 border-gray-200 dark:border-gray-700'>
        <div className='mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            <NavLink
              to='/home'
              className='text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100'
            >
              Маркировка
            </NavLink>
            <Badge color={connectionBadge.color} className='whitespace-nowrap'>
              {connectionBadge.label}
            </Badge>
            <Badge color='indigo'>
              {build && build.version !== 'unknown' ? build.version : 'v1.0.0'}
            </Badge>
            <Badge color='green'>Stable</Badge>
          </div>

          <nav className='hidden items-center gap-4 text-sm md:flex'>
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-2 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-100 border-indigo-500 font-medium'
                      : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className='flex items-center gap-3'>
            <LanguageThemeControls />
            <MobileNavigation nav={nav} />
          </div>
        </div>
      </header>

      <main className='flex-1 w-full bg-gray-50 dark:bg-gray-900'>
        <Outlet />
      </main>

      <footer className='border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:px-6 lg:px-8'>
          <span>© {year} Маркировочная система</span>
          <span className='flex flex-wrap items-center gap-2'>
            <Badge color={connectionBadge.color} className='whitespace-nowrap'>
              {connectionBadge.label}
            </Badge>
            <Badge color='green'>CI Active</Badge>
            <Badge color='purple'>Caching</Badge>
            {loading && <Badge color='gray'>build...</Badge>}
            {build && build.version !== 'unknown' && build.commit ? (
              <Badge color='blue'>
                {build.version} · {build.commit.slice(0, 7)}
              </Badge>
            ) : null}
            <a
              href='https://github.com/33hpS/markirovka'
              target='_blank'
              rel='noreferrer'
              className='hover:text-gray-700 dark:hover:text-gray-300'
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
