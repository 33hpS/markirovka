-- МИНИМАЛЬНЫЙ скрипт для добавления только необходимых колонок
-- Выполнить в Supabase SQL Editor если у вас уже есть таблица products

-- Добавляем все необходимые колонки для работы системы
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Без названия',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Прочее',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS qr_data TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Заполняем обязательные поля для существующих записей
UPDATE products SET name = 'Товар #' || id::text WHERE name IS NULL OR name = '';
UPDATE products SET category = 'Прочее' WHERE category IS NULL OR category = '';

-- Заполняем sku для существующих записей (если пустые)
UPDATE products 
SET sku = 'SKU-' || id::text 
WHERE sku IS NULL OR sku = '';

-- Заполняем qr_data для существующих записей
UPDATE products 
SET qr_data = sku || '-' || EXTRACT(YEAR FROM NOW())::text 
WHERE qr_data IS NULL AND sku IS NOT NULL;

-- Генерируем штрих-коды для существующих записей
UPDATE products 
SET barcode = '460' || LPAD((random() * 9999999999)::bigint::text, 10, '0') 
WHERE barcode IS NULL;

-- Устанавливаем статус для существующих записей
UPDATE products 
SET status = 'active' 
WHERE status IS NULL;

-- Делаем sku уникальным (если еще не уникальный)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'products_sku_unique') THEN
        ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
    END IF;
END $$;

-- Создаем простые индексы
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Включаем RLS и создаем простую политику
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for testing" ON products;
CREATE POLICY "Enable all for testing" ON products FOR ALL USING (true);

-- Проверяем результат
SELECT 
  id,
  name,
  sku,
  category,
  status,
  stock,
  created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 3;

-- Проверяем структуру таблицы
SELECT 'Структура таблицы products после обновления:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;