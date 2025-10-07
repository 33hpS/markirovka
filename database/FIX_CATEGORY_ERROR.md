# 🔧 Исправление ошибок с отсутствующими колонками

## Проблема

```
ERROR: 42703: column "category" does not exist
ERROR: 42703: column "is_active" does not exist
```

Это означает, что таблица `templates` была создана из старой версии схемы без некоторых полей.

---

## ✅ Решение (выберите один из вариантов)

### Вариант 1: Быстрое исправление (Миграция всех полей)

**Выполните этот скрипт в Supabase SQL Editor:**

```sql
-- Добавляем все отсутствующие поля
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'category') THEN
        ALTER TABLE templates ADD COLUMN category TEXT NOT NULL DEFAULT 'Универсальная';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'is_active') THEN
        ALTER TABLE templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'description') THEN
        ALTER TABLE templates ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'thumbnail') THEN
        ALTER TABLE templates ADD COLUMN thumbnail TEXT NOT NULL DEFAULT '📄';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'elements') THEN
        ALTER TABLE templates ADD COLUMN elements JSONB NOT NULL DEFAULT '[]';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'suitable_for') THEN
        ALTER TABLE templates ADD COLUMN suitable_for TEXT[] NOT NULL DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'version') THEN
        ALTER TABLE templates ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'author') THEN
        ALTER TABLE templates ADD COLUMN author TEXT NOT NULL DEFAULT 'System';
    END IF;
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
```

**Или используйте готовый файл:**

1. Откройте файл `database/migration_add_category.sql`
2. Скопируйте весь код
3. Выполните в Supabase SQL Editor

---

### Вариант 2: Универсальный скрипт (Рекомендуется)

**Этот скрипт безопасен для повторного выполнения:**

1. Откройте https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql
2. Выполните файл `database/schema_universal.sql`

Скрипт автоматически:

- ✅ Создаст отсутствующие таблицы
- ✅ Добавит недостающие колонки
- ✅ Обновит индексы и триггеры
- ✅ Не удалит существующие данные

---

### Вариант 3: Полная переустановка (если нет важных данных)

**⚠️ ВНИМАНИЕ: Это удалит все данные!**

```sql
-- 1. Удалить все таблицы
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS print_jobs CASCADE;
DROP TABLE IF EXISTS printers CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- 2. Выполнить database/schema_universal.sql
```

---

## 🧪 Проверка результата

После выполнения любого варианта, проверьте:

```sql
-- Должно вернуть "category"
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'templates'
AND column_name = 'category';

-- Проверка данных
SELECT id, name, category FROM templates LIMIT 5;
```

---

## 📋 Диагностика (если проблемы остались)

Выполните диагностический скрипт:

```bash
# В Supabase SQL Editor
```

Откройте файл `database/diagnostic_check.sql` и выполните его.

Он покажет:

- Какие таблицы существуют
- Какие колонки есть в каждой таблице
- Индексы
- RLS политики
- Количество записей

---

## 🚀 После исправления

```bash
# Проверьте подключение
npm run test:connections

# Должно показать:
# ✓ Worker is healthy
# ✓ Supabase connected
# ✓ R2 API working
```

---

## 📞 Если ничего не помогло

1. Экспортируйте результат диагностического скрипта
2. Проверьте версию PostgreSQL в Supabase Dashboard
3. Убедитесь что используете правильный проект: `wjclhytzewfcalyybhab`

---

**Рекомендация:** Используйте **Вариант 2** (schema_universal.sql) - он самый безопасный и
универсальный.
