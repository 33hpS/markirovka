# 🔐 Система Аутентификации

## Supabase Auth Integration

⚠️ **Важно:** Система использует реальную аутентификацию через Supabase. Для работы необходимо:

1. Настроить проект в [Supabase](https://supabase.com)
2. Установить переменные окружения:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Создать пользователей через Supabase Dashboard или API

### Создание пользователей

Пользователи создаются через:

- **Supabase Dashboard:** Authentication → Users → Add User
- **Supabase API:** `auth.signUp()` метод
- **SQL:** INSERT в таблицу auth.users (не рекомендуется)

Роли и права хранятся в `user_metadata`:

```json
{
  "firstName": "Александр",
  "lastName": "Петров",
  "role": "admin",
  "permissions": ["users.manage", "system.config", "audit.view"]
}
```

## Архитектура

### Компоненты

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Интеграция с Supabase Auth
   - Функции: `login()`, `logout()`, `usePermission()`, `useRole()`
   - Автоматическая инициализация сессии
   - Проверка доступности Supabase

2. **Login** (`src/pages/Login.tsx`)
   - Форма входа с валидацией
   - Обработка ошибок
   - Автоматический редирект после входа

3. **ProtectedRoute** (`src/routes/ProtectedRoute.tsx`)
   - Защита маршрутов от неавторизованного доступа
   - Редирект на `/login` с сохранением исходного URL
   - Состояние загрузки

4. **Сервисы**
   - `src/services/supabaseService.ts` - Интеграция с Supabase
   - `src/config/config.ts` - Конфигурация Supabase

### Поток аутентификации

1. Пользователь вводит email/пароль → `Login.tsx`
2. Вызывается `login()` из AuthContext
3. AuthContext вызывает `supabase.signIn(email, password)`
4. Supabase проверяет credentials и возвращает session
5. Извлечение user metadata (роль, права, имя)
6. Сохранение токена доступа в состоянии
7. Редирект на защищённый маршрут

### Текущая реализация

**Supabase Auth:**

- ✅ Реальная проверка учётных данных
- ✅ JWT токены с автоматическим refresh
- ✅ Безопасное хранение сессий
- ✅ Built-in защита от CSRF
- ✅ Email верификация (опционально)
- ✅ Password reset flow (опционально)

### Расширенные возможности

Для добавления дополнительных функций:

1. **Email верификация:**

   ```typescript
   await supabase.auth.signUp({
     email,
     password,
     options: { emailRedirectTo: 'https://yourapp.com/verify' },
   });
   ```

2. **Password reset:**

   ```typescript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'https://yourapp.com/reset-password',
   });
   ```

3. **OAuth провайдеры:**
   ```typescript
   await supabase.auth.signInWithOAuth({
     provider: 'google', // или 'github', 'gitlab', etc.
   });
   ```

## Безопасность

- ✅ **JWT токены** - Автоматическое управление через Supabase
- ✅ **Refresh tokens** - Автоматическое обновление без logout
- ✅ **Secure storage** - Supabase использует httpOnly cookies
- ✅ **CSRF protection** - Built-in защита в Supabase
- ✅ **Rate limiting** - Защита от brute-force атак
- ✅ **Password policies** - Настраиваемые требования к паролям
- ✅ **Защита маршрутов** - Через ProtectedRoute компонент
- ✅ **Role-based permissions** - Хранение в user_metadata

### Рекомендации по безопасности

1. **Используйте сильные пароли** для всех пользователей
2. **Включите email verification** в production
3. **Настройте Row Level Security (RLS)** в Supabase для таблиц
4. **Храните секреты** в переменных окружения, не в коде
5. **Регулярно обновляйте** зависимости и Supabase SDK

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
