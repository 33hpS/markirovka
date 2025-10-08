# ✅ Realtime Migration Fixed

## 🐛 Проблемы решены

**Ошибка 1:**

```
ERROR: 42710: relation "categories" is already member of publication "supabase_realtime"
```

**Ошибка 2:**

```
ERROR: 42601: syntax error at or near "EXISTS"
LINE 13: ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS categories;
```

**Решение:** Добавлена логика удаления таблиц из publication перед повторным добавлением через блок
`DO $$ ... END $$` с обработкой исключений. PostgreSQL не поддерживает `IF EXISTS` в
`ALTER PUBLICATION DROP TABLE`, поэтому используется `EXCEPTION WHEN OTHERS` для игнорирования
ошибок.

---

## 📝 Исправления в 002_realtime_setup.sql

### До:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
-- ... ошибка при повторном запуске
```

### После:

```sql
DO $$
BEGIN
  -- Удаляем таблицы из публикации если они уже есть
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE categories;
    -- Без IF EXISTS - не поддерживается в ALTER PUBLICATION
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  -- ... для всех таблиц
END $$;

-- Теперь безопасно добавляем
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
-- ... и т.д.
```

---

## 🚀 Как применить миграции

### Порядок применения:

1. **Сначала:** `001_initial_schema.sql` - создаёт таблицы, индексы, триггеры, RLS
2. **Затем:** `002_realtime_setup.sql` - настраивает Realtime и broadcast

### Через Supabase Dashboard:

1. Откройте [SQL Editor](https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql/new)

2. **Шаг 1:** Вставьте содержимое `001_initial_schema.sql` → Run

3. **Шаг 2:** Вставьте содержимое `002_realtime_setup.sql` → Run

4. ✅ Готово!

---

## 📊 Что настраивает Realtime миграция

### ✅ Realtime Publication

Все таблицы добавлены в `supabase_realtime`:

- `categories`
- `products`
- `label_templates`
- `batches`
- `production_logs`

### ✅ Broadcast Triggers

Автоматические уведомления при изменениях:

- `broadcast_category_change()` → канал `category_changes`
- `broadcast_product_change()` → канал `product_changes`
- `broadcast_template_change()` → канал `template_changes`

### ✅ Broadcast Function

Универсальная функция для отправки сообщений:

```sql
SELECT broadcast_message('my_channel', 'event_name', '{"data": "value"}'::jsonb);
```

### ✅ Realtime Policies

Политики для чтения изменений в реальном времени.

---

## 🔍 Проверка после применения

### 1. Проверить Realtime таблицы:

```sql
SELECT schemaname, tablename, 'Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

Должно вернуть 5 таблиц.

### 2. Проверить broadcast триггеры:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%broadcast%'
ORDER BY event_object_table;
```

Должно быть 3 триггера.

### 3. Проверить функции:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%broadcast%'
ORDER BY routine_name;
```

Должно быть 4 функции.

---

## 💡 Использование Realtime в приложении

### Подписка на изменения таблиц:

```typescript
import { supabase } from './supabaseClient';

// Подписка на изменения продуктов
const subscription = supabase
  .channel('products-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
    console.log('Product changed:', payload);
    // Обновить UI
  })
  .subscribe();
```

### Подписка на broadcast сообщения:

```typescript
// Подписка на custom broadcast канал
const subscription = supabase
  .channel('product_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
    console.log('Product broadcast:', payload);
  })
  .subscribe();
```

### Отправка broadcast сообщений:

```typescript
// Из приложения
const { error } = await supabase.rpc('broadcast_message', {
  channel_name: 'custom_channel',
  event_name: 'label_printed',
  payload: { productId: '123', quantity: 10 },
});
```

---

## 📚 Документация

- **Полный гайд:** [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md)
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **PostgreSQL NOTIFY/LISTEN:** https://www.postgresql.org/docs/current/sql-notify.html

---

## ✅ Статус

- [x] Миграция `001_initial_schema.sql` исправлена
- [x] Миграция `002_realtime_setup.sql` исправлена
- [x] Обе миграции идемпотентны
- [x] Документация обновлена
- [x] Коммиты запушены в GitHub

**Коммиты:**

- `df8f4624` - fix: make database migration idempotent
- `6878ba60` - fix: make realtime migration idempotent
- `fbf4ccac` - docs: update migration guide

---

**Последнее обновление:** 8 октября 2025, 22:39 MSK  
**Статус:** ✅ Ready to apply  
**Идемпотентность:** ✅ Обе миграции
