-- ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ: Выполните этот скрипт в Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql/new

-- Создаем таблицу _dummy_ (нужна для тестов подключения)
CREATE TABLE IF NOT EXISTS _dummy_ (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_value TEXT
);

-- Создаем таблицу templates если её нет
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем все недостающие колонки
DO $$ 
BEGIN
    RAISE NOTICE '🔧 Начинаем миграцию...';
    
    -- category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'category') THEN
        ALTER TABLE templates ADD COLUMN category TEXT NOT NULL DEFAULT 'Универсальная';
        RAISE NOTICE '✓ category добавлена';
    END IF;
    
    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'is_active') THEN
        ALTER TABLE templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✓ is_active добавлена';
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'description') THEN
        ALTER TABLE templates ADD COLUMN description TEXT;
        RAISE NOTICE '✓ description добавлена';
    END IF;
    
    -- thumbnail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'thumbnail') THEN
        ALTER TABLE templates ADD COLUMN thumbnail TEXT NOT NULL DEFAULT '📄';
        RAISE NOTICE '✓ thumbnail добавлена';
    END IF;
    
    -- elements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'elements') THEN
        ALTER TABLE templates ADD COLUMN elements JSONB NOT NULL DEFAULT '[]';
        RAISE NOTICE '✓ elements добавлена';
    END IF;
    
    -- suitable_for
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'suitable_for') THEN
        ALTER TABLE templates ADD COLUMN suitable_for TEXT[] NOT NULL DEFAULT '{}';
        RAISE NOTICE '✓ suitable_for добавлена';
    END IF;
    
    -- version
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'version') THEN
        ALTER TABLE templates ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
        RAISE NOTICE '✓ version добавлена';
    END IF;
    
    -- author
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'author') THEN
        ALTER TABLE templates ADD COLUMN author TEXT NOT NULL DEFAULT 'System';
        RAISE NOTICE '✓ author добавлена';
    END IF;
    
    RAISE NOTICE '✅ Миграция завершена!';
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_suitable ON templates USING GIN(suitable_for);

-- Финальная проверка
SELECT 
    '✅ Таблица templates содержит ' || COUNT(*) || ' колонок' AS result
FROM information_schema.columns 
WHERE table_name = 'templates';
