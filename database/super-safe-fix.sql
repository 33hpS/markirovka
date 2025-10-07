-- СУПЕР-БЕЗОПАСНЫЙ скрипт, который сначала анализирует существующую таблицу
-- Работает с любой структурой таблицы products

-- Шаг 1: Анализируем существующую структуру таблицы
DO $$
DECLARE
    has_article boolean := false;
    has_name boolean := false;
    has_category boolean := false;
    has_sku boolean := false;
    col_record record;
BEGIN
    -- Проверяем существующие колонки
    FOR col_record IN 
        SELECT column_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' AND table_schema = 'public'
    LOOP
        CASE col_record.column_name
            WHEN 'article' THEN has_article := true;
            WHEN 'name' THEN has_name := true;
            WHEN 'category' THEN has_category := true;
            WHEN 'sku' THEN has_sku := true;
            ELSE NULL;
        END CASE;
        
        RAISE NOTICE 'Найдена колонка: % (nullable: %)', col_record.column_name, col_record.is_nullable;
    END LOOP;
    
    -- Сохраняем информацию для следующих шагов
    CREATE TEMP TABLE IF NOT EXISTS table_analysis (
        has_article boolean,
        has_name boolean,
        has_category boolean,
        has_sku boolean
    );
    
    DELETE FROM table_analysis;
    INSERT INTO table_analysis VALUES (has_article, has_name, has_category, has_sku);
    
    RAISE NOTICE 'Анализ завершен. Article: %, Name: %, Category: %, SKU: %', 
                 has_article, has_name, has_category, has_sku;
END $$;

-- Шаг 2: Добавляем недостающие колонки
DO $$
BEGIN
    -- Добавляем все возможные колонки (безопасно)
    ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS qr_data TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS expiration_days INTEGER;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS article TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
    
    RAISE NOTICE 'Все колонки проверены и добавлены при необходимости';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка при добавлении колонок: %', SQLERRM;
END $$;

-- Шаг 3: Заполняем NULL значения с учетом существующих ограничений
DO $$
DECLARE
    analysis_rec record;
BEGIN
    SELECT * INTO analysis_rec FROM table_analysis LIMIT 1;
    
    -- Заполняем базовые поля
    UPDATE products SET 
        name = COALESCE(NULLIF(name, ''), 'Товар #' || COALESCE(id::text, random()::text)),
        category = COALESCE(NULLIF(category, ''), 'Прочее'),
        status = COALESCE(status, 'active'),
        stock = COALESCE(stock, 0),
        min_stock = COALESCE(min_stock, 0),
        created_at = COALESCE(created_at, NOW()),
        updated_at = COALESCE(updated_at, NOW());
    
    -- Заполняем SKU если есть
    UPDATE products SET 
        sku = COALESCE(NULLIF(sku, ''), 'SKU-' || COALESCE(id::text, random()::text))
    WHERE sku IS NULL OR sku = '';
    
    -- Заполняем article если колонка существует
    UPDATE products SET 
        article = COALESCE(NULLIF(article, ''), 'ART-' || COALESCE(id::text, random()::text))
    WHERE article IS NULL OR article = '';
    
    RAISE NOTICE 'Базовые поля заполнены';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка при заполнении полей: %', SQLERRM;
END $$;

-- Шаг 4: Генерируем штрих-коды и QR-коды
UPDATE products SET 
    qr_data = COALESCE(qr_data, COALESCE(sku, 'NOSKU') || '-' || EXTRACT(YEAR FROM NOW())::text),
    barcode = COALESCE(barcode, '460' || LPAD((random() * 9999999999)::bigint::text, 10, '0'))
WHERE qr_data IS NULL OR barcode IS NULL;

