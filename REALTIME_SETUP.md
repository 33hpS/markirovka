# Настройка Supabase Realtime - Пошаговая инструкция

**Дата:** 2025-10-08  
**Версия:** 1.0.1

## Что делает Realtime?

После настройки Realtime ваше приложение будет:

- ✅ Автоматически обновляться при изменениях в базе данных
- ✅ Синхронизировать данные между всеми открытыми вкладками
- ✅ Показывать изменения от других пользователей в реальном времени
- ✅ Работать без перезагрузки страницы

## Шаг 1: Применить SQL миграцию для Realtime

### 1.1 Откройте Supabase SQL Editor

1. Перейдите на https://supabase.com/dashboard/project/wjclhytzewfcalyyhbab
2. В левом меню выберите **SQL Editor** (иконка 🛠️)
3. Нажмите **"New query"** для создания нового запроса

### 1.2 Выполните миграцию

1. Откройте файл `d:\Этикетка\supabase\migrations\002_realtime_setup.sql`
2. Скопируйте **ВСЁ** содержимое файла (Ctrl+A, Ctrl+C)
3. Вставьте в SQL Editor в Supabase (Ctrl+V)
4. Нажмите кнопку **"Run"** (или Ctrl+Enter)

⏱️ Выполнение займет 3-5 секунд

### 1.3 Проверьте результат

Выполните проверочный запрос:

```sql
-- Проверка что realtime включен для таблиц
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

Вы должны увидеть:

```
categories
label_templates
products
batches
production_logs
```

## Шаг 2: Получить Supabase API ключи

### 2.1 Откройте настройки API

1. В Supabase Dashboard перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: https://wjclhytzewfcalyyhbab.supabase.co)
   - **anon / public** key (длинная строка, начинается с `eyJ...`)

⚠️ **Внимание:** Не путайте с **service_role** ключом! Нужен именно **anon** ключ.

## Шаг 3: Настроить переменные окружения

### Вариант A: Локальная разработка

Создайте файл `.env` в корне проекта (`d:\Этикетка\.env`):

```env
VITE_SUPABASE_URL=https://wjclhytzewfcalyyhbab.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_key_здесь
```

### Вариант B: Production (Cloudflare Workers)

**Через CLI:**

```bash
cd "d:\Этикетка"
wrangler secret put VITE_SUPABASE_URL
# Вставьте: https://wjclhytzewfcalyyhbab.supabase.co

wrangler secret put VITE_SUPABASE_ANON_KEY
# Вставьте ваш anon key
```

**Через Cloudflare Dashboard:**

1. Откройте https://dash.cloudflare.com
2. Workers & Pages → **markirovka** → **Settings** → **Variables**
3. Добавьте Environment Variables:
   - Name: `VITE_SUPABASE_URL`, Value: `https://wjclhytzewfcalyyhbab.supabase.co`
   - Name: `VITE_SUPABASE_ANON_KEY`, Value: `ваш_ключ`
4. Нажмите **Save**

## Шаг 4: Собрать и задеплоить приложение

```bash
cd "d:\Этикетка"

# Сборка
npm run build

# Деплой
wrangler deploy
```

## Шаг 5: Проверить работу Realtime

### 5.1 Откройте приложение

```
https://markirovka.sherhan1988hp.workers.dev/products
```

### 5.2 Проверьте индикатор подключения

В правом верхнем углу должна появиться зеленая точка с надписью **"Синхронизация"**:

```
🟢 Синхронизация
```

Если точка появилась - **Realtime работает!** ✅

### 5.3 Проверьте синхронизацию

**Тест 1: Синхронизация между вкладками**

1. Откройте приложение в **двух** разных вкладках браузера
2. В первой вкладке: Нажмите "Управление категориями"
3. Добавьте новую категорию (например, "Напитки")
4. Сохраните
5. Переключитесь на вторую вкладку
6. **Категория должна появиться автоматически без перезагрузки!**

**Тест 2: Синхронизация шаблонов**

1. Откройте `/designer` в двух вкладках
2. В первой вкладке дублируйте шаблон
3. Во второй вкладке шаблон должен появиться автоматически

**Тест 3: SQL триггеры**

Откройте SQL Editor в Supabase и выполните:

```sql
-- Добавить категорию напрямую через SQL
INSERT INTO categories (code, name, description)
VALUES ('99', 'SQL Тест', 'Создано через SQL');

-- Проверьте приложение - категория появится мгновенно!
```

## Устранение проблем

