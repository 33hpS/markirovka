-- Безопасное добавление данных в существующую схему Supabase
-- Этот скрипт НЕ удаляет существующие данные, только добавляет недостающие элементы

-- Добавление недостающих колонок в таблицу products (если их нет)
DO $$
BEGIN
    -- Проверяем и добавляем колонку name (если её нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
        ALTER TABLE products ADD COLUMN name TEXT NOT NULL DEFAULT 'Без названия';
        RAISE NOTICE 'Колонка name добавлена';
    ELSE
        RAISE NOTICE 'Колонка name уже существует';
    END IF;

    -- Проверяем и добавляем колонку category (если её нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Прочее';
        RAISE NOTICE 'Колонка category добавлена';
    ELSE
        RAISE NOTICE 'Колонка category уже существует';
    END IF;

    -- Проверяем и добавляем колонку description (если её нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE products ADD COLUMN description TEXT;
        RAISE NOTICE 'Колонка description добавлена';
    ELSE
        RAISE NOTICE 'Колонка description уже существует';
    END IF;

    -- Проверяем и добавляем колонку price (если её нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        ALTER TABLE products ADD COLUMN price DECIMAL(10,2);
        RAISE NOTICE 'Колонка price добавлена';
    ELSE
        RAISE NOTICE 'Колонка price уже существует';
    END IF;

    -- Проверяем и добавляем колонку sku (если её нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
        ALTER TABLE products ADD COLUMN sku TEXT;
        RAISE NOTICE 'Колонка sku добавлена';
        
        -- Заполняем пустые значения sku для существующих записей
        UPDATE products SET sku = 'SKU-' || id::text WHERE sku IS NULL OR sku = '';
        
        -- Делаем колонку уникальной после заполнения
        ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
    ELSE
        RAISE NOTICE 'Колонка sku уже существует';
    END IF;

    -- Добавляем qr_data (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'qr_data') THEN
        ALTER TABLE products ADD COLUMN qr_data TEXT;
        RAISE NOTICE 'Колонка qr_data добавлена';
        
        -- Заполняем QR-коды для существующих записей
        UPDATE products SET qr_data = sku || '-' || EXTRACT(YEAR FROM NOW())::text WHERE qr_data IS NULL AND sku IS NOT NULL;
    END IF;

    -- Добавляем barcode (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'barcode') THEN
        ALTER TABLE products ADD COLUMN barcode TEXT;
        RAISE NOTICE 'Колонка barcode добавлена';
        
        -- Генерируем штрих-коды для существующих записей
        UPDATE products SET barcode = '460' || LPAD((random() * 9999999999)::bigint::text, 10, '0') WHERE barcode IS NULL;
    END IF;

    -- Добавляем status (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Колонка status добавлена';
        
        -- Устанавливаем статус для существующих записей
        UPDATE products SET status = 'active' WHERE status IS NULL;
        
        -- Добавляем ограничение
        ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'inactive', 'discontinued'));
    END IF;

    -- Добавляем stock (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
        RAISE NOTICE 'Колонка stock добавлена';
        
        UPDATE products SET stock = 0 WHERE stock IS NULL;
    END IF;

    -- Добавляем min_stock (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_stock') THEN
        ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0;
        RAISE NOTICE 'Колонка min_stock добавлена';
        
        UPDATE products SET min_stock = 0 WHERE min_stock IS NULL;
    END IF;

    -- Добавляем manufacturer (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN
        ALTER TABLE products ADD COLUMN manufacturer TEXT;
        RAISE NOTICE 'Колонка manufacturer добавлена';
    END IF;

    -- Добавляем weight (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight') THEN
        ALTER TABLE products ADD COLUMN weight TEXT;
        RAISE NOTICE 'Колонка weight добавлена';
    END IF;

    -- Добавляем dimensions (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'dimensions') THEN
        ALTER TABLE products ADD COLUMN dimensions TEXT;
        RAISE NOTICE 'Колонка dimensions добавлена';
    END IF;

    -- Добавляем expiration_days (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiration_days') THEN
        ALTER TABLE products ADD COLUMN expiration_days INTEGER;
        RAISE NOTICE 'Колонка expiration_days добавлена';
    END IF;

    -- Добавляем image_url (если нет)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Колонка image_url добавлена';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка при добавлении колонок: %', SQLERRM;
END $$;

-- Создание таблицы templates (если не существует)
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  width INTEGER NOT NULL DEFAULT 50,
  height INTEGER NOT NULL DEFAULT 30,
  elements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание таблицы print_jobs (если не существует)
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'direct',
  operator TEXT NOT NULL DEFAULT 'Unknown',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавление ограничений (если их нет)
DO $$
BEGIN
    -- Ограничение для quantity в print_jobs
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'print_jobs_quantity_check') THEN
        ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_quantity_check CHECK (quantity > 0);
    END IF;

    -- Ограничение для type в print_jobs
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'print_jobs_type_check') THEN
        ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_type_check CHECK (type IN ('direct', 'pdf'));
    END IF;

    -- Ограничение для status в print_jobs
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'print_jobs_status_check') THEN
        ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Ошибка при добавлении ограничений: %', SQLERRM;
END $$;

-- Включение Row Level Security (безопасно)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Удаление старых политик и создание новых
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON templates;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON print_jobs;

-- Создание простых политик для тестирования
CREATE POLICY "Enable all operations for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON templates FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON print_jobs FOR ALL USING (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров (безопасно)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_print_jobs_updated_at ON print_jobs;

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at 
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание индексов (безопасно)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_product_id ON print_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_template_id ON print_jobs(template_id);

-- Добавление тестовых шаблонов (только если их нет)
INSERT INTO templates (name, description, width, height, elements)
SELECT * FROM (
    VALUES 
    (
        'Стандартная этикетка', 
        'Базовый шаблон для товаров', 
        50, 
        30, 
        '[{"type": "text", "x": 5, "y": 5, "width": 40, "height": 10, "text": "{{name}}", "fontSize": 12}, {"type": "barcode", "x": 5, "y": 15, "width": 40, "height": 10, "data": "{{barcode}}"}]'::jsonb
    ),
    (
        'Этикетка с QR-кодом', 
        'Шаблон с QR-кодом для мобильного сканирования', 
        60, 
        40, 
        '[{"type": "text", "x": 5, "y": 5, "width": 50, "height": 8, "text": "{{name}}", "fontSize": 10}, {"type": "qr", "x": 5, "y": 15, "width": 20, "height": 20, "data": "{{qr_data}}"}, {"type": "text", "x": 30, "y": 18, "width": 25, "height": 6, "text": "{{sku}}", "fontSize": 8}]'::jsonb
    ),
    (
        'Простая этикетка', 
        'Минимальный шаблон только с названием', 
        40, 
        20, 
        '[{"type": "text", "x": 2, "y": 2, "width": 36, "height": 16, "text": "{{name}}", "fontSize": 14}]'::jsonb
    )
) AS new_templates(name, description, width, height, elements)
WHERE NOT EXISTS (
    SELECT 1 FROM templates WHERE templates.name = new_templates.name
);

-- Добавление тестовых товаров (только если их нет)
INSERT INTO products (name, sku, category, description, price, barcode, qr_data, manufacturer, weight, status, stock, min_stock)
SELECT * FROM (
    VALUES 
    (
        'Молоко пастеризованное 3.2%', 
        'MILK-032-1L', 
        'Молочные продукты', 
        'Молоко пастеризованное жирностью 3.2%, упаковка 1 литр', 
        89.99::decimal, 
        '4607023001234', 
        'MILK-032-1L-2025',
        'Молочный завод №1',
        '1000г',
        'active',
        50,
        10
    ),
    (
        'Хлеб белый нарезной', 
        'BREAD-WHITE-500G', 
        'Хлебобулочные изделия', 
        'Хлеб пшеничный белый, нарезной, вес 500г', 
        45.50::decimal, 
        '4607023005678', 
        'BREAD-WHITE-500G-2025',
        'Хлебозавод "Колос"',
        '500г',
        'active',
        25,
        5
    ),
    (
        'Яблоки красные', 
        'APPLE-RED-1KG', 
        'Овощи и фрукты', 
        'Яблоки красные свежие, категория 1, вес 1кг', 
        120.00::decimal, 
        '4607023009012', 
        'APPLE-RED-1KG-2025',
        'Фруктовое хозяйство',
        '1000г',
        'active',
        100,
        20
    ),
    (
        'Вода минеральная газированная', 
        'WATER-MINERAL-500ML', 
        'Напитки', 
        'Вода минеральная природная газированная, 500мл', 
        35.00::decimal, 
        '4607023013456', 
        'WATER-MINERAL-500ML-2025',
        'Источник здоровья',
        '500мл',
        'active',
        200,
        30
    ),
    (
        'Сыр российский твердый', 
        'CHEESE-RUSSIAN-200G', 
        'Молочные продукты', 
        'Сыр российский твердый, 45% жирности, 200г', 
        180.00::decimal, 
        '4607023017890', 
        'CHEESE-RUSSIAN-200G-2025',
        'Сырный дом',
        '200г',
        'active',
        15,
        3
    )
) AS new_products(name, sku, category, description, price, barcode, qr_data, manufacturer, weight, status, stock, min_stock)
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE products.sku = new_products.sku
);

-- Добавление тестового задания печати (только если нет заданий)
INSERT INTO print_jobs (product_id, template_id, quantity, type, operator, status)
SELECT 
    p.id, 
    t.id, 
    5, 
    'direct', 
    'Тестовый оператор', 
    'completed'
FROM products p, templates t 
WHERE p.sku = 'MILK-032-1L' 
  AND t.name = 'Стандартная этикетка'
  AND NOT EXISTS (SELECT 1 FROM print_jobs)
LIMIT 1;

-- Отчет о результатах
SELECT 'Результаты добавления данных:' as info;

SELECT 
    'Товары' as table_name, 
    count(*) as total_count,
    count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 minute') as just_added
FROM products
UNION ALL
SELECT 
    'Шаблоны' as table_name, 
    count(*) as total_count,
    count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 minute') as just_added
FROM templates
UNION ALL
SELECT 
    'Задания печати' as table_name, 
    count(*) as total_count,
    count(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 minute') as just_added
FROM print_jobs;

-- Проверка структуры таблицы products
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

-- Тестовый запрос - последние добавленные товары
SELECT 'Последние товары в системе:' as info;
SELECT 
  name,
  sku,
  category,
  CASE WHEN price IS NOT NULL THEN price::text || ' ₽' ELSE 'Не указана' END as price,
  stock,
  status,
  created_at
FROM products 
ORDER BY created_at DESC
LIMIT 5;