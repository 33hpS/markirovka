# Настройка Supabase для проекта маркировки

## Применение миграции базы данных

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте https://supabase.com/dashboard/project/wjclhytzewfcalyyhbab
2. Перейдите в раздел "SQL Editor"
3. Создайте новый запрос
4. Скопируйте и вставьте содержимое файла `migrations/001_initial_schema.sql`
5. Нажмите "Run" для выполнения

### Вариант 2: Через Supabase CLI

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Инициализируйте проект
supabase init

# Примените миграцию
supabase db push
```

## Структура базы данных

### Таблицы

#### categories

- Категории продуктов
- Поля: id, code (уникальный), name, description, timestamps
- Индексы: PRIMARY KEY на id, UNIQUE на code

#### products

- Продукты
- Поля: id, name, sku, category_id, barcode, qr_data, price, unit, metadata (JSONB), timestamps
- Связи: category_id → categories.id
- Индексы: category_id, sku

#### label_templates

- Шаблоны этикеток
- Поля: id, name, category, description, width, height, elements (JSONB), is_default, timestamps
- elements содержит массив элементов дизайна (текст, QR-коды и т.д.)

#### batches

- Партии производства
- Поля: id, batch_number, product_id, quantity, manufactured_date, expiry_date, status, metadata,
  timestamps
- Связи: product_id → products.id
- Индексы: product_id, status

#### production_logs

- Журнал производственных операций
- Поля: id, batch_id, product_id, action, quantity, operator, notes, metadata, timestamps
- Связи: batch_id → batches.id, product_id → products.id
- Индексы: batch_id, created_at

### Автоматические триггеры

- Все таблицы имеют триггеры для автоматического обновления поля `updated_at`

### Row Level Security (RLS)

- Включен для всех таблиц
- Текущая политика: полный доступ для аутентифицированных пользователей
- Можно настроить более детальные политики позже

## Стандартные данные

### Категории (автоматически создаются)

1. Молочные продукты (код: 01)
2. Хлебобулочные изделия (код: 02)
3. Мясные продукты (код: 03)
4. Овощи и фрукты (код: 04)
5. Напитки (код: 05)
6. Кондитерские изделия (код: 06)

### Шаблоны этикеток (автоматически создаются)

1. Молочная продукция (базовый) - dairy
2. Хлебобулочные изделия (базовый) - bakery

## Проверка настройки

После применения миграции выполните следующие запросы для проверки:

```sql
-- Проверка категорий
SELECT * FROM categories;

-- Проверка шаблонов
SELECT * FROM label_templates;

-- Проверка структуры таблиц
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Переменные окружения

Убедитесь, что в `wrangler.toml` есть следующие переменные:

```toml
[vars]
SUPABASE_URL = "https://wjclhytzewfcalyyhbab.supabase.co"
SUPABASE_ANON_KEY = "ваш_ключ"
```

## Следующие шаги

1. ✅ Применить миграцию в Supabase
2. ⏳ Реализовать API endpoints в Worker
3. ⏳ Обновить фронтенд для работы с API
4. ⏳ Протестировать синхронизацию данных
