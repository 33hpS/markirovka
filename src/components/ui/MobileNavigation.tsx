import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { LanguageThemeControls } from './LanguageThemeControls';
import { useLanguage } from '../../hooks/useLanguage';

interface MobileNavigationProps {
  nav: Array<{
    to: string;
    label: string;
    protected?: boolean;
  }>;
}

export function MobileNavigation({ nav }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className='md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
        aria-label='Открыть меню'
      >
        <svg
          className='h-6 w-6'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          {isOpen ? (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          ) : (
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Clickable, keyboard-accessible backdrop button */}
          <button
            type='button'
            className='md:hidden fixed inset-0 z-40 bg-black bg-opacity-50'
            aria-label='Закрыть меню'
            onClick={toggleMenu}
            onKeyDown={e => {
              if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')
                toggleMenu();
            }}
          >
            <span className='sr-only'>Закрыть меню</span>
          </button>

          {/* Side drawer */}
          <aside
            className='fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform overflow-y-auto z-50'
            role='dialog'
            aria-modal='true'
          >
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                  {t.settings}
                </h2>
                <button
                  onClick={toggleMenu}
                  className='p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  aria-label='Закрыть меню'
                >
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>

            <nav className='p-4 pb-16'>
              <div className='space-y-2'>
                {nav.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                    end
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Language and theme controls */}
              <LanguageThemeControls isMobile onSelect={toggleMenu} />
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
