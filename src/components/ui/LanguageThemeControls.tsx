import { Moon, Sun } from 'lucide-react';

import { Theme } from '../../contexts/ThemeContext';
import { Language } from '../../contexts/translations';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

interface LanguageThemeControlsProps {
  isMobile?: boolean;
  onSelect?: () => void;
}

const languages: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageThemeControls({
  isMobile = false,
  onSelect,
}: LanguageThemeControlsProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (onSelect) onSelect();
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (onSelect) onSelect();
  };

  // Стили для мобильной и десктопной версии
  const containerClass = isMobile
    ? 'px-4 py-3 border-t border-gray-200 dark:border-gray-700'
    : 'flex items-center gap-3';

  const sectionClass = isMobile ? 'mb-4' : 'relative';

  const titleClass = isMobile
    ? 'text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'
    : 'sr-only';

  const optionsContainerClass = isMobile ? 'grid grid-cols-3 gap-2' : 'flex';

  // Для мобильной версии делаем кнопки, для десктопной селекты
  if (isMobile) {
    return (
      <div className={containerClass}>
        <div className={sectionClass}>
          <h3 className={titleClass}>{t.language}</h3>
          <div className={optionsContainerClass}>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center justify-center p-2 rounded-md ${
                  language === lang.code
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className='mr-2'>{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionClass}>
          <h3 className={titleClass}>{t.theme}</h3>
          <div className={optionsContainerClass}>
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center p-2 rounded-md ${
                theme === 'light'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Sun className='h-4 w-4 mr-2' />
              {t.lightTheme}
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center p-2 rounded-md ${
                theme === 'dark'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Moon className='h-4 w-4 mr-2' />
              {t.darkTheme}
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`flex items-center justify-center p-2 rounded-md ${
                theme === 'system'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className='flex items-center h-4 w-4 mr-2'>
                <Sun className='h-4 w-4' />
                <Moon className='h-4 w-4' />
              </div>
              {t.systemTheme}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Десктопная версия с выпадающими списками
  return (
    <div className={containerClass}>
      <div className={sectionClass}>
        <label htmlFor='language-select' className={titleClass}>
          {t.language}
        </label>
        <select
          id='language-select'
          value={language}
          onChange={e => setLanguage(e.target.value as Language)}
          className='bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200'
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className={sectionClass}>
        <label htmlFor='theme-select' className={titleClass}>
          {t.theme}
        </label>
        <select
          id='theme-select'
          value={theme}
          onChange={e => setTheme(e.target.value as Theme)}
          className='bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-200'
        >
          <option value='light'>☀️ {t.lightTheme}</option>
          <option value='dark'>🌙 {t.darkTheme}</option>
          <option value='system'>💻 {t.systemTheme}</option>
        </select>
      </div>
    </div>
  );
}
