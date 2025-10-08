-- Дополнительная настройка для Supabase Realtime
-- Применить ПОСЛЕ основной миграции 001_initial_schema.sql

-- =====================================================
-- 1. Включение Realtime для таблиц
-- =====================================================

-- Включаем публикацию изменений для всех таблиц
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE label_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE batches;
ALTER PUBLICATION supabase_realtime ADD TABLE production_logs;

-- =====================================================
-- 2. Broadcast триггеры для отправки событий
-- =====================================================

-- Функция для отправки broadcast сообщений при изменении категорий
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

-- Триггер для категорий
DROP TRIGGER IF EXISTS category_broadcast_trigger ON categories;
CREATE TRIGGER category_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_category_change();

-- Функция для отправки broadcast сообщений при изменении шаблонов
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

-- Триггер для шаблонов
DROP TRIGGER IF EXISTS template_broadcast_trigger ON label_templates;
CREATE TRIGGER template_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON label_templates
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_template_change();

-- Функция для отправки broadcast сообщений при изменении продуктов
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

-- Триггер для продуктов
DROP TRIGGER IF EXISTS product_broadcast_trigger ON products;
CREATE TRIGGER product_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_product_change();

-- =====================================================
-- 3. RLS политики для Realtime
-- =====================================================

-- Политики для чтения изменений в реальном времени
-- (уже созданы в основной миграции, но можно уточнить)

-- Для categories
DROP POLICY IF EXISTS "Enable realtime for categories" ON categories;
CREATE POLICY "Enable realtime for categories"
  ON categories FOR SELECT
  USING (true);

-- Для products
DROP POLICY IF EXISTS "Enable realtime for products" ON products;
CREATE POLICY "Enable realtime for products"
  ON products FOR SELECT
  USING (true);

-- Для label_templates
DROP POLICY IF EXISTS "Enable realtime for templates" ON label_templates;
CREATE POLICY "Enable realtime for templates"
  ON label_templates FOR SELECT
  USING (true);

-- =====================================================
-- 4. Каналы для broadcast сообщений
-- =====================================================

-- Создаем функцию для broadcast произвольных сообщений
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

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION broadcast_message(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_message(TEXT, TEXT, JSONB) TO anon;

-- =====================================================
-- 5. Проверочные запросы
-- =====================================================

-- Проверить, что realtime включен для таблиц
SELECT 
  schemaname,
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Проверить созданные триггеры
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%broadcast%'
ORDER BY event_object_table;

-- Проверить функции
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%broadcast%'
ORDER BY routine_name;

-- =====================================================
-- КОММЕНТАРИИ
-- =====================================================

COMMENT ON FUNCTION broadcast_category_change() IS 'Отправляет realtime событие при изменении категорий';
COMMENT ON FUNCTION broadcast_template_change() IS 'Отправляет realtime событие при изменении шаблонов';
COMMENT ON FUNCTION broadcast_product_change() IS 'Отправляет realtime событие при изменении продуктов';
COMMENT ON FUNCTION broadcast_message(TEXT, TEXT, JSONB) IS 'Универсальная функция для broadcast сообщений в каналы';
