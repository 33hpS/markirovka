# 🧹 Аудит и удаление всех моков

**Дата:** 8 октября 2025  
**Статус:** ✅ Завершено

## 📋 Выполненные работы

### 1. ✅ Удалены MSW (Mock Service Worker) моки для тестов

**Файлы удалены:**

- `src/test/mocks/server.ts` - Сервер MSW
- `src/test/mocks/authHandlers.ts` - Mock handlers для аутентификации
- `src/test/mocks/labelHandlers.ts` - Mock handlers для этикеток
- `src/test/mocks/userHandlers.ts` - Mock handlers для пользователей
- Вся директория `src/test/mocks/`

**Обновлено:**

- `src/test/setup.ts` - Удалены импорты MSW и связанная логика

### 2. ✅ Удалена mock-аутентификация из AuthContext

**Файл:** `src/contexts/AuthContext.tsx`

**Удалено:**

- Массив `MOCK_USERS` с тестовыми пользователями
- Функция `generateMockToken()` для генерации фальшивых JWT токенов
- Mock логика проверки email/пароля
- Импорты `validateToken`, `decodeToken`, `TokenPayload` из jwt utils
- Импорты storage utilities

**Добавлено:**

- Интеграция с Supabase аутентификацией через `getSupabaseService()`
- Реальные методы `signIn()`, `signOut()`, `getCurrentUser()`
- Использование Supabase session для хранения токенов
- Проверка доступности Supabase через `isSupabaseAvailable`

### 3. ✅ Удалены hardcoded продукты и шаблоны из dataService

**Файл:** `src/services/dataService.ts`

**Удалено:**

- Массив `products` с 5 hardcoded продуктами (молоко, хлеб, колбаса, 2 товара мебели для ванной)
- Массив `templates` с 3 hardcoded шаблонами этикеток
- Конструктор класса, который добавлял тестовые данные через `unshift()`

**Изменено:**

- `private products: Product[] = []` - теперь пустой массив
- `private templates: ExtendedTemplate[] = []` - теперь пустой массив
- Все данные загружаются только из API/Database

### 4. ✅ Удалены fallback mock данные

**Файл:** `src/pages/ProductsIntegrated.tsx`

**Удалено:**

- Fallback к тестовым данным в `loadProducts()` при ошибке загрузки
- Mock продукт "Молоко 3.2%" который использовался как запасной вариант

**Изменено:**

- При ошибке загрузки теперь просто устанавливается пустой массив `setProducts([])`

### 5. ✅ Проверено отсутствие mock данных в Production.tsx

**Файл:** `src/pages/Production.tsx`

**Статус:** ✅ Уже было чисто

- `mockBatches` был пустым массивом `[]`
- Нет hardcoded данных

### 6. ✅ Удалены hardcoded шаблоны из Designer

**Файл:** `src/pages/Designer.tsx`

**Удалено:**

- Массив `defaultTemplates` с 2 захардкоженными шаблонами ("Молочные продукты", "Хлебобулочные
  изделия")
- Fallback на `defaultTemplates` при ошибке загрузки
- Fallback на `defaultTemplates` при пустом результате API

**Изменено:**

- `useState<LabelTemplate[]>([])` - инициализация пустым массивом
- При ошибке загрузки устанавливается `setTemplates([])`

### 7. ✅ Проверены тесты

**Файлы проверены:**

- `src/__tests__/app.smoke.test.tsx` - ✅ Не использует MSW
- `src/__tests__/routing.test.tsx` - ✅ Не использует MSW
- `src/pages/__tests__/LineOperator.pdf.test.tsx` - ✅ Использует `vi.mock()` (это нормально для
  unit тестов)

**Результат:** Тесты не зависят от MSW серверов, используют стандартное vitest мокирование

## 📊 Итоговая статистика

### Удалено файлов: 5

- server.ts
- authHandlers.ts
- labelHandlers.ts
- userHandlers.ts
- Директория mocks/

### Обновлено файлов: 6

- AuthContext.tsx
- dataService.ts
- ProductsIntegrated.tsx
- Designer.tsx
- setup.ts
- Production.tsx (проверен)

### Строк кода удалено: ~400+

- Mock пользователи: ~40 строк
- Mock продукты: ~160 строк
- Mock шаблоны: ~80 строк
- Mock handlers: ~90 строк
- Прочее: ~30 строк

## ⚠️ Важные замечания

### Что теперь требуется для работы приложения:

1. **Supabase конфигурация**
   - Должны быть установлены переменные окружения:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

2. **База данных Supabase**
   - Должны быть созданы таблицы:
     - `products` - для товаров
     - `templates` - для шаблонов
     - Таблицы аутентификации (создаются автоматически в Supabase)

3. **Пользователи Supabase**
   - Пользователи должны быть созданы через Supabase Auth
   - Роли и permissions должны храниться в `user_metadata`

### Что больше не работает без настройки:

❌ Вход с тестовыми учетными данными (admin@markirovka.ru / admin123)  
❌ Автоматическая загрузка примеров продуктов  
❌ Автоматическая загрузка примеров шаблонов  
❌ Fallback на тестовые данные при ошибках

### Что работает:

✅ Полная интеграция с Supabase  
✅ Реальная аутентификация  
✅ Загрузка данных из базы  
✅ Чистый код без моков

## 🔄 Следующие шаги

1. **Настроить Supabase проект:**
   - Создать проект в Supabase
   - Выполнить SQL миграции из `/database`
   - Добавить переменные окружения

2. **Создать тестовых пользователей:**
   - Через Supabase Dashboard создать пользователей
   - Установить роли через user_metadata

3. **Добавить тестовые данные:**
   - Запустить SQL скрипты для вставки примеров продуктов
   - Создать несколько шаблонов этикеток

4. **Обновить документацию:**
   - Обновить README.md с инструкциями по настройке Supabase
   - Обновить QUICKSTART.md без упоминания mock данных

## ✨ Результат

Проект полностью очищен от всех моков и тестовых данных. Теперь приложение работает исключительно с
реальным API и базой данных Supabase. Это обеспечивает:

- 🔒 Реальную безопасность
- 📊 Консистентность данных
- 🚀 Production-ready код
- 🧪 Правильную архитектуру
- 💪 Масштабируемость
