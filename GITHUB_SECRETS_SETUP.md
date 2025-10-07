# Настройка GitHub Secrets для CI/CD

## Необходимые секреты

Для корректной работы GitHub Actions необходимо добавить следующие секреты в настройках репозитория.

### Как добавить секреты:

1. Перейдите на GitHub: https://github.com/33hpS/markirovka
2. Нажмите **Settings** (вкладка в верхнем меню репозитория)
3. В левом меню выберите **Secrets and variables** → **Actions**
4. Нажмите **New repository secret** для каждого секрета ниже

---

## 🔑 Список секретов

### 1. CLOUDFLARE_API_TOKEN

**Описание:** API токен для деплоя на Cloudflare Workers  
**Как получить:**

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **My Profile** → **API Tokens**
3. Нажмите **Create Token**
4. Выберите шаблон **Edit Cloudflare Workers** или создайте custom token с правами:
   - Account → Cloudflare Workers Scripts → Edit
   - Account → Account Settings → Read
5. Скопируйте токен и добавьте в GitHub Secrets

**Имя секрета:** `CLOUDFLARE_API_TOKEN`  
**Значение:** Ваш API токен из Cloudflare

---

### 2. CLOUDFLARE_ACCOUNT_ID

**Описание:** ID вашего аккаунта Cloudflare  
**Как получить:**

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Выберите любой домен или перейдите в Workers & Pages
3. В правой боковой панели найдите **Account ID**
4. Скопируйте ID (формат: 32-символьная строка)

**Имя секрета:** `CLOUDFLARE_ACCOUNT_ID`  
**Значение:** Ваш Account ID из Cloudflare

---

### 3. CODECOV_TOKEN (Опционально)

**Описание:** Токен для загрузки отчетов о покрытии кода тестами  
**Как получить:**

1. Зарегистрируйтесь на [Codecov.io](https://codecov.io/)
2. Подключите ваш GitHub репозиторий
3. Скопируйте токен из настроек репозитория

**Имя секрета:** `CODECOV_TOKEN`  
**Значение:** Ваш токен из Codecov

⚠️ **Если не используете Codecov**, можно пропустить этот секрет. CI не упадет, просто пропустит шаг
загрузки coverage.

---

### 4. WORKER_BASE_URL (Опционально)

**Описание:** Базовый URL вашего деплоя на Cloudflare Workers  
**Формат:** `https://markirovka.{ACCOUNT_ID}.workers.dev` или ваш custom домен

**Имя секрета:** `WORKER_BASE_URL`  
**Значение:** Например: `https://markirovka.your-account-id.workers.dev`

⚠️ **Если не указать**, будет использован автоматически сгенерированный URL на основе
CLOUDFLARE_ACCOUNT_ID.

---

## 📋 Быстрая проверка

После добавления секретов:

1. Перейдите в **Actions** в вашем репозитории
2. Запустите workflow вручную или сделайте новый commit
3. Проверьте, что все шаги выполняются успешно

---

## 🛠️ Текущий статус секретов

### Обязательные (для деплоя):

- [ ] `CLOUDFLARE_API_TOKEN` - **Требуется**
- [ ] `CLOUDFLARE_ACCOUNT_ID` - **Требуется**

### Опциональные:

- [ ] `CODECOV_TOKEN` - Для отчетов о покрытии кода
- [ ] `WORKER_BASE_URL` - Если используете custom домен

---

## 🔒 Безопасность

⚠️ **Важно:**

- Никогда не коммитьте секреты в код
- Не публикуйте токены в issues или PR
- Используйте токены с минимально необходимыми правами
- Периодически обновляйте API токены

---

## 📚 Дополнительная документация

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Cloudflare Workers Deploy](https://developers.cloudflare.com/workers/wrangler/ci-cd/)

---

## ❓ Проблемы?

Если после добавления секретов CI/CD все еще не работает:

1. Проверьте правильность имен секретов (они чувствительны к регистру)
2. Убедитесь, что API токен имеет необходимые права
3. Проверьте логи GitHub Actions для подробной информации об ошибках
4. Убедитесь, что файл `wrangler.toml` корректно настроен

---

**Последнее обновление:** 8 октября 2025
