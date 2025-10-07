# 🚀 Быстрый старт - настройка после деплоя

## ✅ Деплой завершён успешно!

Worker развёрнут: **https://markirovka.sherhan1988hp.workers.dev**

## 🔧 Что нужно настроить (5 минут)

### 1. Добавить переменные Supabase в Cloudflare

Откройте:
https://dash.cloudflare.com/704015f3ab3baf13d815b254aee29972/workers/services/view/markirovka/production/settings

1. Перейдите в **Variables and Secrets**
2. Нажмите **Add variable**
3. Добавьте:

```
Имя: SUPABASE_URL
Значение: https://your-project-id.supabase.co
Тип: Environment Variable (не секрет)
```

```
Имя: SUPABASE_ANON_KEY
Значение: ваш anon key (из Supabase Dashboard > Settings > API)
Тип: Environment Variable
```

4. Нажмите **Save and Deploy**

### 2. Проверить работу

После добавления переменных откройте приложение: https://markirovka.sherhan1988hp.workers.dev

Нажмите на индикатор **"Сервисы"** в правом верхнем углу - все должно быть зелёным!

### 3. Проверить API (опционально)

```bash
# Worker
curl https://markirovka.sherhan1988hp.workers.dev/health

# Supabase
curl https://markirovka.sherhan1988hp.workers.dev/api/health/supabase

# R2
curl https://markirovka.sherhan1988hp.workers.dev/api/health/r2
```

## 📱 Мониторинг

В приложении теперь есть:

- **Индикатор в хедере** - показывает общий статус
- **Индикатор в футере** - дублирует статус
- **Страница `/system-status`** - детальная диагностика всех сервисов

## 🔄 Автоматический деплой

При каждом `git push` GitHub Actions автоматически:

1. Запускает тесты
2. Проверяет код
3. Собирает проект
4. Деплоит на Cloudflare

## 📚 Полная документация

См. `CLOUDFLARE_DEPLOYMENT.md` для подробной информации.

## ⚠️ Важно

- Переменные окружения нужно добавить **только один раз**
- После добавления они будут работать автоматически при каждом деплое
- R2 уже настроен и работает
- Worker автоматически проверяет подключения каждую минуту

## 🎉 Готово!

После настройки переменных всё будет работать автоматически!
