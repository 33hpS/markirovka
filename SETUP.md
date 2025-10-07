# 🚀 Руководство по настройке проекта

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

#### Локальная разработка

Скопируйте `.env.example` в `.env.local` и заполните значения:

```bash
cp .env.example .env.local
```

**Минимальная конфигурация для работы:**

```env
# Supabase (обязательно для работы с БД)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# R2 (опционально - можно использовать Worker API)
VITE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=your-access-key
VITE_R2_SECRET_ACCESS_KEY=your-secret-key
VITE_R2_BUCKET_NAME=markirovka-storage

# API URL (автоматически определяется если не указано)
VITE_API_URL=https://markirovka.sherhan1988hp.workers.dev/api
```

#### Production (Cloudflare Workers)

Для деплоя на Cloudflare установите секреты:

```bash
# Supabase
npx wrangler secret put VITE_SUPABASE_URL
npx wrangler secret put VITE_SUPABASE_ANON_KEY

# R2 (опционально - Worker использует binding)
npx wrangler secret put VITE_R2_ENDPOINT
npx wrangler secret put VITE_R2_ACCESS_KEY_ID
npx wrangler secret put VITE_R2_SECRET_ACCESS_KEY
npx wrangler secret put VITE_R2_BUCKET_NAME
```

### 3. Настройка Supabase

#### Создание схемы БД

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Откройте SQL Editor
3. Выполните скрипт из `database/schema.sql`

#### Быстрая настройка (minimal)

Если нужна только базовая структура, выполните `database/quick-setup.sql`

#### Настройка Auth

1. Settings → Authentication
2. Email: включить Email/Password provider
3. Site URL: `https://markirovka.sherhan1988hp.workers.dev`
4. Redirect URLs: добавить `https://markirovka.sherhan1988hp.workers.dev/**`

### 4. Настройка R2 (Cloudflare Object Storage)

#### Через Worker Binding (рекомендуется)

В `wrangler.toml` уже настроено:

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "markirovka-storage"
```

Создайте bucket если его нет:

```bash
npx wrangler r2 bucket create markirovka-storage
```

#### Прямой доступ (не рекомендуется для production)

Если хотите использовать прямые загрузки с фронта (небезопасно):

- Настройте CORS в R2 Dashboard
- Заполните все `VITE_R2_*` переменные

**⚠️ Внимание:** Прямой доступ раскрывает ключи R2 в браузере. Используйте Worker API для
безопасности.

### 5. Запуск проекта

#### Development

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

#### Production Build

```bash
npm run build
```

#### Deploy

```bash
npm run deploy:worker
```

## 📚 Архитектура

### Cloudflare Worker API

Worker предоставляет безопасные эндпоинты:

- `POST /api/r2/upload` - загрузка файлов в R2 (multipart или raw)
- `GET /api/r2/file?key=...` - получение файлов из R2
- `GET /health` - проверка здоровья воркера
- `GET /version` - информация о версии

### Аутентификация

Система использует два режима:

1. **Mock Auth** (по умолчанию) - для разработки
   - Хранится в `src/contexts/AuthContext.tsx`
   - Тестовые пользователи:
     - admin@markirovka.ru / admin123
     - manager@markirovka.ru / manager123
     - worker@markirovka.ru / worker123

2. **Supabase Auth** (для production)
   - Раскомментируйте код в `AuthContext.tsx`
   - Настройте провайдеры в Supabase Dashboard

### Хранение файлов

Два варианта:

1. **Worker R2 API** (рекомендуется)

   ```ts
   const formData = new FormData();
   formData.append('file', file);
   formData.append('key', 'path/to/file.pdf');

   const res = await fetch('/api/r2/upload', {
     method: 'POST',
     body: formData,
   });
   ```

2. **Supabase Storage** (альтернатива)
   ```ts
   import { supabaseService } from './services/supabaseService';
   await supabaseService.uploadFile('bucket', 'filename', file);
   ```

## 🔒 Безопасность

### Что НЕ нужно коммитить

- `.env.local` - локальные переменные
- `wrangler.toml` с раскомментированными секретами (если добавляете)
- Любые ключи API, токены, пароли

### Что безопасно

- `.env.example` - шаблон без реальных значений
- `src/config/config.ts` - читает из env, не содержит секретов
- Публичные ключи (anon key Supabase можно, но лучше через env)

### Рекомендации

1. **R2 ключи** - используйте только в Worker, не на фронте
2. **Supabase Service Role** - только на сервере, никогда в браузере
3. **CORS** - настройте строго для своего домена
4. **RLS** - включите Row Level Security в Supabase для всех таблиц

## 🧪 Тестирование

### Unit тесты

```bash
npm run test
```

### E2E тесты

```bash
npm run e2e
```

### Проверка типов

```bash
npm run type-check
```

## 📝 Полезные команды

```bash
# Форматирование кода
npm run format

# Линтинг
npm run lint
npm run lint:fix

# Сборка для production
npm run build

# Деплой
npm run deploy:worker

# Проверка версии на проде
curl https://markirovka.sherhan1988hp.workers.dev/version

# Проверка здоровья
curl https://markirovka.sherhan1988hp.workers.dev/health
```

## 🐛 Troubleshooting

### "Supabase is not configured"

**Проблема:** В консоли браузера видно предупреждение о Supabase

**Решение:**

1. Проверьте `.env.local` - должны быть `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
2. Перезапустите dev сервер (`npm run dev`)

### "R2 binding is not configured"

**Проблема:** Worker возвращает ошибку при загрузке файлов

**Решение:**

1. Проверьте `wrangler.toml` - должен быть раскомментирован блок `[[r2_buckets]]`
2. Создайте bucket: `npx wrangler r2 bucket create markirovka-storage`
3. Передеплойте: `npm run deploy:worker`

### "Module externalized for browser compatibility"

**Проблема:** Предупреждения при сборке о `crypto`, `stream`, `util`

**Решение:** Это нормально - эти модули используются только в Node.js зависимостях и не попадают в
бандл браузера. Можно игнорировать.

### CORS ошибки

**Проблема:** Fetch запросы к R2/Supabase блокируются браузером

**Решение:**

1. **R2:** Используйте Worker API (`/api/r2/*`) вместо прямого доступа
2. **Supabase:** Проверьте настройки CORS в Dashboard
3. **Worker:** CORS уже настроен в `worker.js`

## 📖 Дополнительная документация

- [AUTH_README.md](./AUTH_README.md) - Система аутентификации
- [database/schema.sql](./database/schema.sql) - Схема БД
- [docs/](./docs/) - Подробные гайды по интеграции

## 🤝 Поддержка

Если возникли проблемы:

1. Проверьте [Issues](https://github.com/33hpS/markirovka/issues)
2. Создайте новый Issue с описанием проблемы
3. Приложите логи из консоли браузера и терминала

---

**Версия документа:** 1.0.0  
**Последнее обновление:** 2025-10-08
