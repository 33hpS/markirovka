# Cloudflare Deployment Guide

## ✅ Статус деплоя

**Worker успешно развёрнут!**

- URL: https://markirovka.sherhan1988hp.workers.dev
- Dashboard:
  https://dash.cloudflare.com/704015f3ab3baf13d815b254aee29972/workers/services/view/markirovka/production

## 🚀 Cloudflare Workers + Assets (текущая конфигурация)

Проект использует **Cloudflare Workers with Assets** вместо Pages для большей гибкости и контроля.

### Build & Deploy Configuration

```bash
# Полный деплой (сборка + загрузка)
npm run deploy

# Только сборка
npm run build

# Wrangler напрямую
wrangler deploy
```

**Текущая версия**: Version ID: 233670c0-0a00-45a5-b66a-24908fa5aef7

### 🔐 Environment Variables для Worker

**Обязательно настроить в Cloudflare Dashboard:**

1. Перейдите:
   [Worker Settings](https://dash.cloudflare.com/704015f3ab3baf13d815b254aee29972/workers/services/view/markirovka/production/settings)
2. Раздел **Variables and Secrets**
3. Добавьте переменные:

| Имя                 | Значение                           | Описание             |
| ------------------- | ---------------------------------- | -------------------- |
| `SUPABASE_URL`      | `https://your-project.supabase.co` | URL Supabase проекта |
| `SUPABASE_ANON_KEY` | `eyJhbG...`                        | Публичный anon ключ  |

**Через CLI:**

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

**Frontend (.env для разработки):**

```env
VITE_WORKER_BASE_URL=https://markirovka.sherhan1988hp.workers.dev
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 🛠️ Настройка R2 Storage

R2 уже привязан через `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "markirovka-storage"
```

**Проверка R2:**

```bash
wrangler r2 bucket list
wrangler r2 object list markirovka-storage
```

### 📍 API Эндпоинты Worker

| Эндпоинт               | Метод | Описание                      |
| ---------------------- | ----- | ----------------------------- |
| `/health`              | GET   | Проверка работы Worker        |
| `/version`             | GET   | Информация о версии и коммите |
| `/api/health/supabase` | GET   | Статус подключения к Supabase |
| `/api/health/r2`       | GET   | Статус R2 Storage             |
| `/api/r2/upload`       | POST  | Загрузка файлов в R2          |
| `/api/r2/file?key=...` | GET   | Получение файла из R2         |

**Тестирование:**

```bash
# Worker health
curl https://markirovka.sherhan1988hp.workers.dev/health

# Версия
curl https://markirovka.sherhan1988hp.workers.dev/version

# Supabase status
curl https://markirovka.sherhan1988hp.workers.dev/api/health/supabase

# R2 status
curl https://markirovka.sherhan1988hp.workers.dev/api/health/r2
```

### 🚀 GitHub Actions CI/CD

Автоматический деплой настроен через `.github/workflows/ci.yml`:

1. ✅ Тесты (Vitest)
2. ✅ Линтинг (ESLint)
3. ✅ Типизация (TypeScript)
4. ✅ Сборка (Vite)
5. ✅ Деплой на Cloudflare Workers

**GitHub Secrets для CI:**

- `CLOUDFLARE_API_TOKEN` - API токен для деплоя
- `CLOUDFLARE_ACCOUNT_ID` - ID аккаунта (704015f3ab3baf13d815b254aee29972)

### Troubleshooting

#### Common Issues:

1. **Submodule errors**: ✅ Fixed (nested git repository removed)
2. **Build failures**: Check Node.js version and environment variables
3. **Missing dependencies**: Ensure package.json is complete

#### Build Logs to Check:

- Node.js version
- npm install success
- TypeScript compilation
- Vite build process

### Performance Optimizations

- Automatic minification ✅
- Code splitting ✅
- Asset optimization ✅
- Gzip compression (automatic on Cloudflare)

## 📝 Custom Headers (Optional)

Create `public/_headers` file for security headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 🔄 Continuous Deployment

- Automatic deployments on `main` branch pushes ✅
- Preview deployments for pull requests ✅
- Build status integration with GitHub ✅
