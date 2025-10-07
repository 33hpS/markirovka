import * as React from 'react';
import { useState } from 'react';

interface DocSection {
  id: string;
  title: string;
  status: 'complete' | 'wip' | 'planned';
  icon: string;
  description: string;
  content: React.ReactNode;
}

const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const docSections: DocSection[] = [
    {
      id: 'overview',
      title: 'Обзор системы',
      status: 'complete',
      icon: '📋',
      description: 'Общее описание системы маркировки',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Система маркировки продукции
          </h2>

          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2'>
              Назначение системы
            </h3>
            <p className='text-blue-800 dark:text-blue-200'>
              Комплексное решение для автоматизации процессов маркировки
              продукции, управления шаблонами этикеток, организации печати и
              контроля качества.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                🏭 Производство
              </h4>
              <p className='text-gray-600 dark:text-gray-300 text-sm'>
                Управление производственными процессами и контроль качества
                маркировки
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                🏷️ Этикетки
              </h4>
              <p className='text-gray-600 dark:text-gray-300 text-sm'>
                Каталог шаблонов, версионирование и привязка к продуктам
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                🖨️ Печать
              </h4>
              <p className='text-gray-600 dark:text-gray-300 text-sm'>
                Очередь заданий, профили принтеров и мониторинг статусов
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                👥 Пользователи
              </h4>
              <p className='text-gray-600 dark:text-gray-300 text-sm'>
                RBAC система управления ролями и аудит действий
              </p>
            </div>
          </div>

          <div className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              Технологический стек
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
              <div>
                <strong>Frontend:</strong> React 18, TypeScript
              </div>
              <div>
                <strong>Стили:</strong> Tailwind CSS
              </div>
              <div>
                <strong>Сборка:</strong> Vite 5
              </div>
              <div>
                <strong>Деплой:</strong> Cloudflare Workers
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'architecture',
      title: 'Архитектура модулей',
      status: 'wip',
      icon: '🏗️',
      description: 'Структура приложения и взаимодействие компонентов',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Архитектура системы
          </h2>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <span className='text-yellow-600 mr-2'>🚧</span>
              <span className='font-medium text-yellow-800'>
                Статус: В разработке
              </span>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              Модульная структура
            </h3>

            <div className='space-y-3'>
              <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  📁 src/pages/
                </h4>
                <p className='text-gray-600 dark:text-gray-300 mb-2'>
                  Основные страницы приложения
                </p>
                <ul className='text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4'>
                  <li>• Production.tsx - Управление производством</li>
                  <li>• Labels.tsx - Каталог шаблонов этикеток</li>
                  <li>• Printing.tsx - Система печати</li>
                  <li>• Users.tsx - Управление пользователями</li>
                  <li>• Reports.tsx - Аналитика и отчеты</li>
                </ul>
              </div>

              <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  🧩 src/components/
                </h4>
                <p className='text-gray-600 dark:text-gray-300 mb-2'>
                  Переиспользуемые компоненты
                </p>
                <ul className='text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4'>
                  <li>• ui/ - Базовые UI компоненты</li>
                  <li>• shared/ - Общие компоненты</li>
                  <li>• dashboard/ - Компоненты дашборда</li>
                </ul>
              </div>

              <div className='border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  ⚙️ src/services/
                </h4>
                <p className='text-gray-600 dark:text-gray-300 mb-2'>
                  Сервисы и API
                </p>
                <ul className='text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4'>
                  <li>• dataService.ts - Работа с данными</li>
                  <li>• printService.ts - Управление печатью</li>
                  <li>• qrService.ts - Генерация QR-кодов</li>
                </ul>
              </div>
            </div>
          </div>

          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Схема взаимодействия модулей
            </h3>
            <div className='text-center py-8 text-gray-500'>
              [Диаграмма архитектуры будет добавлена]
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API взаимодействие',
      status: 'wip',
      icon: '🔌',
      description: 'Описание API endpoints и форматов данных',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900'>API Документация</h2>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <span className='text-yellow-600 mr-2'>🚧</span>
              <span className='font-medium text-yellow-800'>
                Статус: В разработке
              </span>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Основные endpoints
            </h3>

            <div className='space-y-3'>
              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center mb-2'>
                  <span className='bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono mr-2'>
                    GET
                  </span>
                  <code className='text-gray-800'>/api/production</code>
                </div>
                <p className='text-gray-600 text-sm'>
                  Получение списка производственных заданий
                </p>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center mb-2'>
                  <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono mr-2'>
                    POST
                  </span>
                  <code className='text-gray-800'>/api/labels</code>
                </div>
                <p className='text-gray-600 text-sm'>
                  Создание нового шаблона этикетки
                </p>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center mb-2'>
                  <span className='bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-mono mr-2'>
                    PUT
                  </span>
                  <code className='text-gray-800'>
                    /api/print-jobs/{`{id}`}
                  </code>
                </div>
                <p className='text-gray-600 text-sm'>
                  Обновление статуса задания печати
                </p>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center mb-2'>
                  <span className='bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono mr-2'>
                    DELETE
                  </span>
                  <code className='text-gray-800'>/api/users/{`{id}`}</code>
                </div>
                <p className='text-gray-600 text-sm'>Удаление пользователя</p>
              </div>
            </div>
          </div>

          <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Аутентификация
            </h3>
            <p className='text-gray-600 text-sm mb-2'>
              Все API запросы требуют авторизации:
            </p>
            <code className='bg-gray-100 p-2 rounded text-sm block'>
              Authorization: Bearer {`{token}`}
            </code>
          </div>
        </div>
      ),
    },
    {
      id: 'types',
      title: 'Типы и схемы данных',
      status: 'wip',
      icon: '📊',
      description: 'TypeScript интерфейсы и структуры данных',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900'>Типы данных</h2>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <span className='text-yellow-600 mr-2'>🚧</span>
              <span className='font-medium text-yellow-800'>
                Статус: В разработке
              </span>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Основные интерфейсы
            </h3>

            <div className='space-y-4'>
              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>User</h4>
                <pre className='bg-gray-100 p-3 rounded text-sm overflow-x-auto'>
                  {`interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'blocked' | 'pending';
  department: string;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
}`}
                </pre>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>
                  LabelTemplate
                </h4>
                <pre className='bg-gray-100 p-3 rounded text-sm overflow-x-auto'>
                  {`interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  products: string[];
  dimensions: {
    width: number;
    height: number;
  };
  isActive: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}`}
                </pre>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>PrintJob</h4>
                <pre className='bg-gray-100 p-3 rounded text-sm overflow-x-auto'>
                  {`interface PrintJob {
  id: string;
  name: string;
  template: string;
  quantity: number;
  printer: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  user: string;
  createdAt: string;
  estimatedTime?: string;
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'printing',
      title: 'Печать и профили принтеров',
      status: 'wip',
      icon: '🖨️',
      description: 'Настройка принтеров, форматы ZPL/PDF',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900'>Система печати</h2>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <span className='text-yellow-600 mr-2'>🚧</span>
              <span className='font-medium text-yellow-800'>
                Статус: В разработке
              </span>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Поддерживаемые форматы
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>
                  ZPL (Zebra Programming Language)
                </h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Zebra ZT420, ZT410</li>
                  <li>• Zebra GK420d, GX420</li>
                  <li>• Разрешение 203/300 dpi</li>
                  <li>• Термопечать и термотрансфер</li>
                </ul>
              </div>

              <div className='border border-gray-200 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>PDF печать</h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Brother QL-820NWB</li>
                  <li>• HP LaserJet Pro</li>
                  <li>• Цветная и монохромная печать</li>
                  <li>• Форматы A4, этикетки</li>
                </ul>
              </div>
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Конфигурация принтера
              </h3>
              <pre className='bg-gray-100 p-3 rounded text-sm overflow-x-auto'>
                {`{
  "name": "Zebra-ZT420-01",
  "type": "ZPL",
  "ipAddress": "192.168.1.101",
  "resolution": "203 dpi",
  "paperSize": "104mm x 74mm",
  "capabilities": [
    "203 dpi",
    "300 dpi", 
    "Термопечать",
    "Термотрансфер"
  ]
}`}
              </pre>
            </div>

            <div className='border border-gray-200 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 mb-2'>
                Очередь печати
              </h4>
              <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                <li>• Приоритизация заданий</li>
                <li>• Мониторинг статуса в реальном времени</li>
                <li>• Автоматическое переназначение при ошибках</li>
                <li>• Пакетная печать больших объемов</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'deployment',
      title: 'Pipeline деплоя',
      status: 'complete',
      icon: '🚀',
      description: 'CI/CD процессы и развертывание',
      content: (
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-gray-900'>
            Процесс развертывания
          </h2>

          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <span className='text-green-600 mr-2'>✅</span>
              <span className='font-medium text-green-800'>Статус: Готово</span>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-xl font-semibold text-gray-900'>
              GitHub Actions CI/CD
            </h3>

            <div className='border border-gray-200 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 mb-2'>
                Этапы pipeline
              </h4>
              <div className='space-y-2'>
                <div className='flex items-center'>
                  <span className='text-green-500 mr-2'>✓</span>
                  <span className='text-sm'>
                    Проверка кода (ESLint, TypeScript)
                  </span>
                </div>
                <div className='flex items-center'>
                  <span className='text-green-500 mr-2'>✓</span>
                  <span className='text-sm'>Сборка приложения (Vite)</span>
                </div>
                <div className='flex items-center'>
                  <span className='text-green-500 mr-2'>✓</span>
                  <span className='text-sm'>
                    Тестирование (Vitest, Playwright)
                  </span>
                </div>
                <div className='flex items-center'>
                  <span className='text-green-500 mr-2'>✓</span>
                  <span className='text-sm'>
                    Развертывание (Cloudflare Workers)
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Cloudflare Workers
              </h3>
              <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                <li>• Edge-first архитектура</li>
                <li>• Автоматическое масштабирование</li>
                <li>• CDN кэширование статических ресурсов</li>
                <li>• SPA роутинг с fallback</li>
                <li>• Версионирование и health checks</li>
              </ul>
            </div>

            <div className='border border-gray-200 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 mb-2'>
                Команды развертывания
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-sm font-medium text-gray-700'>
                    Сборка:
                  </span>
                  <code className='bg-gray-100 px-2 py-1 rounded text-sm ml-2'>
                    npm run build
                  </code>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-700'>
                    Деплой:
                  </span>
                  <code className='bg-gray-100 px-2 py-1 rounded text-sm ml-2'>
                    npm run deploy:worker
                  </code>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-700'>
                    Проверка:
                  </span>
                  <code className='bg-gray-100 px-2 py-1 rounded text-sm ml-2'>
                    curl /health
                  </code>
                </div>
              </div>
            </div>

            <div className='border border-gray-200 rounded-lg p-4'>
              <h4 className='font-semibold text-gray-900 mb-2'>Мониторинг</h4>
              <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                <li>• Health endpoint для проверки доступности</li>
                <li>• Version endpoint с информацией о сборке</li>
                <li>• Логирование ошибок через Sentry (опционально)</li>
                <li>• Метрики производительности Cloudflare</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const getStatusBadge = (status: DocSection['status']) => {
    switch (status) {
      case 'complete':
        return (
          <span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'>
            Готово
          </span>
        );
      case 'wip':
        return (
          <span className='bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'>
            В работе
          </span>
        );
      case 'planned':
        return (
          <span className='bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs'>
            Планируется
          </span>
        );
      default:
        return null;
    }
  };

  const activeDoc = docSections.find(doc => doc.id === activeSection);

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Документация
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-2'>
          Техническая документация системы маркировки продукции
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Боковое меню */}
        <div className='lg:col-span-1'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              Разделы
            </h2>
            <nav className='space-y-2'>
              {docSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start'>
                      <span className='text-lg mr-2'>{section.icon}</span>
                      <div>
                        <div className='font-medium text-sm'>
                          {section.title}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                          {section.description}
                        </div>
                      </div>
                    </div>
                    <div className='ml-2 flex-shrink-0'>
                      {getStatusBadge(section.status)}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className='lg:col-span-3'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            {activeDoc?.content}
          </div>
        </div>
      </div>

      {/* Футер с навигацией */}
      <div className='mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
        <div className='flex justify-between items-center'>
          <a
            href='/'
            className='text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium'
          >
            ← На главную
          </a>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Документация обновлена: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
