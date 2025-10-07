# Исправление ошибки "column sku does not exist"

## Проблема

Ошибка `ERROR: 42703: column "sku" does not exist` означает, что в базе данных Supabase таблица
`products` не содержит колонку `sku`, или таблица создана с другой структурой.

## Решение

### Шаг 1: Выполнить SQL скрипт исправления

1. Открыть Supabase Dashboard: https://supabase.com/dashboard/project/fpgzozsspaipegxcfzug
2. Перейти в **SQL Editor**
3. Скопировать и выполнить содержимое файла `database/fix-schema.sql`

Этот скрипт:

- ✅ Проверит существование таблицы и колонок
- ✅ Добавит недостающие колонки если их нет
- ✅ Создаст правильную структуру таблиц
- ✅ Вставит тестовые данные
- ✅ Настроит индексы и триггеры

### Шаг 2: Проверить структуру таблицы

После выполнения скрипта вы увидите:

```
column_name    | data_type | is_nullable | column_default
id            | uuid      | NO          | gen_random_uuid()
name          | text      | NO          |
sku           | text      | NO          |
category      | text      | NO          |
description   | text      | YES         |
price         | numeric   | YES         |
...
```

### Шаг 3: Тестировать подключение

1. Запустить приложение: `npm run dev`
2. Открыть `/products-test`
3. Проверить статус подключения - должно быть ✅
4. Создать тестовый товар

## Если ошибка повторяется

### Вариант 1: Полное пересоздание таблицы

```sql
-- В Supabase SQL Editor
DROP TABLE IF EXISTS print_jobs;
DROP TABLE IF EXISTS products;

-- Затем выполнить database/fix-schema.sql
```

### Вариант 2: Проверить RLS политики

```sql
-- Отключить RLS временно для тестирования
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Вариант 3: Проверить подключение

В браузерной консоли (DevTools):

```javascript
// Проверить подключение к Supabase
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'https://fpgzozsspaipegxcfzug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZ3pvenNzcGFpcGVneGNmenVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTYxNDYsImV4cCI6MjA2OTczMjE0Nn0.BNvvF-GjQ4I6Q2O9A4haE4uB_8u6TzmtRytHI-WBIaU'
);

// Проверить таблицу
const { data, error } = await supabase.from('products').select('*').limit(1);
console.log('Test result:', { data, error });
```

## Структура таблицы products (правильная)

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                -- ✅ Название товара
  sku TEXT UNIQUE NOT NULL,          -- ✅ Артикул (должен быть!)
  category TEXT NOT NULL,            -- ✅ Категория
  description TEXT,                  -- Описание (опционально)
  price DECIMAL(10,2),              -- Цена (опционально)
  manufacturer TEXT,                 -- Производитель (опционально)
  weight TEXT,                       -- Вес (опционально)
  dimensions TEXT,                   -- Размеры (опционально)
  expiration_days INTEGER,           -- Срок годности (опционально)
  barcode TEXT,                      -- Штрих-код (генерируется автоматически)
  qr_data TEXT,                      -- QR-код (генерируется автоматически)
  status TEXT DEFAULT 'active',      -- Статус товара
  stock INTEGER DEFAULT 0,           -- Остаток на складе
  min_stock INTEGER DEFAULT 0,       -- Минимальный остаток
  image_url TEXT,                    -- URL изображения
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Проверка после исправления

После выполнения `database/fix-schema.sql` должно появиться:

- ✅ 3 товара в таблице products
- ✅ 2 шаблона в таблице templates
- ✅ 1 задание печати в таблице print_jobs
- ✅ Все необходимые индексы и триггеры

Откройте `/products-test` и проверьте статус подключения!
