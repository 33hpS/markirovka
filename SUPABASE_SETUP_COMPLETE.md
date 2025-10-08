# ✅ Supabase Setup Complete

## 📝 Конфигурация завершена

Дата: 8 октября 2025

### 🔐 Настроенные параметры

#### Supabase Project

- **URL**: `https://wjclhytzewfcalyybhab.supabase.co`
- **Project Ref**: `wjclhytzewfcalyybhab`

#### Ключи API

- ✅ **Anon/Public Key** - настроен (для frontend)
- ✅ **Service Role Key** - получен (для backend операций)

---

## 🌍 Где настроено

### 1. Локальная разработка (.env.local)

```bash
VITE_SUPABASE_URL=https://wjclhytzewfcalyybhab.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ Файл `.env.local` настроен и готов к работе

### 2. Cloudflare Workers (Production)

```bash
# Секреты настроены через wrangler
wrangler secret put SUPABASE_URL ✅
wrangler secret put SUPABASE_ANON_KEY ✅
```

Проверить секреты можно в
[Cloudflare Dashboard](https://dash.cloudflare.com/704015f3ab3baf13d815b254aee29972/workers/services/view/markirovka/production/settings)

### 3. GitHub Actions CI/CD

Деплой автоматически использует секреты из Cloudflare Workers.

---

## 🚀 Проверка работы

### Локально

```bash
npm run dev
# Откройте: http://localhost:3000
```

### Production

```bash
# Health check
curl https://markirovka.sherhan1988hp.workers.dev/health

# Версия
curl https://markirovka.sherhan1988hp.workers.dev/version

# Supabase connection status
curl https://markirovka.sherhan1988hp.workers.dev/api/health/supabase
```

---

## 📊 Следующие шаги

### 1. Создать пользователей в Supabase

Перейдите в
[Supabase Dashboard](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/auth/users)

**Authentication → Users → Create New User**

Создайте пользователей с `user_metadata`:

```json
{
  "role": "admin",
  "permissions": {
    "products": { "read": true, "write": true },
    "templates": { "read": true, "write": true },
    "printing": { "read": true, "write": true },
    "users": { "read": true, "write": true },
    "reports": { "read": true, "write": true }
  },
  "displayName": "Администратор"
}
```

**Роли:**

- `admin` - полный доступ
- `operator` - только печать этикеток
- `manager` - управление продуктами и шаблонами
- `viewer` - только просмотр

### 2. Настроить базу данных

Выполните SQL миграцию из `database/schema.sql`:

```sql
-- Создание таблиц
CREATE TABLE products (...);
CREATE TABLE templates (...);
CREATE TABLE print_jobs (...);
-- и т.д.
```

Перейдите в [SQL Editor](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql/new)

### 3. Настроить Row Level Security (RLS)

Включите RLS для всех таблиц и создайте политики доступа.

### 4. Проверить Realtime

Включите Realtime для таблиц:

- `products`
- `templates`
- `print_jobs`

---

## 🔒 Безопасность

### ⚠️ Service Role Key

**НЕ ИСПОЛЬЗУЙТЕ** service role key на frontend!

Service role key обходит все правила RLS и предоставляет полный доступ к базе данных.

Используйте его **только** для:

- Backend операций
- Миграций базы данных
- Административных скриптов

### ✅ Anon/Public Key

Безопасен для использования на frontend. Доступ ограничен правилами RLS.

---

## 📚 Дополнительная документация

- [AUTH_README.md](./AUTH_README.md) - Система авторизации
- [README-DATABASE.md](./README-DATABASE.md) - Настройка базы данных
- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Интеграция с Supabase
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Деплой на Cloudflare

---

## ✅ Статус настройки

- [x] Получены ключи Supabase API
- [x] Настроен `.env.local` для локальной разработки
- [x] Настроены секреты в Cloudflare Workers
- [x] Задеплоено на production
- [x] Dev сервер запущен и работает
- [ ] Созданы пользователи в Supabase Auth
- [ ] Выполнены SQL миграции
- [ ] Настроен Row Level Security
- [ ] Включен Realtime для таблиц

---

## 🆘 Troubleshooting

### Проблема: "Supabase client not available"

**Решение**: Проверьте `.env.local` и убедитесь, что переменные `VITE_SUPABASE_URL` и
`VITE_SUPABASE_ANON_KEY` заполнены.

### Проблема: "Invalid JWT token"

**Решение**: Проверьте, что используете правильный anon key, а не service role key на frontend.

### Проблема: "Row Level Security policy violation"

**Решение**: Настройте RLS политики для таблиц или временно отключите RLS для тестирования.

---

**Последнее обновление**: 8 октября 2025  
**Версия**: 1.0.0  
**Коммит**: 4d5b13e6
