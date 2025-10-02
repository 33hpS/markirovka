# Маркировочная система

Веб-приложение для управления производственными партиями, генерации QR-кодов и печати этикеток.
Развёрнуто через **Cloudflare Worker (assets binding + SPA fallback)** с автоматическим CI/CD.

> Статус: ядро фронтенда и пайплайн готовы; бизнес‑модули (производство, отчётность, дизайнер) —
> WIP.

## 🚀 Основные возможности (текущее / план)

| Модуль                                 | Статус        | Описание                               |
| -------------------------------------- | ------------- | -------------------------------------- |
| Landing / каркас                       | ✅            | Базовый лендинг + секции               |
| /docs заглушка                         | ✅            | Маршрут и страница WIP                 |
| CI (lint, types, unit tests, coverage) | ✅            | GitHub Actions                         |
| Автодеплой Cloudflare Worker           | ✅            | Wrangler + vars COMMIT_SHA/PKG_VERSION |
| /health /version                       | ✅            | Мониторинг + build metadata            |
| E2E Playwright smoke                   | ✅            | Отдельный CI job                       |
| Кэширование immutable ассетов          | ✅            | 1y immutable hashed                    |
| CSP / security headers                 | ✅ (baseline) | Ужесточение позже                      |
| Label Designer                         | WIP           | Canvas / инспектор                     |
| Производство                           | WIP           | Партионный учёт                        |
| Отчётность                             | WIP           | Графики / KPI                          |
| RBAC / роли                            | WIP           | admin / manager / worker               |
| Печать / профили                       | WIP           | ZPL / PDF / web print                  |
| Наблюдаемость (Sentry)                 | Planned       | Ошибки / трейсинг                      |

## 🛠 Технологический стек

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + React Context
- **Forms**: React Hook Form + Zod validation
- **Authentication**: JWT tokens with auto-refresh
- **Testing**: Vitest + React Testing Library + MSW
- **Code Quality**: ESLint + Prettier + Husky + lint-staged
- **Deployment**: Cloudflare Worker (Wrangler) + GitHub Actions

## 📦 Установка и запуск

### Требования

- Node.js >= 18.0.0
- npm >= 9.0.0

### Установка зависимостей

```bash
npm install
```

### Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=Маркировочная система
VITE_PRINT_SERVICE_URL=http://localhost:8001
VITE_QR_SERVICE_URL=http://localhost:8002
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Сборка (production)

```bash
npm run build
```

### Предварительный просмотр сборки

```bash
npm run preview
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
