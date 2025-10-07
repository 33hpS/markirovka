-- Скрипт для исправления ошибки "column sku does not exist"
-- Выполнить в Supabase SQL Editor

-- Проверяем существование таблицы и её структуру
DO $$
BEGIN
    -- Если таблица не существует, создаем её
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE TABLE products (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            sku TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            manufacturer TEXT,
            weight TEXT,
            dimensions TEXT,
            expiration_days INTEGER,
            barcode TEXT,
            qr_data TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Таблица products создана';
    ELSE
        RAISE NOTICE 'Таблица products уже существует';
    END IF;

    -- Проверяем существование колонки sku
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
        ALTER TABLE products ADD COLUMN sku TEXT UNIQUE NOT NULL DEFAULT '';
        RAISE NOTICE 'Колонка sku добавлена';
    ELSE
        RAISE NOTICE 'Колонка sku уже существует';
    END IF;

    -- Аналогично для других важных колонок
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'qr_data') THEN
        ALTER TABLE products ADD COLUMN qr_data TEXT;
        RAISE NOTICE 'Колонка qr_data добавлена';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'barcode') THEN
        ALTER TABLE products ADD COLUMN barcode TEXT;
        RAISE NOTICE 'Колонка barcode добавлена';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Колонка status добавлена';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
        RAISE NOTICE 'Колонка stock добавлена';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'min_stock') THEN
        ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0;
        RAISE NOTICE 'Колонка min_stock добавлена';
    END IF;
END $$;

-- Создание таблицы шаблонов (если не существует)
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

-- Создание таблицы заданий печати (если не существует)
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0) DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('direct', 'pdf')) DEFAULT 'direct',
  operator TEXT NOT NULL DEFAULT 'Unknown',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включение Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

-- Удаление существующих политик (если есть)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON templates;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON print_jobs;

-- Создание базовых политик (разрешить все для начала тестирования)
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

-- Удаление существующих триггеров (если есть)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
DROP TRIGGER IF EXISTS update_print_jobs_updated_at ON print_jobs;

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at 
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание индексов (только если не существуют)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);

-- Очистка существующих тестовых данных
DELETE FROM print_jobs;
DELETE FROM products;
DELETE FROM templates;

-- Вставка тестовых шаблонов
INSERT INTO templates (name, description, width, height, elements) VALUES 
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
);

-- Вставка тестовых товаров
INSERT INTO products (name, sku, category, description, price, barcode, qr_data, manufacturer, weight) VALUES 
(
  'Молоко пастеризованное 3.2%', 
  'MILK-032-1L', 
  'Молочные продукты', 
  'Молоко пастеризованное жирностью 3.2%, упаковка 1 литр', 
  89.99, 
  '4607023001234', 
  'MILK-032-1L-2025',
  'Молочный завод №1',
  '1000г'
),
(
  'Хлеб белый нарезной', 
  'BREAD-WHITE-500G', 
  'Хлебобулочные изделия', 
  'Хлеб пшеничный белый, нарезной, вес 500г', 
  45.50, 
  '4607023005678', 
  'BREAD-WHITE-500G-2025',
  'Хлебозавод "Колос"',
  '500г'
),
(
  'Яблоки красные', 
  'APPLE-RED-1KG', 
  'Овощи и фрукты', 
  'Яблоки красные свежие, категория 1, вес 1кг', 
  120.00, 
  '4607023009012', 
  'APPLE-RED-1KG-2025',
  'Фруктовое хозяйство',
  '1000г'
);

-- Вставка тестового задания печати
INSERT INTO print_jobs (product_id, template_id, quantity, type, operator, status) 
SELECT 
  p.id, 
  t.id, 
  5, 
  'direct', 
  'Тестовый оператор', 
  'completed'
FROM products p, templates t 
WHERE p.sku = 'MILK-032-1L' AND t.name = 'Стандартная этикетка' 
LIMIT 1;

-- Проверка созданных данных
SELECT 'Товары' as table_name, count(*) as count FROM products
UNION ALL
SELECT 'Шаблоны' as table_name, count(*) as count FROM templates
UNION ALL
SELECT 'Задания печати' as table_name, count(*) as count FROM print_jobs;

-- Проверка структуры таблицы products
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Тестовый запрос для проверки работы
SELECT 
  id,
  name,
  sku,
  category,
  price,
  barcode,
  qr_data,
  created_at
FROM products 
ORDER BY created_at DESC;