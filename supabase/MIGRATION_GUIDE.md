# Инструкция по применению миграции базы данных Supabase

## Быстрый старт

### Шаг 1: Открыть Supabase SQL Editor

1. Перейдите на https://supabase.com/dashboard/project/wjclhytzewfcalyyhbab
2. В левом меню выберите "SQL Editor" (иконка 🛠️)
3. Нажмите "New query" для создания нового запроса

### Шаг 2: Выполнить миграцию

1. Откройте файл `supabase/migrations/001_initial_schema.sql`
2. Скопируйте ВСЁ содержимое файла (Ctrl+A, Ctrl+C)
3. Вставьте в SQL Editor в Supabase (Ctrl+V)
4. Нажмите кнопку "Run" (или Ctrl+Enter)

⏱️ Выполнение займет 2-3 секунды

### Шаг 3: Проверить результат

Выполните проверочный запрос:

```sql
-- Проверка таблиц
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Проверка категорий
SELECT * FROM categories;

-- Проверка шаблонов
SELECT * FROM label_templates;
```

Вы должны увидеть:

- ✅ 5 таблиц: categories, products, label_templates, batches, production_logs
- ✅ 6 стандартных категорий (коды 01-06)
- ✅ 2 базовых шаблона этикеток (dairy, bakery)

## Что создает миграция?

### Таблицы

1. **categories** - Категории продуктов
   - Поля: id (UUID), code (уникальный), name, description
   - Включает 6 стандартных категорий

2. **products** - Товары
   - Поля: id, name, sku, category_id (FK), barcode, qr_data, price, unit, description, metadata
     (JSONB)
   - Связь с categories через category_id

3. **label_templates** - Шаблоны этикеток
   - Поля: id, name, category, description, width, height, elements (JSONB), is_default
   - 2 готовых шаблона: молочная продукция и хлебобулочные

4. **batches** - Партии производства
   - Поля: id, batch_number, product_id (FK), quantity, manufactured_date, expiry_date, status

5. **production_logs** - Журнал производства
   - Поля: id, batch_id (FK), product_id (FK), action, quantity, operator, notes

### Функции и триггеры

- **update_updated_at_column()** - Функция автоматического обновления timestamp
- Триггеры на все таблицы для автообновления поля `updated_at`

### Row Level Security (RLS)

- Включен для всех таблиц
- Политика: полный доступ для аутентифицированных пользователей
- Можно настроить более строгие правила позже

### Индексы

Созданы индексы для оптимизации запросов:

- products: category_id, sku
- batches: product_id, status
- production_logs: batch_id, created_at

## После применения миграции

### 1. Проверка работы приложения

Откройте приложение:

```
https://markirovka.sherhan1988hp.workers.dev
```

Перейдите в раздел "Товары" (Products):

- Должна появиться надпись "Загрузка данных из базы..."
- После загрузки должны отобразиться категории из Supabase
- При первом запуске автоматически выполнится миграция данных из localStorage

### 2. Проверка синхронизации

Откройте приложение в двух разных вкладках:

1. В первой вкладке добавьте новую категорию
2. Во второй вкладке обновите страницу
3. Новая категория должна появиться во второй вкладке

✅ Это означает, что синхронизация работает!

### 3. Проверка Designer (шаблоны этикеток)

Перейдите в раздел "Дизайнер" (Designer):

- Должна появиться надпись "Загрузка шаблонов..."
- После загрузки должны отобразиться 2 базовых шаблона
- Попробуйте дублировать шаблон - копия должна сохраниться в базе

## Устранение проблем

### Ошибка: "permission denied"

Проверьте политики RLS:

```sql
-- Временно отключить RLS для тестирования
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Ошибка: "relation already exists"

Таблицы уже созданы. Удалите старые таблицы:

```sql
DROP TABLE IF EXISTS production_logs CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS label_templates CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
```

Затем повторите миграцию.

### Приложение не загружает данные

1. Проверьте переменные окружения в `wrangler.toml`:

   ```toml
   [vars]
   SUPABASE_URL = "https://wjclhytzewfcalyyhbab.supabase.co"
   SUPABASE_ANON_KEY = "ваш_ключ"
   ```

2. Проверьте endpoint здоровья:

   ```
   https://markirovka.sherhan1988hp.workers.dev/api/health/supabase
   ```

   Должен вернуть: `{"connected": true, "message": "База данных активна"}`

3. Проверьте API категорий напрямую:
   ```
   https://markirovka.sherhan1988hp.workers.dev/api/categories
   ```
   Должен вернуть массив категорий в JSON формате

## Полезные SQL команды

```sql
-- Посмотреть все категории
SELECT * FROM categories ORDER BY code;

-- Посмотреть все шаблоны
SELECT id, name, category, is_default FROM label_templates;

-- Посмотреть количество записей в каждой таблице
SELECT
    'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'label_templates', COUNT(*) FROM label_templates
UNION ALL
SELECT 'batches', COUNT(*) FROM batches
UNION ALL
SELECT 'production_logs', COUNT(*) FROM production_logs;

-- Очистить все данные (кроме категорий и шаблонов)
DELETE FROM production_logs;
DELETE FROM batches;
DELETE FROM products WHERE id NOT IN (SELECT id FROM products LIMIT 0);
```

## Следующие шаги

После успешного применения миграции:

1. ✅ База данных настроена
2. ✅ Приложение подключено к Supabase
3. ✅ Данные синхронизируются
4. ⏳ Можно добавлять новые функции (управление продуктами, партиями и т.д.)

---

**Версия приложения:** 1.0.0  
**Версия деплоя:** a628648e-2c3e-4bb5-8c77-545e408905a2  
**Дата:** 2025-10-08
