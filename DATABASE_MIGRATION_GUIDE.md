# 🗄️ Database Migration Guide

## Быстрая инструкция по применению миграций

### 📝 Что было исправлено

Обе миграции теперь **идемпотентны** - их можно запускать несколько раз без ошибок дублирования.

**Миграция 001_initial_schema.sql:**

- ✅ Добавлены `DROP TRIGGER IF EXISTS` перед созданием триггеров
- ✅ Добавлены `DROP POLICY IF EXISTS` перед созданием политик
- ✅ Уже используются `CREATE TABLE IF NOT EXISTS`
- ✅ Уже используется `INSERT ... ON CONFLICT DO NOTHING`

**Миграция 002_realtime_setup.sql:**

- ✅ Добавлена проверка и удаление таблиц из publication перед добавлением
- ✅ Используются `DROP TRIGGER IF EXISTS` для broadcast триггеров
- ✅ Используются `DROP POLICY IF EXISTS` для realtime политик

**Коммиты:**

- `df8f4624` - fix: make database migration idempotent with DROP IF EXISTS
- `6878ba60` - fix: make realtime migration idempotent with DROP TABLE IF EXISTS

---

## 🚀 Применение миграции

### Вариант 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте [SQL Editor](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql/new)

2. **Сначала** скопируйте содержимое файла `supabase/migrations/001_initial_schema.sql`

3. Вставьте в SQL Editor и нажмите **Run**

4. Проверьте результат - должно быть успешно без ошибок

5. **Затем** скопируйте содержимое файла `supabase/migrations/002_realtime_setup.sql`

6. Вставьте в SQL Editor и нажмите **Run**

7. Проверьте результат - должно быть успешно без ошибок

### Вариант 2: Через Supabase CLI

```bash
# Установите Supabase CLI если ещё не установлен
npm install -g supabase

# Авторизуйтесь
supabase login

# Подключитесь к проекту
supabase link --project-ref wjclhytzewfcalyybhab

# Примените все миграции
supabase db push

# Или запустите миграции по отдельности
supabase db execute -f supabase/migrations/001_initial_schema.sql
supabase db execute -f supabase/migrations/002_realtime_setup.sql
```

### Вариант 3: Через psql

```bash
# Получите Database URL из Supabase Dashboard
# Settings → Database → Connection String → URI

psql "postgresql://postgres:[YOUR-PASSWORD]@db.wjclhytzewfcalyybhab.supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql

psql "postgresql://postgres:[YOUR-PASSWORD]@db.wjclhytzewfcalyybhab.supabase.co:5432/postgres" \
  -f supabase/migrations/002_realtime_setup.sql
```

---

## 📊 Что создают миграции

### 001_initial_schema.sql

**Таблицы:**

- ✅ `categories` - Категории продуктов (6 стандартных категорий)
- ✅ `products` - Продукты
- ✅ `label_templates` - Шаблоны этикеток (2 базовых шаблона)
- ✅ `batches` - Партии производства
- ✅ `production_logs` - Журнал производства

**Индексы:**

- ✅ `idx_products_category` - для поиска по категориям
- ✅ `idx_products_sku` - для поиска по SKU
- ✅ `idx_batches_product` - для партий по продуктам
- ✅ `idx_batches_status` - для фильтрации по статусу
- ✅ `idx_production_logs_batch` - для логов по партиям
- ✅ `idx_production_logs_created` - для сортировки по дате

**Триггеры:**

- ✅ Автоматическое обновление `updated_at` для всех таблиц

**Row Level Security:**

- ✅ RLS включен для всех таблиц
- ✅ Базовые политики: разрешить всё аутентифицированным пользователям

**Начальные данные:**

- ✅ 6 категорий продуктов
- ✅ 2 базовых шаблона этикеток

### 002_realtime_setup.sql

**Realtime Publication:**

- ✅ Включена публикация для всех таблиц в `supabase_realtime`

**Broadcast триггеры:**

- ✅ `broadcast_category_change()` - уведомления об изменениях категорий
- ✅ `broadcast_template_change()` - уведомления об изменениях шаблонов
- ✅ `broadcast_product_change()` - уведомления об изменениях продуктов

**Broadcast функции:**

- ✅ `broadcast_message()` - универсальная функция для отправки сообщений

**Realtime политики:**

- ✅ Политики для чтения изменений в реальном времени

---

## ✅ Проверка после применения

### 1. Проверьте таблицы

```sql
-- Список всех таблиц
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Должны быть:

- batches
- categories
- label_templates
- production_logs
- products

### 2. Проверьте категории

```sql
SELECT * FROM categories ORDER BY code;
```

Должно быть 6 категорий (01-06).

### 3. Проверьте шаблоны

```sql
SELECT id, name, category, is_default FROM label_templates;
```

Должно быть 2 базовых шаблона.

### 4. Проверьте RLS

```sql
-- Проверка что RLS включен
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Все таблицы должны иметь `rowsecurity = true`.

### 5. Проверьте триггеры

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Должно быть 4 триггера `update_*_updated_at`.

---

## 🔧 Troubleshooting

### Ошибка: "trigger already exists"

**Решение:** Миграция уже исправлена, используйте последнюю версию из коммита `df8f4624`.

### Ошибка: "relation already exists"

**Решение:** Миграция идемпотентна, можно запускать повторно. Или очистите базу:

```sql
-- ВНИМАНИЕ: Удаляет все данные!
DROP TABLE IF EXISTS production_logs CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS label_templates CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Затем запустите миграцию заново.

### Ошибка: "permission denied"

**Решение:** Убедитесь что используете правильный database password или service_role key.

---

## 📚 Следующие шаги после миграции

1. **Создать пользователей** в Supabase Auth
   - Dashboard → Authentication → Users → Create New User

2. **Настроить детальные RLS политики** (опционально)
   - Сейчас: разрешено всё аутентифицированным
   - Можно ограничить на основе ролей в `user_metadata`

3. **Включить Realtime** для таблиц
   - Dashboard → Database → Replication
   - Включить для: products, label_templates, batches

4. **Добавить тестовые данные** (опционально)

```sql
-- Пример добавления продукта
INSERT INTO products (name, sku, category_id, barcode, price, unit, description)
VALUES (
    'Молоко 3.2%',
    'MILK-001',
    (SELECT id FROM categories WHERE code = '01'),
    '4600000000001',
    79.90,
    '1 л',
    'Натуральное пастеризованное молоко'
);
```

---

## 🔗 Полезные ссылки

- [Supabase Dashboard](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab)
- [SQL Editor](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql/new)
- [Database Tables](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/database/tables)
- [Authentication](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/auth/users)
- [Replication](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/database/replication)

---

**Файл миграции:** `supabase/migrations/001_initial_schema.sql`  
**Последнее обновление:** 8 октября 2025  
**Статус:** ✅ Ready to apply  
**Идемпотентность:** ✅ Да
