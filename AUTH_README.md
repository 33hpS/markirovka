# 🔐 Система Аутентификации

## Тестовые учётные данные

### Администратор

- **Email:** admin@markirovka.ru
- **Пароль:** admin123
- **Права:** Полный доступ ко всем разделам системы

### Менеджер

- **Email:** manager@markirovka.ru
- **Пароль:** manager123
- **Права:** Доступ к управлению, просмотр отчётов

### Рабочий

- **Email:** worker@markirovka.ru
- **Пароль:** worker123
- **Права:** Базовый доступ, выполнение операций

## Архитектура

### Компоненты

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Управление состоянием аутентификации
   - Функции: `login()`, `logout()`, `usePermission()`, `useRole()`
   - Хранение токенов в localStorage
   - Автоматическая инициализация при загрузке

2. **Login** (`src/pages/Login.tsx`)
   - Форма входа с валидацией
   - Обработка ошибок
   - Автоматический редирект после входа
   - Отображение тестовых данных

3. **ProtectedRoute** (`src/routes/ProtectedRoute.tsx`)
   - Защита маршрутов от неавторизованного доступа
   - Редирект на `/login` с сохранением исходного URL
   - Состояние загрузки

4. **Утилиты**
   - `src/utils/storage.ts` - Управление токенами в localStorage
   - `src/utils/jwt.ts` - Валидация и декодирование JWT

### Поток аутентификации

1. Пользователь вводит email/пароль → `Login.tsx`
2. Вызывается `login()` из AuthContext
3. Проверка по массиву `MOCK_USERS`
4. Генерация mock JWT токена
5. Сохранение токена в localStorage
6. Обновление состояния AuthContext
7. Редирект на защищённый маршрут

### Текущая реализация

**Mock Backend:**

- Проверка учётных данных против статического массива
- Генерация токена без реального JWT (mock)
- Синхронная валидация

**Для интеграции с реальным API:**

1. Замените `login()` в AuthContext на API вызов
2. Обновите `validateToken()` для проверки с сервером
3. Добавьте обработку refresh токенов
4. Реализуйте автоматическое обновление токена

## Безопасность

- ✅ Токены хранятся в localStorage (для production рекомендуется httpOnly cookies)
- ✅ Валидация токенов при каждой загрузке
- ✅ Автоматический logout при истечении токена
- ✅ Защита маршрутов через ProtectedRoute
- ✅ Role-based permissions

## Deployment

Приложение задеплоено на Cloudflare Workers: **URL:** https://markirovka.sherhan1988hp.workers.dev

### Команды

```bash
# Сборка
npm run build

# Локальный dev сервер
npm run dev

# Деплой на Cloudflare Workers
npm run deploy:worker
```

## Следующие шаги

1. **Интеграция с Backend API**
   - Заменить mock login на реальный API endpoint
   - Добавить refresh token flow
   - Реализовать logout на сервере

2. **UI Improvements**
   - Добавить кнопку logout в Navigation
   - Отображать имя пользователя в header
   - Добавить "Remember me" checkbox
   - Password reset flow

3. **Security Enhancements**
   - Переход на httpOnly cookies для токенов
   - Добавить rate limiting для login
   - Реализовать session timeout warnings
   - 2FA опционально

4. **Permissions**
   - Скрытие UI элементов по правам
   - Проверка прав на backend
   - Детализация ролей и разрешений
