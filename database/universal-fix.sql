-- УНИВЕРСАЛЬНЫЙ безопасный скрипт для любой существующей таблицы products
-- Работает даже если таблица пустая или имеет только id

-- Сначала проверяем, существует ли таблица products
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        -- Если таблицы нет, создаем её с нуля
        CREATE TABLE products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL DEFAULT 'Товар',
            category TEXT NOT NULL DEFAULT 'Прочее',
            description TEXT,
            price DECIMAL(10,2),
            sku TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
            qr_data TEXT,
            barcode TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            manufacturer TEXT,
            weight TEXT,
            dimensions TEXT,
            expiration_days INTEGER,
            image_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Таблица products создана с нуля';
    ELSE
        RAISE NOTICE 'Таблица products существует, добавляем недостающие колонки';
    END IF;
END $$;

-- Добавляем все возможные колонки (безопасно)
DO $$
BEGIN
    -- Основные колонки
    BEGIN
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
        
        -- Возможные существующие колонки
        ALTER TABLE products ADD COLUMN IF NOT EXISTS article TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2);
        
        -- Временные колонки
        ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Все колонки добавлены успешно';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Ошибка при добавлении колонок: %', SQLERRM;
    END;
END $$;

-- Заполняем обязательные поля DEFAULT значениями
UPDATE products SET 
    name = COALESCE(name, 'Товар #' || COALESCE(id::text, random()::text)),
    category = COALESCE(category, 'Прочее'),
    sku = COALESCE(NULLIF(sku, ''), 'SKU-' || COALESCE(id::text, random()::text)),
    article = COALESCE(NULLIF(article, ''), 'ART-' || COALESCE(id::text, random()::text)),
    status = COALESCE(status, 'active'),
    stock = COALESCE(stock, 0),
    min_stock = COALESCE(min_stock, 0),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

-- Генерируем недостающие штрих-коды и QR-коды
UPDATE products SET 
    qr_data = COALESCE(qr_data, sku || '-' || EXTRACT(YEAR FROM NOW())::text),
    barcode = COALESCE(barcode, '460' || LPAD((random() * 9999999999)::bigint::text, 10, '0'))
WHERE sku IS NOT NULL;

-- Добавляем ограничения безопасно
DO $$
BEGIN
    -- Уникальность SKU
    BEGIN
        ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Ограничение unique для sku уже существует';
        WHEN OTHERS THEN
            RAISE NOTICE 'Не удалось создать unique для sku: %', SQLERRM;
    END;
    
    -- NOT NULL для важных полей
    BEGIN
        ALTER TABLE products ALTER COLUMN name SET DEFAULT 'Товар';
        ALTER TABLE products ALTER COLUMN name SET NOT NULL;
        ALTER TABLE products ALTER COLUMN category SET DEFAULT 'Прочее';
        ALTER TABLE products ALTER COLUMN category SET NOT NULL;
        ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active';
        ALTER TABLE products ALTER COLUMN stock SET DEFAULT 0;
        ALTER TABLE products ALTER COLUMN min_stock SET DEFAULT 0;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Ошибка при установке NOT NULL: %', SQLERRM;
    END;
    
    -- CHECK ограничения
    BEGIN
        ALTER TABLE products ADD CONSTRAINT products_status_check 
            CHECK (status IN ('active', 'inactive', 'discontinued'));
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'Check ограничение для status уже существует';
        WHEN OTHERS THEN
            RAISE NOTICE 'Не удалось создать check для status: %', SQLERRM;
    END;
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Включаем RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Создаем политику доступа
DROP POLICY IF EXISTS "Enable all for authenticated" ON products;
CREATE POLICY "Enable all for authenticated" ON products FOR ALL USING (true);

-- Создаем таблицы templates и print_jobs если их нет
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

-- Включаем RLS для новых таблиц
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated" ON templates;
DROP POLICY IF EXISTS "Enable all for authenticated" ON print_jobs;
CREATE POLICY "Enable all for authenticated" ON templates FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated" ON print_jobs FOR ALL USING (true);

-- Добавляем тестовые данные только если таблицы пустые
INSERT INTO templates (name, description, width, height, elements)
SELECT 'Стандартная этикетка', 'Базовый шаблон', 50, 30, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM templates);

INSERT INTO products (name, sku, category, description, price, barcode, qr_data, manufacturer, weight, article)
SELECT 'Тестовый товар', 'TEST-001', 'Тестовая категория', 'Описание тестового товара', 99.99, '4607023000001', 'TEST-001-2025', 'Тестовый производитель', '100г', 'ART-TEST-001'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEST-001');

-- ФИНАЛЬНАЯ ПРОВЕРКА
SELECT '=== РЕЗУЛЬТАТ НАСТРОЙКИ ===' as status;

-- Количество записей
SELECT 
    'Записи в таблицах' as info,
    (SELECT count(*) FROM products) as products_count,
    (SELECT count(*) FROM templates) as templates_count,
    (SELECT count(*) FROM print_jobs) as print_jobs_count;

-- Структура таблицы products
SELECT 'Структура таблицы products:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Пример данных
SELECT 'Пример товаров:' as info;
SELECT 
  id,
  name,
  sku,
  category,
  status,
  stock,
  CASE WHEN price IS NOT NULL THEN price::text || ' ₽' ELSE 'Не указана' END as price_display
FROM products 
ORDER BY created_at DESC 
LIMIT 3;

SELECT '=== ГОТОВО! Можно тестировать приложение ===' as final_status;