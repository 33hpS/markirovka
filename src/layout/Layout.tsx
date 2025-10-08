import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { ConnectionStatus } from '../components/system/ConnectionStatus';
import { Badge } from '../components/ui/Badge';
import { LanguageThemeControls } from '../components/ui/LanguageThemeControls';
import { MobileNavigation } from '../components/ui/MobileNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useBuildInfo } from '../hooks/useBuildInfo';
import { useLanguage } from '../hooks/useLanguage';

const Layout: React.FC = () => {
  const { data: build, loading } = useBuildInfo();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const year = new Date().getFullYear();

  // Состояние подключения QR-сканера
  const [scannerConnected, setScannerConnected] = useState<boolean>(false);
  const [scannerChecking, setScannerChecking] = useState<boolean>(true);

  // Проверка подключения USB/HID устройств (QR-сканеры)
  useEffect(() => {
    const checkScanner = async () => {
      try {
        // Проверяем поддержку Web HID API
        if ('hid' in navigator) {
          const devices = await (navigator as Navigator).hid.getDevices();
          // Сканеры обычно определяются как HID-устройства
          setScannerConnected(devices.length > 0);
        } else if ('usb' in navigator) {
          // Fallback: проверяем наличие устройств через USB API (если доступно)
          const usbDevices = await (navigator as Navigator).usb.getDevices();
          setScannerConnected(usbDevices.length > 0);
        } else {
          // Браузер не поддерживает HID/USB API - считаем что сканера нет
          setScannerConnected(false);
        }
      } catch {
        // Ошибка проверки сканера - устройство не подключено
        setScannerConnected(false);
      } finally {
        setScannerChecking(false);
      }
    };

    checkScanner();

    // Слушаем события подключения/отключения устройств
    if ('hid' in navigator) {
      const nav = navigator as Navigator;
      const handleConnect = () => {
        setScannerConnected(true);
        setScannerChecking(false);
      };
      const handleDisconnect = () => {
        nav.hid
          .getDevices()
          .then((devices: HIDDevice[]) => {
            setScannerConnected(devices.length > 0);
          })
          .catch(() => {
            setScannerConnected(false);
          });
      };

      nav.hid.addEventListener('connect', handleConnect);
      nav.hid.addEventListener('disconnect', handleDisconnect);

      return () => {
        nav.hid.removeEventListener('connect', handleConnect);
        nav.hid.removeEventListener('disconnect', handleDisconnect);
      };
    }

    // Возвращаем пустую функцию если HID не поддерживается
    return undefined;
  }, []);

  const nav = [
    { to: '/production', label: t.production, protected: true },
    { to: '/designer', label: t.designer },
    { to: '/labels', label: t.labels },
    { to: '/products', label: 'Товары' },
    { to: '/line-operator', label: 'Оператор линии' },
    { to: '/printing', label: t.printing },
    { to: '/reports', label: t.reports },
    { to: '/users', label: t.users, protected: true },
    { to: '/system-status', label: 'Статус' },
    { to: '/docs', label: t.docs },
  ];

  return (
    <div className='min-h-screen w-full flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      {/* WMS-стиль шапка с темным фоном */}
      <header className='w-full bg-sky-900 dark:bg-sky-950 text-white sticky top-0 z-20 shadow-lg'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='h-14 flex items-center justify-between gap-4'>
            {/* Левая часть: Лого */}
            <div className='flex items-center gap-3 min-w-0 flex-shrink-0'>
              <NavLink
                to='/home'
                className='flex items-center gap-2 hover:opacity-90 transition-opacity'
              >
                <div className='w-9 h-9 rounded bg-white/20 flex items-center justify-center flex-shrink-0'>
                  <span className='text-lg font-bold'>М</span>
                </div>
                <span className='font-semibold hidden sm:inline whitespace-nowrap'>
                  Маркировка
                </span>
              </NavLink>
            </div>

            {/* Центральная навигация - скрыта на мобильных */}
            <nav className='hidden lg:flex items-center gap-4 text-sm flex-1 justify-center'>
              {nav.slice(0, 5).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/90 hover:text-amber-300 hover:bg-white/10'
                    }`
                  }
                  end
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Правая часть: Статусы + Кнопки */}
            <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
              {/* Индикатор QR-сканера - показывается только если сканер подключен */}
              {scannerConnected && (
                <span className='inline-flex items-center gap-2 text-xs text-white/90 bg-emerald-500/20 px-2.5 py-1.5 rounded border border-emerald-400/30'>
                  <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
                  <span className='hidden md:inline font-medium'>
                    QR-сканер подключен
                  </span>
                  <span className='md:hidden'>Сканер</span>
                </span>
              )}

              {/* Показываем состояние проверки */}
              {scannerChecking && (
                <span className='inline-flex items-center gap-2 text-xs text-white/70 bg-sky-800/40 px-2.5 py-1.5 rounded border border-white/10'>
                  <span className='w-2 h-2 rounded-full bg-amber-400 animate-pulse'></span>
                  <span className='hidden md:inline'>Проверка сканера...</span>
                </span>
              )}

              {/* Индикатор синхронизации Supabase */}
              <span className='hidden sm:inline-flex items-center gap-2 text-xs text-white/90 bg-sky-800/40 px-2.5 py-1.5 rounded border border-white/10'>
                <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span>
                <span className='hidden md:inline'>Синхронизация</span>
              </span>

              {/* Версия */}
              <span className='hidden md:inline-flex text-xs text-white/70 bg-sky-800/40 px-2 py-1 rounded'>
                {build && build.version !== 'unknown'
                  ? build.version
                  : 'v1.0.0'}
              </span>

              {/* Кнопка Задания */}
              <NavLink
                to='/production'
                className='px-2.5 py-1.5 text-sm rounded bg-amber-400 text-sky-900 hover:bg-amber-300 font-medium transition-colors whitespace-nowrap'
              >
                Задания
              </NavLink>

              {/* Индикатор пользователя */}
              {user && (
                <div className='hidden sm:flex items-center gap-2 text-sm text-white/90 bg-sky-800/40 px-3 py-1.5 rounded border border-white/10'>
                  <svg
                    className='w-4 h-4'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='font-medium'>
                    {user.firstName} {user.lastName}
                  </span>
                  <span className='text-xs text-white/60'>({user.role})</span>
                </div>
              )}

              {/* Кнопка выхода */}
              {user && (
                <button
                  onClick={logout}
                  className='px-2.5 py-1.5 text-sm rounded bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/30 transition-colors whitespace-nowrap'
                  title='Выйти из системы'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                </button>
              )}

              {/* Языковые настройки - с темным стилем для WMS-шапки */}
              <div className='flex items-center gap-2'>
                <LanguageThemeControls darkHeader={true} />
              </div>

              {/* Мобильное меню */}
              <MobileNavigation nav={nav} />
            </div>
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
            <ConnectionStatus />
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
