-- =====================================================
-- ПОЛНАЯ МИГРАЦИЯ: Создание всех таблиц + Realtime
-- =====================================================
-- Применить этот файл ОДИН РАЗ в Supabase SQL Editor
-- Он удалит старые таблицы (если есть) и создаст новые с правильной структурой

-- =====================================================
-- 0. ОЧИСТКА (удаление старых объектов)
-- =====================================================

-- ВАЖНО: Сначала отключаем realtime публикацию для старых таблиц (если существуют)
DO $$
BEGIN
  -- Пытаемся удалить таблицы из публикации, игнорируя ошибки если их нет
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE categories;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE products;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE label_templates;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE batches;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE production_logs;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Удаляем старые функции (это удалит и связанные триггеры автоматически)
DROP FUNCTION IF EXISTS broadcast_category_change() CASCADE;
DROP FUNCTION IF EXISTS broadcast_template_change() CASCADE;
DROP FUNCTION IF EXISTS broadcast_product_change() CASCADE;
DROP FUNCTION IF EXISTS broadcast_message(TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Удаляем старые таблицы (CASCADE удалит все зависимые объекты)
DROP TABLE IF EXISTS production_logs CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS label_templates CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- 1. СОЗДАНИЕ ТАБЛИЦ
-- =====================================================

-- Таблица категорий продуктов
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица продуктов
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    barcode VARCHAR(255),
    qr_data TEXT,
    price DECIMAL(10, 2),
    unit VARCHAR(50),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица шаблонов этикеток
CREATE TABLE label_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    width INTEGER NOT NULL DEFAULT 400,
    height INTEGER NOT NULL DEFAULT 300,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица партий производства
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    manufactured_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица журнала производства
CREATE TABLE production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    quantity INTEGER,
    operator VARCHAR(255),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. СОЗДАНИЕ ИНДЕКСОВ
-- =====================================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_production_logs_batch ON production_logs(batch_id);
CREATE INDEX idx_production_logs_created ON production_logs(created_at DESC);

-- =====================================================
-- 3. ТРИГГЕРЫ ДЛЯ updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_label_templates_updated_at
    BEFORE UPDATE ON label_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ВСТАВКА ТЕСТОВЫХ ДАННЫХ
-- =====================================================

INSERT INTO categories (code, name, description) VALUES
    ('01', 'Молочные продукты', 'Молоко, сыр, йогурт и другие молочные изделия'),
    ('02', 'Хлебобулочные изделия', 'Хлеб, булки, выпечка'),
    ('03', 'Мясные продукты', 'Мясо и мясные изделия'),
    ('04', 'Овощи и фрукты', 'Свежие овощи и фрукты'),
    ('05', 'Напитки', 'Соки, вода, газированные напитки'),
    ('06', 'Кондитерские изделия', 'Торты, конфеты, печенье');

INSERT INTO label_templates (name, category, description, width, height, elements, is_default) VALUES
    (
        'Молочная продукция (базовый)',
        'dairy',
        'Стандартный шаблон для молочной продукции',
        400,
        300,
        '[
            {"id":"1","type":"text","content":"НАЗВАНИЕ ПРОДУКТА","x":20,"y":20,"fontSize":20,"fontWeight":"bold"},
            {"id":"2","type":"text","content":"Производитель: ___","x":20,"y":60,"fontSize":14},
            {"id":"3","type":"text","content":"Дата производства: __/__/____","x":20,"y":90,"fontSize":12},
            {"id":"4","type":"text","content":"Срок годности: __/__/____","x":20,"y":110,"fontSize":12},
            {"id":"5","type":"qr","data":"","x":280,"y":150,"size":100}
        ]'::jsonb,
        true
    ),
    (
        'Хлебобулочные изделия (базовый)',
        'bakery',
        'Стандартный шаблон для хлебобулочных изделий',
        400,
        300,
        '[
            {"id":"1","type":"text","content":"🍞 ХЛЕБОБУЛОЧНЫЕ ИЗДЕЛИЯ","x":20,"y":20,"fontSize":18,"fontWeight":"bold"},
            {"id":"2","type":"text","content":"Наименование: ___","x":20,"y":60,"fontSize":14},
            {"id":"3","type":"text","content":"Вес: ___ г","x":20,"y":90,"fontSize":12},
            {"id":"4","type":"text","content":"Изготовлено: __/__/____","x":20,"y":110,"fontSize":12},
            {"id":"5","type":"qr","data":"","x":280,"y":150,"size":100}
        ]'::jsonb,
        true
    );

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

