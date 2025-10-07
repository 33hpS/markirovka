# Подключение к Supabase и Cloudflare R2

## Настройка Supabase

### 1. Создание проекта

- URL: `https://fpgzozsspaipegxcfzug.supabase.co`
- Anon Key:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZ3pvenNzcGFpcGVneGNmenVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTYxNDYsImV4cCI6MjA2OTczMjE0Nn0.BNvvF-GjQ4I6Q2O9A4haE4uB_8u6TzmtRytHI-WBIaU`

### 2. Установка зависимостей

```bash
npm install @supabase/supabase-js
```

### 3. Создание схемы базы данных

Выполнить SQL из файла `database/schema.sql` в SQL Editor Supabase:

#### Основные таблицы:

- `products` - Товары с штрих-кодами и QR-кодами
- `templates` - Шаблоны этикеток
- `print_jobs` - История заданий печати
- `users` - Пользователи системы
- `printers` - Принтеры и их статусы
- `audit_logs` - Журнал аудита действий

#### Функции и триггеры:

- Автоматическое обновление `updated_at`
- Функция `get_popular_products()` для аналитики
- Функция `get_production_stats()` для отчетов

### 4. Настройка Row Level Security (RLS)

- Включена защита на уровне строк
- Политики доступа по ролям (admin, manager, worker)
- Ограничения на создание/редактирование данных

## Настройка Cloudflare R2 Object Storage

### 1. Конфигурация

- Endpoint: `https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com`
- Access Key ID: `ZSBP4Gp0KZxeB_zfiKO6fK0edsF6pVSv1pSxEYrz`
- Secret Access Key: `b5b628fc059397696f40915800d462611e7f6546d89a206f46aa42aedc9f4386`
- Region: `auto` (EU jurisdiction)

### 2. Структура bucket'а

```
markirovka-storage/
├── products/           # Изображения товаров
│   └── {sku}/
│       └── image_{timestamp}.{ext}
├── templates/          # JSON файлы шаблонов
│   └── {templateId}_{timestamp}.json
├── labels/            # Сгенерированные PDF этикетки
│   └── {date}/
│       └── {sku}_{templateId}_{timestamp}.pdf
└── exports/           # Экспорты и отчеты
    └── {date}/
        └── {reportType}_{timestamp}.pdf
```

### 3. CORS настройки для R2

```json
{
  "AllowedOrigins": ["https://markirovka.sherhan1988hp.workers.dev", "http://localhost:3000"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"]
}
```

## Интеграция в приложении

### 1. Конфигурация (`src/config/config.ts`)

```typescript
export const supabaseConfig = {
  url: 'https://fpgzozsspaipegxcfzug.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const r2Config = {
  endpoint: 'https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com',
  accessKeyId: 'ZSBP4Gp0KZxeB_zfiKO6fK0edsF6pVSv1pSxEYrz',
  secretAccessKey: 'b5b628fc059397696f40915800d462611e7f6546d89a206f46aa42aedc9f4386',
  bucketName: 'markirovka-storage',
};
```

### 2. Сервисы

- `supabaseService.ts` - Работа с базой данных
- `r2Service.ts` - Работа с файловым хранилищем
- `dataService.ts` - Унифицированный API для компонентов

### 3. Основные операции

#### Работа с товарами:

```typescript
// Поиск товара по QR-коду
const product = await dataService.searchProducts(qrCode);

// Создание нового товара
const newProduct = await dataService.createProduct({
  name: 'Молоко 3.2%',
  sku: 'MILK-032-1L',
  category: 'Молочные продукты',
  // ... другие поля
});
```

#### Работа с печатью:

```typescript
// Создание задания печати
const printJob = await dataService.createPrintJob({
  productId: product.id,
  templateId: template.id,
  quantity: 10,
  operator: 'Оператор 1',
  type: 'direct',
});

// Сохранение PDF в R2
const pdfUrl = await dataService.savePrintJobPDF(jobId, pdfBlob);
```

#### Загрузка файлов:

```typescript
// Загрузка изображения товара
const imageUrl = await dataService.uploadProductImage(productId, imageFile);

// Прямая работа с R2
const result = await r2Service.uploadFile(file, 'path/to/file.pdf');
```

## Безопасность

### 1. Аутентификация

- JWT токены через Supabase Auth
- Роли: admin, manager, worker
- Разграничение доступа по операциям

### 2. Авторизация

- RLS политики в Supabase
- Проверка ролей на уровне API
- Логирование всех действий в audit_logs

### 3. Файловая безопасность

- Signed URLs для загрузки
- Ограничение типов файлов
- Автоматическая очистка временных файлов

## Мониторинг и логирование

### 1. Аудит действий

```sql
-- Просмотр действий пользователя
SELECT * FROM audit_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### 2. Статистика производства

```sql
-- Статистика за период
SELECT * FROM get_production_stats('2025-10-01', '2025-10-31');

-- Популярные товары
SELECT * FROM get_popular_products(10);
```

### 3. Мониторинг R2

- Размер storage через Cloudflare Dashboard
- Количество запросов и трафик
- Ошибки загрузки файлов

## Развертывание

### 1. Переменные окружения

```env
SUPABASE_URL=https://fpgzozsspaipegxcfzug.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
R2_ENDPOINT=https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ZSBP4Gp0KZxeB_zfiKO6fK0edsF6pVSv1pSxEYrz
R2_SECRET_ACCESS_KEY=b5b628fc059397696f40915800d462611e7f6546d89a206f46aa42aedc9f4386
R2_BUCKET_NAME=markirovka-storage
```

### 2. Cloudflare Workers

- Настройка переменных в wrangler.toml
- Привязка R2 bucket к worker
- Обновление CORS политик

### 3. Автоматическая миграция

```bash
# Создание миграций
npx supabase gen types typescript --project-id fpgzozsspaipegxcfzug

# Применение миграций
npx supabase db push
```

## Резервное копирование

### 1. База данных

- Автоматические бекапы Supabase
- Экспорт критических таблиц
- Point-in-time recovery

### 2. Файловое хранилище

- Репликация между регионами R2
- Периодический экспорт важных файлов
- Версионирование файлов

## Производительность

### 1. Индексы базы данных

- Составные индексы для частых запросов
- Партицирование больших таблиц
- Оптимизация RLS политик

### 2. Кэширование

- Redis для часто запрашиваемых данных
- CDN для статических файлов
- Локальное кэширование в браузере

### 3. Оптимизация запросов

- Использование prepared statements
- Пагинация для больших наборов данных
- Eager loading связанных данных
