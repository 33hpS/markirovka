-- УНИВЕРСАЛЬНЫЙ СКРИПТ УСТАНОВКИ/ОБНОВЛЕНИЯ СХЕМЫ
-- Безопасно выполняется на новой или существующей БД
-- Использует IF NOT EXISTS для безопасности

-- =====================================================
-- РАСШИРЕНИЯ
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ТАБЛИЦА: product_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА: products
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    category TEXT NOT NULL,
    description TEXT,
    manufacturer TEXT,
    weight TEXT,
    dimensions TEXT,
    expiration_days INTEGER,
    barcode TEXT UNIQUE,
    qr_data TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА: templates (минимальная структура + полная миграция)
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Полная миграция всех колонок templates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'category') THEN
        ALTER TABLE templates ADD COLUMN category TEXT NOT NULL DEFAULT 'Универсальная';
        RAISE NOTICE '✓ templates.category добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'description') THEN
        ALTER TABLE templates ADD COLUMN description TEXT;
        RAISE NOTICE '✓ templates.description добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'thumbnail') THEN
        ALTER TABLE templates ADD COLUMN thumbnail TEXT NOT NULL DEFAULT '📄';
        RAISE NOTICE '✓ templates.thumbnail добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'elements') THEN
        ALTER TABLE templates ADD COLUMN elements JSONB NOT NULL DEFAULT '[]';
        RAISE NOTICE '✓ templates.elements добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'suitable_for') THEN
        ALTER TABLE templates ADD COLUMN suitable_for TEXT[] NOT NULL DEFAULT '{}';
        RAISE NOTICE '✓ templates.suitable_for добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'version') THEN
        ALTER TABLE templates ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
        RAISE NOTICE '✓ templates.version добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'is_active') THEN
        ALTER TABLE templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✓ templates.is_active добавлена';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'author') THEN
        ALTER TABLE templates ADD COLUMN author TEXT NOT NULL DEFAULT 'System';
        RAISE NOTICE '✓ templates.author добавлена';
    END IF;
END $$;

-- =====================================================
-- ТАБЛИЦА: print_jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    operator TEXT NOT NULL,
    printer_id TEXT,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'pdf')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ТАБЛИЦА: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
    department TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА: printers
-- =====================================================
CREATE TABLE IF NOT EXISTS printers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ZPL', 'PDF', 'EPL', 'Direct')),
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'error', 'maintenance')),
    location TEXT NOT NULL,
    ip_address INET,
    model TEXT NOT NULL,
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    paper_size TEXT NOT NULL,
    resolution TEXT NOT NULL,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    last_job_time TIMESTAMP WITH TIME ZONE,
    maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    target_name TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_suitable ON templates USING GIN(suitable_for);

CREATE INDEX IF NOT EXISTS idx_print_jobs_product ON print_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_template ON print_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_print_jobs_operator ON print_jobs(operator);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- ТРИГГЕРЫ
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_printers_updated_at ON printers;
CREATE TRIGGER update_printers_updated_at BEFORE UPDATE ON printers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ФУНКЦИИ
-- =====================================================
CREATE OR REPLACE FUNCTION get_popular_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    total_printed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(pj.quantity), 0)::INTEGER as total_printed
    FROM products p
    LEFT JOIN print_jobs pj ON p.id = pj.product_id AND pj.status = 'completed'
    WHERE p.status = 'active'
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_printed DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_production_stats(
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    pending_jobs BIGINT,
    total_quantity BIGINT,
    direct_prints BIGINT,
    pdf_exports BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(*) FILTER (WHERE type = 'direct') as direct_prints,
        COUNT(*) FILTER (WHERE type = 'pdf') as pdf_exports
    FROM print_jobs
    WHERE created_at BETWEEN date_from AND date_to;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Продукты доступны всем аутентифицированным пользователям" ON products;
DROP POLICY IF EXISTS "Создание продуктов только для менеджеров и админов" ON products;
DROP POLICY IF EXISTS "Обновление продуктов только для менеджеров и админов" ON products;
DROP POLICY IF EXISTS "Шаблоны доступны всем аутентифицированным пользователям" ON templates;
DROP POLICY IF EXISTS "Задания печати доступны всем аутентифицированным пользователям" ON print_jobs;
DROP POLICY IF EXISTS "Пользователи могут видеть свой профиль" ON users;
DROP POLICY IF EXISTS "Админы могут видеть всех пользователей" ON users;

-- Создаем политики
CREATE POLICY "Продукты доступны всем аутентифицированным пользователям" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Создание продуктов только для менеджеров и админов" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND status = 'active'
        )
    );

CREATE POLICY "Обновление продуктов только для менеджеров и админов" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
            AND status = 'active'
        )
    );

CREATE POLICY "Шаблоны доступны всем аутентифицированным пользователям" ON templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Задания печати доступны всем аутентифицированным пользователям" ON print_jobs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Пользователи могут видеть свой профиль" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Админы могут видеть всех пользователей" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND status = 'active'
        )
    );

-- =====================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =====================================================

-- Категории продуктов
INSERT INTO product_categories (name, code, description) VALUES
    ('Молочные продукты', '01', 'Молоко, творог, сыры, йогурты'),
    ('Мясные изделия', '02', 'Колбасы, сосиски, мясные полуфабрикаты'),
    ('Хлебобулочные изделия', '03', 'Хлеб, булочки, торты, печенье'),
    ('Напитки', '04', 'Соки, газированные напитки, вода'),
    ('Консервы', '05', 'Мясные, рыбные, овощные консервы'),
    ('Замороженные продукты', '06', 'Овощи, ягоды, полуфабрикаты')
ON CONFLICT (name) DO NOTHING;

-- Базовые шаблоны
INSERT INTO templates (name, category, description, thumbnail, suitable_for, author) VALUES
    ('Молочные продукты - Базовый', 'Молочные продукты', 'Простая этикетка для молочных продуктов', '🥛', ARRAY['Молочные продукты'], 'System'),
    ('Хлебобулочные - Стандарт', 'Хлебобулочные изделия', 'Стандартная этикетка для хлеба и выпечки', '🍞', ARRAY['Хлебобулочные изделия'], 'System'),
    ('Мясные изделия - Премиум', 'Мясные изделия', 'Премиум этикетка для мясных продуктов', '🥩', ARRAY['Мясные изделия'], 'System'),
    ('Универсальная этикетка', 'Универсальная', 'Подходит для всех типов товаров', '📄', ARRAY['Молочные продукты', 'Хлебобулочные изделия', 'Мясные изделия', 'Напитки', 'Консервы', 'Замороженные продукты'], 'System')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ФИНАЛЬНАЯ ПРОВЕРКА
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✓ Схема базы данных успешно установлена';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Таблицы: products, templates, print_jobs, users, printers, product_categories, audit_logs';
    RAISE NOTICE 'Индексы: созданы для всех критических полей';
    RAISE NOTICE 'Триггеры: автообновление updated_at';
    RAISE NOTICE 'Функции: get_popular_products(), get_production_stats()';
    RAISE NOTICE 'RLS: включен со всеми политиками';
    RAISE NOTICE 'Данные: категории и шаблоны добавлены';
    RAISE NOTICE '';
    RAISE NOTICE 'Следующий шаг: запустите приложение';
    RAISE NOTICE '  npm run dev';
END $$;