-- Политики для authenticated пользователей
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON label_templates FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON batches FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON production_logs FOR ALL USING (true);

-- Политики для anon (неавторизованные запросы через API)
CREATE POLICY "Allow read for anon users" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow all for anon users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow read for anon users" ON products FOR SELECT USING (true);
CREATE POLICY "Allow all for anon users" ON products FOR ALL USING (true);
CREATE POLICY "Allow read for anon users" ON label_templates FOR SELECT USING (true);
CREATE POLICY "Allow all for anon users" ON label_templates FOR ALL USING (true);
CREATE POLICY "Allow read for anon users" ON batches FOR SELECT USING (true);
CREATE POLICY "Allow all for anon users" ON batches FOR ALL USING (true);
CREATE POLICY "Allow read for anon users" ON production_logs FOR SELECT USING (true);
CREATE POLICY "Allow all for anon users" ON production_logs FOR ALL USING (true);

-- =====================================================
-- 6. SUPABASE REALTIME SETUP
-- =====================================================

-- Включаем публикацию изменений для всех таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE label_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE batches;
ALTER PUBLICATION supabase_realtime ADD TABLE production_logs;

-- =====================================================
-- 7. BROADCAST ТРИГГЕРЫ ДЛЯ REALTIME
-- =====================================================

-- Функция для категорий
CREATE OR REPLACE FUNCTION broadcast_category_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'type', TG_OP,
    'table', 'categories',
    'old', row_to_json(OLD),
    'new', row_to_json(NEW),
    'timestamp', NOW()
  );
  
  PERFORM pg_notify('category_changes', payload::text);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_category_change();

-- Функция для шаблонов
CREATE OR REPLACE FUNCTION broadcast_template_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'type', TG_OP,
    'table', 'label_templates',
    'old', row_to_json(OLD),
    'new', row_to_json(NEW),
    'timestamp', NOW()
  );
  
  PERFORM pg_notify('template_changes', payload::text);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON label_templates
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_template_change();

-- Функция для продуктов
CREATE OR REPLACE FUNCTION broadcast_product_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'type', TG_OP,
    'table', 'products',
    'old', row_to_json(OLD),
    'new', row_to_json(NEW),
    'timestamp', NOW()
  );
  
  PERFORM pg_notify('product_changes', payload::text);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_product_change();

-- Универсальная функция для broadcast
CREATE OR REPLACE FUNCTION broadcast_message(
  channel_name TEXT,
  event_name TEXT,
  payload JSONB
)
RETURNS void AS $$
BEGIN
  PERFORM pg_notify(
    channel_name,
    json_build_object(
      'event', event_name,
      'payload', payload,
      'timestamp', NOW()
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION broadcast_message(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_message(TEXT, TEXT, JSONB) TO anon;

-- =====================================================
-- 8. ПРОВЕРОЧНЫЕ ЗАПРОСЫ
-- =====================================================

-- Проверяем созданные таблицы
SELECT 
  table_name,
  'Created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Проверяем Realtime
SELECT 
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Проверяем триггеры
SELECT 
  trigger_name,
  event_object_table,
  'Active' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Проверяем данные
SELECT 'categories' as table_name, COUNT(*) as row_count FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'label_templates', COUNT(*) FROM label_templates
UNION ALL
SELECT 'batches', COUNT(*) FROM batches
UNION ALL
SELECT 'production_logs', COUNT(*) FROM production_logs;

-- =====================================================
-- ГОТОВО! ✅
-- =====================================================
-- Теперь все данные будут синхронизироваться в реальном времени
-- через Supabase Realtime с приложением на Cloudflare Workers
