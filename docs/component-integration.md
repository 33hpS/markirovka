# Подключение компонентов к базе данных

## Обзор интеграции

Система маркировки полностью интегрирована с Supabase PostgreSQL и Cloudflare R2. Все сервисы готовы
к использованию.

## Созданные интегрированные компоненты

### 1. ProductsIntegrated.tsx

**Местоположение:** `src/pages/ProductsIntegrated.tsx`

**Возможности:**

- Загрузка товаров из базы данных через `dataService.getProducts()`
- Создание новых товаров с автоматической генерацией штрих-кодов
- Редактирование и удаление товаров
- Загрузка изображений товаров в Cloudflare R2
- Поиск и фильтрация товаров
- Fallback к тестовым данным при ошибках подключения

**Основные функции:**

```typescript
// Загрузка всех товаров
const loadProducts = async () => {
  const data = await dataService.getProducts();
  setProducts(data);
};

// Создание нового товара
const handleCreateProduct = async () => {
  const createdProduct = await dataService.createProduct(productData);
  setProducts(prev => [createdProduct, ...prev]);
};

// Загрузка изображения
const handleImageUpload = async (productId: string, file: File) => {
  const imageUrl = await dataService.uploadProductImage(productId, file);
  setProducts(prev => prev.map(p => (p.id === productId ? { ...p, imageUrl } : p)));
};
```

### 2. LineOperatorIntegrated.tsx

**Местоположение:** `src/pages/LineOperatorIntegrated.tsx`

**Возможности:**

- Поиск товаров по QR-коду через `dataService.searchProducts()`
- Загрузка шаблонов этикеток из базы
- Создание заданий печати с сохранением в базу
- История сканирований и печати
- Статистика оператора в реальном времени
- Работа с камерой для сканирования QR-кодов

**Основные функции:**

```typescript
// Поиск товара по QR-коду
const searchProductByQR = async (qrCode: string) => {
  const products = await dataService.searchProducts(qrCode);
  return products.length > 0 ? products[0] : null;
};

// Создание задания печати
const handlePrint = async (type: 'direct' | 'pdf') => {
  const printJobData = {
    productId: selectedProduct.id,
    templateId: selectedTemplate,
    quantity: printQuantity,
    type,
    operator: 'Текущий оператор',
  };
  const newPrintJob = await dataService.createPrintJob(printJobData);
  setPrintJobs(prev => [newPrintJob, ...prev]);
};
```

## Пошаговая замена существующих компонентов

### Шаг 1: Установка зависимостей (выполнено)

```bash
npm install @supabase/supabase-js
```

### Шаг 2: Настройка Supabase проекта

1. Выполнить SQL из `database/schema.sql` в Supabase SQL Editor
2. Настроить RLS политики
3. Создать первого пользователя-администратора

### Шаг 3: Настройка Cloudflare R2

1. Создать bucket с именем `markirovka-storage`
2. Настроить CORS политики
3. Настроить публичный доступ для изображений

### Шаг 4: Замена компонентов

#### Замена страницы Products:

```bash
# Резервная копия
cp src/pages/Products.tsx src/pages/Products.backup.tsx

# Замена на интегрированную версию
cp src/pages/ProductsIntegrated.tsx src/pages/Products.tsx
```

#### Замена страницы LineOperator:

```bash
# Если существует
cp src/pages/LineOperator.tsx src/pages/LineOperator.backup.tsx

# Замена на интегрированную версию
cp src/pages/LineOperatorIntegrated.tsx src/pages/LineOperator.tsx
```

### Шаг 5: Обновление маршрутизации

В `src/App.tsx` или основном роутере добавить:

```typescript
import LineOperator from './pages/LineOperator';

// В роутах
<Route path="/line-operator" element={<LineOperator />} />
```

### Шаг 6: Обновление навигации

В компоненте навигации добавить ссылку на оператора линии:

```typescript
{
  name: 'Оператор линии',
  href: '/line-operator',
  icon: ScanLine,
  current: pathname === '/line-operator'
}
```

## Конфигурация для разработки

### Переменные окружения (.env.local)

```env
VITE_SUPABASE_URL=https://fpgzozsspaipegxcfzug.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_R2_ENDPOINT=https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=ZSBP4Gp0KZxeB_zfiKO6fK0edsF6pVSv1pSxEYrz
VITE_R2_SECRET_ACCESS_KEY=b5b628fc059397696f40915800d462611e7f6546d89a206f46aa42aedc9f4386
VITE_R2_BUCKET_NAME=markirovka-storage
```

### Обновление конфигурации (src/config/config.ts)

```typescript
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://fpgzozsspaipegxcfzug.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const r2Config = {
  endpoint:
    import.meta.env.VITE_R2_ENDPOINT ||
    'https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com',
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || 'ZSBP4Gp0KZxeB_zfiKO6fK0edsF6pVSv1pSxEYrz',
  secretAccessKey:
    import.meta.env.VITE_R2_SECRET_ACCESS_KEY ||
    'b5b628fc059397696f40915800d462611e7f6546d89a206f46aa42aedc9f4386',
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || 'markirovka-storage',
};
```

## Тестирование интеграции

### 1. Тест подключения к Supabase

```typescript
// В браузерной консоли
import { supabaseService } from './src/services/supabaseService';

// Проверка подключения
const products = await supabaseService.getProducts();
console.log('Products from DB:', products);
```

### 2. Тест загрузки в R2

```typescript
// В браузерной консоли
import { r2Service } from './src/services/r2Service';

// Создание тестового файла
const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
const result = await r2Service.uploadFile(testFile, 'test/test.txt');
console.log('Upload result:', result);
```

### 3. Тест интегрированного сервиса

```typescript
// В браузерной консоли
import { dataService } from './src/services/dataService';

// Создание тестового товара
const product = await dataService.createProduct({
  name: 'Тестовый товар',
  sku: 'TEST-001',
  category: 'Прочее',
});
console.log('Created product:', product);
```

## Отладка и устранение проблем

### Распространенные ошибки

#### 1. CORS ошибки

**Проблема:** Blocked by CORS policy **Решение:** Проверить настройки CORS в Supabase Dashboard и R2

#### 2. Ошибки аутентификации

**Проблема:** Invalid API key **Решение:** Проверить правильность ключей в конфигурации

#### 3. Ошибки типов TypeScript

**Проблема:** Type mismatch **Решение:** Обновить интерфейсы в `src/types/entities.ts`

### Логирование

Все сервисы логируют ошибки в консоль браузера:

```typescript
try {
  // операция с БД
} catch (err) {
  console.error('Database operation failed:', err);
  // fallback логика
}
```

## Мониторинг производительности

### Метрики для отслеживания

- Время отклика запросов к Supabase
- Размер загружаемых файлов в R2
- Частота ошибок подключения
- Использование квоты Supabase

### Инструменты мониторинга

- Supabase Dashboard для метрик БД
- Cloudflare Analytics для R2
- Browser DevTools для клиентской производительности

## Резервное копирование данных

### Автоматическое резервное копирование

Supabase автоматически создает резервные копии каждые 24 часа.

### Ручное резервное копирование

```sql
-- Экспорт критических таблиц
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM templates) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM print_jobs) TO STDOUT WITH CSV HEADER;
```

## Масштабирование

### Оптимизация запросов

- Использование индексов для частых запросов
- Пагинация для больших наборов данных
- Кэширование часто запрашиваемых данных

### Горизонтальное масштабирование

- Read replicas в Supabase Pro
- CDN для статических файлов
- Кэширование Redis для сессий
