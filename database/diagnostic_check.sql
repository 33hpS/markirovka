-- Диагностический скрипт для проверки схемы БД
-- Запустите этот скрипт чтобы узнать какие таблицы и колонки существуют

-- 1. Проверка существующих таблиц
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Проверка структуры таблицы templates
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'templates'
ORDER BY ordinal_position;

-- 3. Проверка структуры таблицы products
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- 4. Проверка существующих индексов
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('templates', 'products', 'print_jobs', 'users', 'printers')
ORDER BY tablename, indexname;

-- 5. Проверка RLS политик
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Подсчет записей в таблицах
SELECT 
    'products' as table_name, 
    COUNT(*) as row_count 
FROM products
UNION ALL
SELECT 
    'templates', 
    COUNT(*) 
FROM templates
UNION ALL
SELECT 
    'print_jobs', 
    COUNT(*) 
FROM print_jobs
UNION ALL
SELECT 
    'users', 
    COUNT(*) 
FROM users
UNION ALL
SELECT 
    'product_categories', 
    COUNT(*) 
FROM product_categories;
