-- Создание таблиц для приложения маркировки

-- Таблица категорий продуктов
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS label_templates (
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
CREATE TABLE IF NOT EXISTS batches (
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
CREATE TABLE IF NOT EXISTS production_logs (
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

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_production_logs_batch ON production_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_created ON production_logs(created_at DESC);

-- Триггеры для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старые триггеры если они существуют
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_label_templates_updated_at ON label_templates;
DROP TRIGGER IF EXISTS update_batches_updated_at ON batches;

-- Создаём триггеры заново
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

-- Вставка стандартных категорий
INSERT INTO categories (code, name, description) VALUES
    ('01', 'Молочные продукты', 'Молоко, сыр, йогурт и другие молочные изделия'),
    ('02', 'Хлебобулочные изделия', 'Хлеб, булки, выпечка'),
    ('03', 'Мясные продукты', 'Мясо и мясные изделия'),
    ('04', 'Овощи и фрукты', 'Свежие овощи и фрукты'),
    ('05', 'Напитки', 'Соки, вода, газированные напитки'),
    ('06', 'Кондитерские изделия', 'Торты, конфеты, печенье')
ON CONFLICT (code) DO NOTHING;

-- Вставка стандартных шаблонов этикеток
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
    )
ON CONFLICT DO NOTHING;

-- Настройка Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON label_templates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON batches;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON production_logs;

-- Политики доступа (пока разрешаем все для аутентифицированных пользователей)
CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON label_templates FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON batches FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON production_logs FOR ALL USING (true);
