# 🚀 Быстрый старт - Markirovka

## ✅ Что уже готово (проверено)

- ✅ **Cloudflare Worker** - работает на https://markirovka.sherhan1988hp.workers.dev
- ✅ **R2 Storage API** - загрузка и скачивание файлов работает
- ✅ **Переменные окружения** - .env.local настроен с реальными credentials
- ⚠️ **Supabase** - подключение настроено, но **требуется инициализация БД**

## 📋 Что нужно сделать

### 1️⃣ Инициализация базы данных Supabase (ОБЯЗАТЕЛЬНО)

**Это самый важный шаг!** Без него приложение не заработает.

#### Способ А: Через Supabase Dashboard (рекомендуется)

1. Откройте https://supabase.com/dashboard/project/wjclhytzewfcalyybhab
2. В левом меню нажмите **SQL Editor**
3. Нажмите **New Query**
4. Скопируйте весь код из файла `database/schema.sql`
5. Вставьте в редактор и нажмите **Run** (или F5)
6. Дождитесь сообщения "Success. No rows returned"

#### Способ Б: Через командную строку

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Загрузите схему (замените PROJECT_REF на wjclhytzewfcalyybhab)
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.wjclhytzewfcalyybhab.supabase.co:5432/postgres"
```

### 2️⃣ Настройка аутентификации Supabase (обязательно)

⚠️ **Важно:** Приложение использует реальную Supabase аутентификацию. Mock данные удалены.

1. Откройте https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/auth/providers
2. Включите провайдер **Email** (вкладка Email Auth)
3. В настройках укажите:
   - **Site URL**: `https://markirovka.sherhan1988hp.workers.dev`
   - **Redirect URLs**: добавьте `https://markirovka.sherhan1988hp.workers.dev/dashboard`

4. Создайте пользователей:
   - Перейдите в **Authentication → Users**
   - Нажмите **Add user → Create new user**

   **Рекомендуемые пользователи:**
   - Admin: `admin@markirovka.ru` / `admin123` (роль: admin)
   - Manager: `manager@markirovka.ru` / `manager123` (роль: manager)
   - Worker: `worker@markirovka.ru` / `worker123` (роль: worker)

5. Установите роли в user_metadata:
   - Откройте пользователя → Raw user meta data
   - Добавьте JSON:
   ```json
   {
     "firstName": "Имя",
     "lastName": "Фамилия",
     "role": "admin",
     "permissions": ["users.manage", "system.config", "audit.view"]
   }
   ```

### 3️⃣ Проверка подключения

```bash
npm run test:connections
```

**Ожидаемый результат:**

```
✓ Worker is healthy
✓ Supabase connected: https://wjclhytzewfcalyybhab.supabase.co
✓ File uploaded: test/xxxxx.txt
✓ File download verified

  worker               PASS
  supabase             PASS  ← После инициализации БД должно быть PASS
  r2                   PASS
```

### 4️⃣ Запуск приложения

```bash
# Режим разработки
npm run dev

# Откройте http://localhost:5173
```

**Учетные данные:**

Используйте пользователей, созданных в Supabase Dashboard (шаг 2️⃣)

- Manager: `manager` / `manager123`
- Worker: `worker` / `worker123`

### 5️⃣ Деплой изменений (если нужно)

```bash
# Сборка и деплой Worker
npm run build
npm run deploy:worker

# Проверка версии
curl https://markirovka.sherhan1988hp.workers.dev/version
```

---

## 🔧 Структура проекта

```
markirovka/
├── .env.local              ← Реальные credentials (НЕ коммитить!)
├── .env.example            ← Шаблон переменных окружения
├── database/
│   └── schema.sql          ← SQL скрипт инициализации БД
├── scripts/
│   ├── test-connections.mjs ← Скрипт проверки подключений
│   └── deploy-worker.mjs    ← Скрипт деплоя Worker
├── src/
│   ├── config/
│   │   └── config.ts        ← Конфигурация (читает .env)
│   ├── services/
│   │   ├── dataService.ts   ← Работа с данными
│   │   ├── supabaseService.ts ← Supabase интеграция
│   │   └── r2Service.ts     ← R2 интеграция
│   └── contexts/
│       └── AuthContext.tsx  ← Supabase аутентификация
└── worker.js               ← Cloudflare Worker (R2 API)
```

---

## 📊 Текущий статус системы

| Компонент         | Статус           | URL/Endpoint                                 |
| ----------------- | ---------------- | -------------------------------------------- |
| Cloudflare Worker | ✅ Работает      | https://markirovka.sherhan1988hp.workers.dev |
| R2 Upload API     | ✅ Работает      | POST /api/r2/upload                          |
| R2 Download API   | ✅ Работает      | GET /api/r2/file?key=...                     |
| Supabase Database | ⚠️ Требует init  | https://wjclhytzewfcalyybhab.supabase.co     |
| Environment       | ✅ Настроен      | .env.local                                   |
| Authentication    | ✅ Supabase Auth | Реальная аутентификация (моки удалены)       |

---

## ⚡ Быстрые команды

```bash
# Проверка всех подключений
npm run test:connections

# Разработка
npm run dev

# Сборка
npm run build

# Деплой Worker
npm run deploy:worker

# Линтинг и форматирование
npm run lint
npm run format

# Тесты
npm test
```

---

## 🆘 Что делать если не работает?

### ❌ Supabase: "column 'category' does not exist"

Это означает что таблица создана из старой версии схемы.

➡️ **Быстрое решение:**

```sql
ALTER TABLE templates ADD COLUMN category TEXT NOT NULL DEFAULT 'Универсальная';
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
```

➡️ **Или используйте:** `database/schema_universal.sql` (безопасен для повторного выполнения)

➡️ **Подробнее:** См. `database/FIX_CATEGORY_ERROR.md`

### ❌ Supabase: "Could not find the table"

➡️ **Решение:** Выполните `database/schema_universal.sql` в SQL Editor (рекомендуется вместо
schema.sql)

### ❌ R2: "R2 binding is not configured"

➡️ **Решение:** Проверьте `wrangler.toml` - должна быть секция `[[r2_buckets]]`

### ❌ Worker: "fetch failed"

➡️ **Решение:** Сделайте редеплой: `npm run deploy:worker`

### ❌ .env переменные не загружаются

➡️ **Решение:** Убедитесь что `.env.local` существует и содержит все переменные из `.env.example`

### ❌ Ошибка CORS при загрузке в R2

➡️ **Решение:** Worker уже настроен с CORS headers, но проверьте что используете `/api/r2/upload`
(не прямой доступ к R2)

---

## 📞 Поддержка

Если что-то не работает:

1. Проверьте `npm run test:connections`
2. Посмотрите логи Worker: https://dash.cloudflare.com/
3. Проверьте Supabase Dashboard: https://supabase.com/dashboard/project/wjclhytzewfcalyybhab
4. Откройте Issues: https://github.com/33hpS/markirovka/issues

---

**Следующий шаг:** Выполните инициализацию базы данных (шаг 1️⃣) и запустите
`npm run test:connections` для проверки! 🎉
