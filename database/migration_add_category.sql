-- Миграция: Добавление всех отсутствующих полей в таблицу templates
-- Выполните этот скрипт, если получили ошибки:
--   - column "category" does not exist
--   - column "is_active" does not exist
--   - и другие отсутствующие колонки

DO $$ 
BEGIN
    RAISE NOTICE 'Начало миграции таблицы templates...';
    
    -- category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'category'
    ) THEN
        ALTER TABLE templates ADD COLUMN category TEXT NOT NULL DEFAULT 'Универсальная';
        RAISE NOTICE '✓ Колонка category добавлена';
    ELSE
        RAISE NOTICE '  Колонка category уже существует';
    END IF;
    
    -- is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✓ Колонка is_active добавлена';
    ELSE
        RAISE NOTICE '  Колонка is_active уже существует';
    END IF;
    
    -- description
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'description'
    ) THEN
        ALTER TABLE templates ADD COLUMN description TEXT;
        RAISE NOTICE '✓ Колонка description добавлена';
    ELSE
        RAISE NOTICE '  Колонка description уже существует';
    END IF;
    
    -- thumbnail
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'thumbnail'
    ) THEN
        ALTER TABLE templates ADD COLUMN thumbnail TEXT NOT NULL DEFAULT '📄';
        RAISE NOTICE '✓ Колонка thumbnail добавлена';
    ELSE
        RAISE NOTICE '  Колонка thumbnail уже существует';
    END IF;
    
    -- elements
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'elements'
    ) THEN
        ALTER TABLE templates ADD COLUMN elements JSONB NOT NULL DEFAULT '[]';
        RAISE NOTICE '✓ Колонка elements добавлена';
    ELSE
        RAISE NOTICE '  Колонка elements уже существует';
    END IF;
    
    -- suitable_for
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'suitable_for'
    ) THEN
        ALTER TABLE templates ADD COLUMN suitable_for TEXT[] NOT NULL DEFAULT '{}';
        RAISE NOTICE '✓ Колонка suitable_for добавлена';
    ELSE
        RAISE NOTICE '  Колонка suitable_for уже существует';
    END IF;
    
    -- version
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'version'
    ) THEN
        ALTER TABLE templates ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
        RAISE NOTICE '✓ Колонка version добавлена';
    ELSE
        RAISE NOTICE '  Колонка version уже существует';
    END IF;
    
    -- author
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'author'
    ) THEN
        ALTER TABLE templates ADD COLUMN author TEXT NOT NULL DEFAULT 'System';
        RAISE NOTICE '✓ Колонка author добавлена';
    ELSE
        RAISE NOTICE '  Колонка author уже существует';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✓ Миграция завершена успешно!';
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_suitable ON templates USING GIN(suitable_for);

RAISE NOTICE '✓ Индексы созданы';

-- Проверка результата
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'templates';
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Итого колонок в таблице templates: %', col_count;
    RAISE NOTICE '===========================================';
END $$;

-- Показываем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'templates'
ORDER BY ordinal_position;
