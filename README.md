# 🏷️ Маркировочная система (Markirovka)

Полнофункциональное production-ready веб-приложение для управления производственными партиями,
генерации QR-кодов и печати этикеток.

**Развёрнуто**:
[https://markirovka.sherhan1988hp.workers.dev](https://markirovka.sherhan1988hp.workers.dev)

> **Статус**: ✅ Инфраструктура готова (Worker, R2, Supabase), фронтенд работает, требуется
> инициализация БД

---

## 🚀 Быстрый старт

**→ См. [QUICKSTART.md](./QUICKSTART.md)** для пошаговой инструкции запуска

```bash
# 1. Установите зависимости
npm install

# 2. Проверьте подключения (Worker ✅, R2 ✅, Supabase требует init)
npm run test:connections

# 3. Инициализируйте БД (см. QUICKSTART.md раздел 1)
# Выполните database/schema.sql в Supabase SQL Editor

# 4. Запустите приложение
npm run dev
```

**Тестовые учетные данные:**

- Admin: `admin` / `admin123`
- Manager: `manager` / `manager123`
- Worker: `worker` / `worker123`

---

## � Основные возможности

| Модуль                         | Статус        | Описание                             |
| ------------------------------ | ------------- | ------------------------------------ |
| **Инфраструктура**             |               |                                      |
| Cloudflare Worker + R2 Storage | ✅ Deployed   | SPA hosting + secure file uploads    |
| Supabase PostgreSQL            | ✅ Configured | Database ready (требует init schema) |
| Environment Management         | ✅ Complete   | .env.example + .env.local setup      |
| /health, /version endpoints    | ✅            | Health checks + build metadata       |
| **Frontend Core**              |               |                                      |
| Authentication System          | ✅ Working    | JWT mock auth (ready for Supabase)   |
| Protected Routes               | ✅ Fixed      | No redirect loops                    |
| Landing Page                   | ✅            | Home page with navigation            |
| Dashboard (роли)               | ✅            | Admin/Manager/Worker dashboards      |
| **Business Modules**           |               |                                      |
| Label Designer                 | 🚧 WIP        | Canvas editor + inspector            |
| Production Management          | 🚧 WIP        | Batch tracking + QR generation       |
| Print Jobs                     | 🚧 WIP        | ZPL / PDF / direct printing          |
| Reports & Analytics            | 🚧 WIP        | Charts / KPIs / statistics           |
| **CI/CD & Quality**            |               |                                      |
| GitHub Actions CI              | ✅            | Lint, typecheck, tests, coverage     |
| Automated deployment           | ✅            | Auto-deploy to Cloudflare Worker     |
| E2E tests (Playwright)         | ✅            | Smoke tests                          |
| Immutable asset caching        | ✅            | 1y cache with hashed filenames       |
| CSP / security headers         | ✅            | Basic CSP enabled                    |

## 🛠 Технологический стек

### Frontend

- **Framework**: React 18 + TypeScript + Vite 5
- **UI Library**: Radix UI primitives + Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand (global) + React Context (auth)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6 with protected routes
- **Canvas**: HTML5 Canvas API для редактора этикеток

### Backend & Infrastructure

- **Hosting**: Cloudflare Workers (serverless, global CDN)
- **File Storage**: Cloudflare R2 (S3-compatible object storage)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Authentication**: JWT-based (mock готово, Supabase Auth ready to integrate)

### DevOps & Quality

- **Testing**: Vitest + React Testing Library + MSW (API mocks)
- **E2E**: Playwright (smoke tests)
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Git Hooks**: Husky + lint-staged (pre-commit validation)
- **CI/CD**: GitHub Actions (lint, test, build, deploy)
- **Deployment**: Wrangler CLI (Cloudflare Workers)

## 🏗️ Архитектура

```
┌─────────────────┐
│   React SPA     │  ← Пользователь
│  (TypeScript)   │
└────────┬────────┘
         │
         │ HTTPS
         ↓
┌─────────────────────────────┐
│  Cloudflare Worker          │
│  - Assets serving (SPA)     │  ← Global CDN Edge
│  - /api/r2/upload endpoint  │
│  - /api/r2/file proxy       │
│  - /health, /version        │
└──┬──────────────────────┬───┘
   │                      │
   │ R2 API               │ HTTPS
   ↓                      ↓
┌────────────┐    ┌──────────────┐
│ R2 Storage │    │   Supabase   │
│  (Files)   │    │  PostgreSQL  │
└────────────┘    │     Auth     │
                  │   Realtime   │
                  └──────────────┘
```

**Безопасность:**

- ✅ Все секреты только на сервере (Worker env vars)
- ✅ R2 ключи не попадают в браузер (Worker proxy)
- ✅ Supabase Row Level Security (RLS)
- ✅ CSP headers + HTTPS only

**Масштабирование:**

- ✅ Cloudflare Edge CDN (200+ locations)
- ✅ Serverless Worker (unlimited scale)
- ✅ R2 S3-compatible storage
- ✅ Supabase managed PostgreSQL

---

## 📦 Установка и настройка

### Требования

- Node.js >= 20.0.0
- npm >= 9.0.0
- Cloudflare account (для деплоя)
- Supabase account (для БД)

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

Скопируйте шаблон и заполните реальные значения:

```bash
cp .env.example .env.local
```

Отредактируйте `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://wjclhytzewfcalyybhab.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 (через Worker API - ключи не нужны в .env)
VITE_API_URL=https://markirovka.sherhan1988hp.workers.dev/api

# Для локальной разработки Worker нужны ключи:
VITE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=your-access-key
VITE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_R2_BUCKET_NAME=markirovka-storage
```

**→ Подробнее:** см. [SETUP.md](./SETUP.md) для полной инструкции по настройке

### 3. Инициализация базы данных

См. [QUICKSTART.md](./QUICKSTART.md) раздел "1️⃣ Инициализация базы данных Supabase"

Или кратко:

1. Откройте Supabase SQL Editor
2. Выполните `database/schema.sql`

### 4. Запуск приложения

```bash
# Режим разработки (http://localhost:5173)
npm run dev

# Сборка для production
npm run build

# Деплой на Cloudflare Workers
npm run deploy:worker

# Проверка подключений
npm run test:connections
```

## 🧪 Тестирование

| Тип            | Команда                 | Примечание                    |
| -------------- | ----------------------- | ----------------------------- |
| Unit/Component | `npm test`              | Vitest JSDOM                  |
| Coverage       | `npm run test:coverage` | lcov + json                   |
| Watch          | `npm run test:watch`    | Быстрая разработка            |
| UI runner      | `npm run test:ui`       | Vitest UI (локально)          |
| E2E (local)    | `npm run e2e`           | Playwright, нужен dev/preview |
| E2E (CI smoke) | Автоматически           | После деплоя                  |

## 🔧 Разработка

### Код-стайл

Проект использует ESLint и Prettier для поддержания единого стиля кода.

```bash
# Проверка линтером
npm run lint

# Автоисправление
npm run lint:fix

# Форматирование кода
npm run format
```

### Git hooks

Настроены автоматические проверки при коммитах:

- **pre-commit**: Линтинг и форматирование staged файлов
- **commit-msg**: Проверка формата commit message
- **pre-push**: Запуск тестов перед пушем

### Типизация

```bash
# Проверка типов TypeScript
npm run type-check
```

## 📁 Сокращённая структура

```
src/
	App.tsx
	Docs.tsx
	main.tsx
	components/ui/Badge.tsx
	components/ui/SectionCard.tsx
	hooks/useBuildInfo.ts
	__tests__/
worker.js
```

## 🔐 Аутентификация

Система использует JWT токены для аутентификации:

- Автоматическое обновление токенов
- Защищенные маршруты
- Ролевой доступ (admin, manager, worker)

## 🎨 Дизайн-система

Проект использует современную дизайн-систему:

- **Цветовая схема**: Настраиваемые CSS переменные
- **Типографика**: Inter font family
- **Компоненты**: Radix UI + кастомные стили
- **Иконки**: Lucide React
- **Адаптивность**: Mobile-first подход

## 📱 Адаптивность

- **Desktop**: >= 1024px
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

## 🖨 Система печати

Поддержка различных типов принтеров:

- **Термопринтеры**: Zebra, Datamax
- **Струйные принтеры**: HP, Canon, Epson
- **Лазерные принтеры**: Brother, Kyocera

### Форматы печати

- PDF генерация для универсальной печати
- ZPL команды для термопринтеров
- Прямая печать через Web Print API

## 🌐 Деплой / CI

Поток: push → lint/tests → deploy (main) → e2e smoke.

Переменные build (COMMIT_SHA, PKG_VERSION) передаются как `--var` в `wrangler deploy` и доступны на
`/version`.

## 🤝 Вклад в разработку

1. Форкните репозиторий
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Сделайте коммит (`git commit -m 'feat: add amazing feature'`)
4. Запушьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Формат коммитов

Используется [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование, стиль кода
- `refactor:` - рефакторинг кода
- `test:` - добавление тестов
- `chore:` - обновление зависимостей, конфигурации

## 📈 Производительность

### Оптимизации

- **Code splitting**: Автоматическое разделение кода по маршрутам
- **Lazy loading**: Ленивая загрузка компонентов
- **Bundle optimization**: Оптимизация сборки с Vite
- **Asset optimization**: Сжатие изображений и статических файлов

### Мониторинг

- Bundle analyzer для анализа размера сборки
- Performance monitoring через Web Vitals
- Error tracking и логирование

## 🔒 Безопасность

### Меры безопасности

- **XSS защита**: DOMPurify для санитизации входных данных
- **CSRF защита**: CSRF токены для форм
- **Input validation**: Zod схемы для валидации
- **Secure headers**: Content Security Policy и другие заголовки
- **Authentication**: Безопасное хранение JWT токенов

### Аудит безопасности

```bash
# Проверка уязвимостей в зависимостях
npm audit

# Автоматическое исправление
npm audit fix
```

## 📚 Документация

`/docs` и `docs/overview.md` — WIP. Основной прогресс фиксируется в README.

## 🐛 Отладка и логирование

### Development

```bash
# Запуск с подробными логами
npm run dev -- --debug

# Анализ сборки
npm run analyze
```

### Production

- Интеграция с Sentry для отслеживания ошибок
- Structured logging для анализа
- Performance monitoring

## ⚡ Производительность

### Core Web Vitals

Проект оптимизирован для достижения хороших показателей:

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Lighthouse Score

Целевые показатели:

- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

## 🆔 Лицензия

[MIT License](./LICENSE)

## 👥 Команда

- **Frontend Lead**: Development Team
- **UI/UX Designer**: Design Team
- **DevOps Engineer**: Infrastructure Team

## 📞 Поддержка

Для получения поддержки:

1. Проверьте [FAQ](./docs/faq.md)
2. Создайте [Issue](https://github.com/username/repo/issues)
3. Свяжитесь с командой разработки

## 🔄 Changelog

Все значимые изменения документируются в [CHANGELOG.md](./CHANGELOG.md).

---

**Версия (runtime)**: отображается в футере (данные с /version) **Последнее обновление**: Октябрь
2025
