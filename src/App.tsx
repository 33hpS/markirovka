import * as React from 'react';

import { Badge } from './components/ui/Badge';
import { SectionCard } from './components/ui/SectionCard';

const App: React.FC = () => {
  return (
    <div className='pb-20'>
      <main className='flex-1'>
        <section className='py-16' id='hero'>
          <div className='mx-auto max-w-5xl px-6 text-center'>
            <h1 className='text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4'>
              Маркировочная система
            </h1>
            <p className='text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8'>
              Система управления производством, генерации QR-кодов и печати
              этикеток с контролем качества и гибким дизайном.
            </p>
            <div className='flex flex-wrap gap-2 justify-center mb-10'>
              <Badge color='green'>React 18</Badge>
              <Badge color='blue'>TypeScript</Badge>
              <Badge color='purple'>Vite</Badge>
              <Badge color='yellow'>Tailwind CSS</Badge>
              <Badge color='indigo'>Zustand</Badge>
              <Badge color='gray'>Radix UI</Badge>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <a
                href='#features'
                className='px-6 py-3 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-500 transition'
              >
                Смотреть функции
              </a>
              <a
                href='https://github.com/33hpS/markirovka'
                target='_blank'
                rel='noreferrer'
                className='px-6 py-3 rounded-md bg-white text-sm font-medium border shadow-sm hover:shadow transition'
              >
                Репозиторий
              </a>
            </div>
          </div>
        </section>
        <section className='py-14 bg-white border-t' id='features'>
          <div className='mx-auto max-w-5xl px-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Ключевые функции
            </h2>
            <div className='grid md:grid-cols-3 gap-6'>
              <SectionCard title='Управление производством'>
                <p>
                  Партии, статусы, контроль качества и отслеживание прогресса.
                </p>
              </SectionCard>
              <SectionCard title='Дизайнер этикеток'>
                <p>
                  Canvas-редактор, слои, шрифты, QR, предпросмотр перед печатью.
                </p>
              </SectionCard>
              <SectionCard title='Печать и экспорты'>
                <p>PDF / ZPL генерация, профили принтеров, пакетная печать.</p>
              </SectionCard>
              <SectionCard title='QR-коды'>
                <p>Генерация, хранение, встраивание в шаблоны этикеток.</p>
              </SectionCard>
              <SectionCard title='Ролевая модель'>
                <p>Админ / менеджер / оператор с разграничением доступа.</p>
              </SectionCard>
              <SectionCard title='Отчётность'>
                <p>
                  Статистика по выпуску, отказам, загрузке мощностей (в работе).
                </p>
              </SectionCard>
            </div>
          </div>
        </section>
        <section className='py-14 bg-gray-50' id='status'>
          <div className='mx-auto max-w-5xl px-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Статус разработки
            </h2>
            <ul className='space-y-3 text-sm text-gray-700 list-disc pl-5'>
              <li>
                Базовый фронтенд развёрнут на Cloudflare Worker (assets + SPA
                fallback).
              </li>
              <li>CI: линтинг, типы, тесты, coverage, автодеплой.</li>
              <li>
                Playwright E2E инфраструктура добавлена (запуск только в CI).
              </li>
              <li>
                Безопасность: CSP (предварительная), security headers,
                кэширование immutable ассетов.
              </li>
              <li>
                /health и /version endpoints (версия улучшится с переменными
                окружения).
              </li>
            </ul>
          </div>
        </section>
        <section className='py-16' id='tech'>
          <div className='mx-auto max-w-5xl px-6'>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Технологический стек
            </h2>
            <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
              <SectionCard title='UI & Core'>
                React 18, TypeScript, Radix UI, Tailwind
              </SectionCard>
              <SectionCard title='State'>
                Zustand + Context, React Hook Form
              </SectionCard>
              <SectionCard title='Валидация'>Zod схемы форм</SectionCard>
              <SectionCard title='Тесты'>
                Vitest, RTL, MSW, Playwright (E2E)
              </SectionCard>
              <SectionCard title='Сборка'>
                Vite 5, Code Splitting, Chunking
              </SectionCard>
              <SectionCard title='Деплой'>
                Cloudflare Worker + CI/CD
              </SectionCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
