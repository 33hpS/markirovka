# 🚀 Пошаговая инструкция: Настройка GitHub Secrets

## Шаг 1: Получение токенов Cloudflare

### 1.1 Получить CLOUDFLARE_ACCOUNT_ID

1. Откройте браузер и перейдите на https://dash.cloudflare.com/
2. Войдите в свой аккаунт Cloudflare
3. В левом меню выберите **Workers & Pages**
4. Справа найдите блок с информацией об аккаунте
5. Скопируйте **Account ID** (32-символьная строка типа `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

💾 **Сохраните Account ID** - он понадобится дальше!

---

### 1.2 Создать CLOUDFLARE_API_TOKEN

1. На той же странице Cloudflare Dashboard
2. Нажмите на ваш профиль (иконка в правом верхнем углу)
3. Выберите **My Profile**
4. В левом меню выберите **API Tokens**
5. Нажмите кнопку **Create Token**
6. Найдите шаблон **Edit Cloudflare Workers** и нажмите **Use template**
7. Настройте права токена:

   ```
   Permissions:
   ✅ Account | Workers Scripts | Edit
   ✅ Account | Account Settings | Read

   Account Resources:
   ✅ Include | Your Account Name
   ```

8. Нажмите **Continue to summary**
9. Нажмите **Create Token**
10. **ВАЖНО:** Скопируйте токен СЕЙЧАС - он больше не отобразится!

💾 **Сохраните API Token** в безопасном месте!

---

## Шаг 2: Добавление секретов в GitHub

### 2.1 Перейти в настройки репозитория

1. Откройте ваш репозиторий: https://github.com/33hpS/markirovka
2. Нажмите на вкладку **Settings** (⚙️ настройки в верхнем меню)
3. В левом меню найдите раздел **Security**
4. Раскройте **Secrets and variables**
5. Нажмите на **Actions**

---

### 2.2 Добавить секреты

Теперь добавьте каждый секрет по очереди:

#### Секрет 1: CLOUDFLARE_ACCOUNT_ID

1. Нажмите кнопку **New repository secret** (зеленая кнопка справа)
2. В поле **Name** введите: `CLOUDFLARE_ACCOUNT_ID`
3. В поле **Secret** вставьте ваш Account ID из шага 1.1
4. Нажмите **Add secret**

✅ Секрет добавлен!

---

#### Секрет 2: CLOUDFLARE_API_TOKEN

1. Снова нажмите **New repository secret**
2. В поле **Name** введите: `CLOUDFLARE_API_TOKEN`
3. В поле **Secret** вставьте ваш API Token из шага 1.2
4. Нажмите **Add secret**

✅ Секрет добавлен!

---

#### Секрет 3: CODECOV_TOKEN (Опционально)

**Если планируете использовать Codecov для отчетов о покрытии кода:**

1. Перейдите на https://codecov.io/
2. Войдите через GitHub
3. Добавьте репозиторий `33hpS/markirovka`
4. Скопируйте Upload Token из настроек репозитория
5. В GitHub Secrets добавьте новый секрет:
   - **Name:** `CODECOV_TOKEN`
   - **Secret:** Ваш токен из Codecov
6. Нажмите **Add secret**

**Если НЕ планируете использовать Codecov** - пропустите этот шаг. CI будет работать, просто без
загрузки coverage отчетов.

---

## Шаг 3: Проверка настроек

### 3.1 Проверить добавленные секреты

После добавления вы должны видеть список секретов:

```
Repository secrets:
✅ CLOUDFLARE_ACCOUNT_ID        Updated now
✅ CLOUDFLARE_API_TOKEN          Updated now
⭕ CODECOV_TOKEN                 Updated now (опционально)
```

**Важно:** Вы не сможете просмотреть значения секретов после добавления - это нормально и правильно
с точки зрения безопасности!

---

### 3.2 Создать R2 bucket в Cloudflare (если еще не создан)

Ваш проект использует R2 для хранения файлов. Нужно создать bucket:

1. В Cloudflare Dashboard перейдите в **R2**
2. Нажмите **Create bucket**
3. Введите имя: `markirovka-storage` (как указано в wrangler.toml)
4. Выберите регион (рекомендуется: Automatic)
5. Нажмите **Create bucket**

✅ Bucket создан!

---

## Шаг 4: Тестирование CI/CD

### 4.1 Запустить workflow вручную

1. Перейдите во вкладку **Actions** вашего репозитория
2. Выберите workflow **CI** в левом меню
3. Нажмите **Run workflow** (справа)
4. Выберите branch **main**
5. Нажмите зеленую кнопку **Run workflow**

Подождите несколько минут, пока выполнятся все шаги.

---

### 4.2 Проверить результаты

Успешный запуск должен показать:

```
✅ Lint & Test     - Проверка кода и тесты
✅ Deploy          - Деплой на Cloudflare Workers
✅ E2E Smoke       - Smoke тесты на задеплоенном сайте
```

Если какой-то шаг упал с ошибкой - кликните на него, чтобы увидеть подробные логи.

---

## Шаг 5: Проверка деплоя

После успешного деплоя ваше приложение будет доступно по адресу:

```
https://markirovka.{ваш-account-id}.workers.dev
```

Или, если настроен custom домен:

```
https://ваш-домен.com
```

Проверьте эндпоинты:

- `https://your-worker-url/health` - должен вернуть `ok`
- `https://your-worker-url/version` - должен показать версию и commit

---

## ❓ Решение проблем

### Ошибка: "Authentication error"

**Решение:** Проверьте правильность `CLOUDFLARE_API_TOKEN`. Убедитесь, что токен имеет права на
редактирование Workers Scripts.

### Ошибка: "Account not found"

**Решение:** Проверьте правильность `CLOUDFLARE_ACCOUNT_ID`. Убедитесь, что скопировали полный ID
(32 символа).

### Ошибка: "R2 bucket not found"

**Решение:** Создайте R2 bucket с именем `markirovka-storage` в вашем Cloudflare аккаунте (см. Шаг
3.2).

### Ошибка: "codecov upload failed"

**Решение:** Если не используете Codecov - это нормально, шаг просто пропустится. Если хотите
использовать - добавьте `CODECOV_TOKEN`.

---

## 📝 Checklist

Используйте этот checklist для проверки:

- [ ] Получен CLOUDFLARE_ACCOUNT_ID
- [ ] Создан CLOUDFLARE_API_TOKEN с правильными правами
- [ ] Добавлен секрет CLOUDFLARE_ACCOUNT_ID в GitHub
- [ ] Добавлен секрет CLOUDFLARE_API_TOKEN в GitHub
- [ ] Создан R2 bucket `markirovka-storage` в Cloudflare
- [ ] Запущен workflow вручную для проверки
- [ ] Все шаги CI/CD прошли успешно (зеленые галочки)
- [ ] Приложение доступно по Worker URL
- [ ] Эндпоинты /health и /version работают

---

## 🎉 Готово!

Теперь при каждом push в ветку `main` автоматически будут выполняться:

1. ✅ Линтинг и проверка типов TypeScript
2. ✅ Запуск тестов с coverage
3. ✅ Сборка приложения
4. ✅ Деплой на Cloudflare Workers
5. ✅ E2E smoke тесты на production

Continuous Deployment настроен! 🚀

---

**Дата создания:** 8 октября 2025  
**Репозиторий:** https://github.com/33hpS/markirovka