### Проблема: Зеленая точка не появляется

**Решение 1:** Проверьте консоль браузера (F12 → Console)

Если видите ошибки типа:

```
Failed to connect to WebSocket
Invalid Supabase Key
```

Проверьте:

1. Правильность `VITE_SUPABASE_ANON_KEY`
2. Что файл `.env` создан в корне проекта
3. Что вы пересобрали приложение после создания `.env`

**Решение 2:** Проверьте что миграция 002 применена

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%broadcast%';
```

Должны увидеть:

- broadcast_category_change
- broadcast_template_change
- broadcast_product_change
- broadcast_message

**Решение 3:** Проверьте RLS политики

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Должны быть политики для SELECT на categories, products, label_templates.

### Проблема: Realtime работает локально, но не в production

Убедитесь что переменные установлены в Cloudflare:

1. Откройте https://dash.cloudflare.com
2. Workers & Pages → markirovka → Settings → Variables
3. Должны быть:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Если нет - добавьте через Dashboard или CLI (Шаг 3, Вариант B).

### Проблема: "Permission denied" при обновлении

Проверьте RLS политики:

```sql
-- Временно отключить RLS для тестирования
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Если заработало, значит проблема в RLS политиках
-- Создайте правильную политику:
CREATE POLICY "Enable all for authenticated users"
  ON categories FOR ALL
  USING (true);

-- Включите RLS обратно
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
```

## Архитектура Realtime

```
┌─────────────┐
│  Browser 1  │──┐
└─────────────┘  │
                 │  WebSocket
┌─────────────┐  │  Connection
│  Browser 2  │──┼───────────────► ┌──────────────┐
└─────────────┘  │                  │   Supabase   │
                 │                  │   Realtime   │
┌─────────────┐  │                  └──────────────┘
│  Browser 3  │──┘                         │
└─────────────┘                            │
                                           │
                              ┌────────────▼─────────┐
                              │  PostgreSQL Database │
                              │  + pg_notify         │
                              └──────────────────────┘
```

### Как это работает:

1. **Пользователь** делает изменение (добавляет категорию)
2. **API Worker** сохраняет в Supabase
3. **PostgreSQL триггер** вызывает `pg_notify`
4. **Supabase Realtime** получает уведомление
5. **WebSocket** отправляет всем подключенным клиентам
6. **React Hook** (`useRealtimeSync`) получает событие
7. **Компонент** автоматически перезагружает данные

## Мониторинг Realtime

### Проверка активных подключений

```sql
SELECT
  usename,
  application_name,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'postgres'
AND application_name LIKE '%realtime%';
```

### Проверка отправленных уведомлений

```sql
-- Отправить тестовое уведомление
SELECT broadcast_message(
  'test_channel',
  'test_event',
  '{"message": "Hello Realtime!"}'::jsonb
);
```

### Логи в консоли браузера

Откройте DevTools (F12) → Console, вы должны видеть:

```
[Supabase] Realtime connection established
[Supabase] Subscribed to categories_changes
[Supabase] Received INSERT event for categories
```

## Дополнительные возможности

### Broadcast сообщения

Отправка произвольных сообщений между клиентами:

```typescript
import { sendBroadcast } from '../services/realtimeService';

// Отправить сообщение
await sendBroadcast('chat', 'new_message', {
  user: 'User1',
  text: 'Привет!',
});
```

### Presence (Онлайн пользователи)

Отслеживание кто онлайн:

```typescript
import { subscribeToPresence } from '../services/realtimeService';

subscribeToPresence(
  'lobby',
  { user_id: '123', username: 'John', online_at: new Date().toISOString() },
  user => console.log('Пользователь зашел:', user),
  user => console.log('Пользователь вышел:', user),
  users => console.log('Всего онлайн:', users.length)
);
```

## Следующие шаги

После успешной настройки Realtime:

1. ✅ Realtime работает для категорий и шаблонов
2. ⏳ Добавить realtime для продуктов (аналогично)
3. ⏳ Добавить realtime для партий производства
4. ⏳ Добавить уведомления о новых событиях
5. ⏳ Добавить индикатор "кто онлайн"

---

**Полезные ссылки:**

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Dashboard](https://supabase.com/dashboard/project/wjclhytzewfcalyyhbab)
- [Cloudflare Workers](https://dash.cloudflare.com)

**Поддержка:** Если что-то не работает, проверьте:

1. Консоль браузера (F12)
2. Supabase Dashboard → Logs
3. Cloudflare Workers → Logs