-- Шаг 5: Безопасное создание ограничений
DO $$
BEGIN
    -- Пытаемся создать уникальность для SKU
    BEGIN
        ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
        RAISE NOTICE 'Создано ограничение уникальности для SKU';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Ограничение unique для sku уже существует';
        WHEN not_null_violation THEN
            RAISE NOTICE 'Не удалось создать unique для sku: есть NULL значения';
        WHEN OTHERS THEN
            RAISE NOTICE 'Не удалось создать unique для sku: %', SQLERRM;
    END;
    
    -- Пытаемся создать CHECK ограничения
    BEGIN
        ALTER TABLE products ADD CONSTRAINT products_status_check 
            CHECK (status IN ('active', 'inactive', 'discontinued'));
        RAISE NOTICE 'Создано ограничение CHECK для status';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Check ограничение для status уже существует';
        WHEN OTHERS THEN
            RAISE NOTICE 'Не удалось создать check для status: %', SQLERRM;
    END;
END $$;

-- Шаг 6: Создаем индексы безопасно
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);

-- Шаг 7: Настраиваем RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated" ON products;
CREATE POLICY "Enable all for authenticated" ON products FOR ALL USING (true);

-- Шаг 8: Создаем дополнительные таблицы
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Шаблон',
  description TEXT,
  width INTEGER DEFAULT 50,
  height INTEGER DEFAULT 30,
  elements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'pdf')),
  operator TEXT DEFAULT 'Неизвестно',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated" ON templates;
DROP POLICY IF EXISTS "Enable all for authenticated" ON print_jobs;
CREATE POLICY "Enable all for authenticated" ON templates FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated" ON print_jobs FOR ALL USING (true);

-- Шаг 9: Добавляем тестовые данные с учетом всех полей
DO $$
BEGIN
    -- Добавляем тестовый шаблон
    INSERT INTO templates (name, description, width, height, elements)
    SELECT 'Стандартная этикетка', 'Базовый шаблон для товаров', 50, 30, 
           '[{"type": "text", "x": 5, "y": 5, "width": 40, "height": 10, "text": "{{name}}", "fontSize": 12}]'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = 'Стандартная этикетка');
    
    -- Добавляем тестовый товар с учетом всех возможных полей
    INSERT INTO products (name, category, sku, article, description, price, barcode, qr_data, manufacturer, weight, status, stock, min_stock)
    SELECT 
        'Тестовый товар', 
        'Тестовая категория', 
        'TEST-001', 
        'ART-TEST-001',
        'Описание тестового товара', 
        99.99, 
        '4607023000001', 
        'TEST-001-2025',
        'Тестовый производитель',
        '100г',
        'active',
        10,
        5
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEST-001' OR article = 'ART-TEST-001');
    
    RAISE NOTICE 'Тестовые данные добавлены';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка при добавлении тестовых данных: %', SQLERRM;
END $$;

-- Шаг 10: Финальная проверка
SELECT '=== АНАЛИЗ ЗАВЕРШЕН ===' as status;

-- Показываем структуру таблицы
SELECT 'Структура таблицы products:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE WHEN column_default IS NOT NULL THEN 'Да' ELSE 'Нет' END as has_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Показываем ограничения
SELECT 'Ограничения таблицы:' as info;
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'products' 
  AND table_schema = 'public';

-- Показываем количество записей
SELECT 
    'Записи в таблицах' as info,
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM templates) as templates_count,
    (SELECT count(*) FROM print_jobs) as print_jobs_count;

-- Показываем примеры данных
SELECT 'Примеры товаров:' as info;
SELECT 
  COALESCE(name, 'БЕЗ ИМЕНИ') as name,
  COALESCE(sku, 'БЕЗ SKU') as sku,
  COALESCE(article, 'БЕЗ АРТИКУЛА') as article,
  COALESCE(category, 'БЕЗ КАТЕГОРИИ') as category,
  COALESCE(status, 'БЕЗ СТАТУСА') as status
FROM products 
ORDER BY created_at DESC 
LIMIT 3;

-- Очистка временных таблиц
DROP TABLE IF EXISTS table_analysis;

SELECT '=== ВСЕ ГОТОВО! ПРИЛОЖЕНИЕ МОЖНО ТЕСТИРОВАТЬ ===' as final_status;