import { Check, Globe } from 'lucide-react';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Language } from '../../contexts/translations';
import { useLanguage } from '../../hooks/useLanguage';

const languageOptions: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Сменить язык'>
          <Globe className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Выберите язык</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languageOptions.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className='flex items-center justify-between cursor-pointer'
          >
            <span>
              {lang.flag} {lang.name}
            </span>
            {language === lang.code && <Check className='h-4 w-4 ml-2' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
