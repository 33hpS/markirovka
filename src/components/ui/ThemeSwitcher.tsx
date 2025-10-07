import { Moon, Sun } from 'lucide-react';

import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Theme } from '../../contexts/ThemeContext';
import { useTheme } from '../../hooks/useTheme';

const themeOptions: Array<{
  code: Theme;
  name: string;
  icon: React.ReactNode;
}> = [
  { code: 'light', name: 'Светлая тема', icon: <Sun className='h-4 w-4' /> },
  { code: 'dark', name: 'Темная тема', icon: <Moon className='h-4 w-4' /> },
  {
    code: 'system',
    name: 'Системная тема',
    icon: (
      <div className='h-4 w-4 flex'>
        <Sun className='h-4 w-4 flex-1' />
        <Moon className='h-4 w-4 flex-1' />
      </div>
    ),
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Сменить тему'>
          {theme === 'light' && <Sun className='h-5 w-5' />}
          {theme === 'dark' && <Moon className='h-5 w-5' />}
          {theme === 'system' && (
            <div className='h-5 w-5 flex items-center'>
              <Sun className='h-4 w-4 flex-1' />
              <Moon className='h-4 w-4 flex-1' />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Выберите тему</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map(themeOption => (
          <DropdownMenuItem
            key={themeOption.code}
            onClick={() => setTheme(themeOption.code)}
            className='flex items-center justify-between cursor-pointer'
          >
            <span className='flex items-center gap-2'>
              {themeOption.icon}
              {themeOption.name}
            </span>
            {theme === themeOption.code && <span className='ml-2'>✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
