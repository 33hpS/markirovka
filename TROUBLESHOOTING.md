# Cloudflare Pages Troubleshooting Guide

## 🚨 Common Deployment Issues and Solutions

### Issue 1: "Wrangler requires Node.js v20+" Error

**Error**: `Wrangler requires at least Node.js v20.0.0. You are using v18.20.8`

**Cause**: Cloudflare Pages is treating the project as a Workers project instead of a static site.

**Solutions**:

1. **Set Node.js version to 20**:
   - In Cloudflare Pages Dashboard → Settings → Environment Variables
   - Add: `NODE_VERSION` = `20`

2. **Disable Workers/Functions**:
   - Go to Pages project → Settings → Functions
   - Set "Node.js compatibility" to **OFF**
   - Clear all "Compatibility flags"
   - Ensure no `wrangler.toml` file exists

3. **Verify build settings**:
   - Build command: `npm run build` (NOT `npx wrangler deploy`)
   - Output directory: `dist`
   - Framework: None or React

### Issue 2: Engine Compatibility Warnings

**Warnings**: `EBADENGINE Unsupported engine` for various packages

**Solutions**:

- ✅ **Fixed**: Updated package.json with Node 18+ compatible versions
- ✅ **Fixed**: Added engines field specifying Node ≥18.0.0
- ✅ **Fixed**: Downgraded problematic dependencies

### Issue 3: Submodule Errors

**Error**: `error occurred while updating repository submodules`

**Solution**: ✅ **Fixed**: Removed nested git directories

### Issue 4: Build Command Detection

**Problem**: Cloudflare tries to run wrong commands

**Solution**:

1. **Explicit build configuration**:

   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

2. **Environment variables**:
   ```
   NODE_VERSION=20
   NPM_FLAGS=--legacy-peer-deps
   ```

## ✅ Current Project Status

### Dependencies Fixed ✅

- ✅ react-router → react-router-dom (Node 18 compatible)
- ✅ rimraf v6 → v4 (Node 18 compatible)
- ✅ Added engines field for Node ≥18
- ✅ Updated Vite config for new router

### Configuration Fixed ✅

- ✅ `.nvmrc` file with Node 20
- ✅ Updated deployment guide
- ✅ Cleaned `_routes.json`
- ✅ Proper static site setup

### Build Process ✅

- ✅ TypeScript compilation passes
- ✅ Vite build succeeds
- ✅ Output size optimized
- ✅ Code splitting configured

## 🚀 Recommended Cloudflare Pages Setup

### 1. Project Configuration

```
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: / (default)
```

### 2. Environment Variables

```
NODE_VERSION=20
VITE_API_BASE_URL=https://your-api.com/api
VITE_APP_TITLE=Маркировочная система
```

### 3. Functions Settings

```
Node.js compatibility: OFF
Compatibility flags: (empty)
Workers: Disabled
```

## 🔧 Manual Deployment Test

To test locally before Cloudflare deployment:

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build for production
npm run build

# Preview locally
npm run preview
```

Expected output:

```
✓ 31 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.40 kB
dist/assets/index-B89X4AwN.css    0.68 kB │ gzip:  0.42 kB
dist/assets/router-_x1fss-r.js    0.03 kB │ gzip:  0.05 kB
dist/assets/ui-DDgd1whb.js        0.92 kB │ gzip:  0.58 kB
dist/assets/index-B2SJnuOB.js     2.17 kB │ gzip:  1.03 kB
dist/assets/vendor-cxkclgJA.js  140.86 kB │ gzip: 45.26 kB
✓ built in <1s
```

## 📋 Deployment Checklist

Before deploying to Cloudflare Pages:

- ✅ Node.js version set to 20
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ No `wrangler.toml` file
- ✅ Functions disabled
- ✅ Environment variables configured
- ✅ Local build test passes

## 🆘 If Issues Persist

1. **Check build logs** for specific error messages
2. **Verify Node.js version** in deployment logs
3. **Ensure build command** is `npm run build` not `wrangler`
4. **Contact support** with specific error messages

---

## 🔑 SSH Настройка (Подробно)

Если решено полностью перейти на SSH (рекомендуется для постоянной разработки):

### 1. Генерация ключа

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
# Нажмите Enter трижды (путь по умолчанию и пустая passphrase)
```

Файлы: `~/.ssh/id_ed25519` (приватный), `~/.ssh/id_ed25519.pub` (публичный).

### 2. Добавление ключа в ssh-agent (опционально, если используете passphrase)

```powershell
Start-Service ssh-agent  # (если не запущен)
ssh-add $HOME/.ssh/id_ed25519
```

### 3. Добавление ключа на GitHub

```powershell
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard
```

GitHub → Settings → SSH and GPG keys → New SSH key → вставить → сохранить.

### 4. Проверка соединения

```powershell
ssh -T git@github.com
```

Ожидаемо: `Hi USERNAME! You've successfully authenticated...` (может спросить подтверждение
fingerprint — отвечаем `yes`).

### 5. Смена origin на SSH

```powershell
git remote set-url origin git@github.com:33hpS/markirovka.git
git remote -v
```

Должно стать:

```
origin  git@github.com:33hpS/markirovka.git (fetch)
origin  git@github.com:33hpS/markirovka.git (push)
```

### 6. Тест push

```powershell
git push origin main
```

### 7. Возможные проблемы

- `Permission denied (publickey)` → ключ не добавлен или ssh-agent не загрузил.
- В корпоративной сети: может блокироваться порт 22. Решение — включить SSH через HTTPS: Добавьте в
  `~/.ssh/config`:
  ```
  Host github.com
     HostName ssh.github.com
     Port 443
  ```

### 8. Возврат к HTTPS (если нужно)

```powershell
git remote set-url origin https://github.com/33hpS/markirovka.git
```

---

**Status**: All major issues resolved ✅  
**Ready for deployment**: Yes ✅

---

## 🔐 Git Push Hangs After pre-push (Credentials Issue)

### Симптом

`git push` выполняет Husky `pre-push` (видно вывод Vitest: _No test files found, exiting with code
0_) и затем зависает без прогресса (нет `Counting objects...`).

### Причина

Чаще всего — проблемы с менеджером учетных данных (Git Credential Manager) в Windows: сохранены
битые или устаревшие токены GitHub или блокируется системный диалог авторизации.

### Быстрая проверка

```powershell
$env:GIT_TRACE=1; git push origin main
```

Если повторно видите только вывод хука и тишину → переходите к сбросу учетных данных.

### Решение 1: Очистить старые учетные данные и заново ввести PAT

1. Win+R → `control keymgr.dll` (или Панель управления → Диспетчер учетных данных → Учетные данные
   Windows).
2. Удалить записи вида `git:https://github.com` / `github.com`.
3. (Опционально) Очистить helper:
   ```powershell
   git credential-manager clear
   ```
4. Повторить push без helper, чтобы форсировать запрос:
   ```powershell
   git -c credential.helper= push origin main
   ```
5. Ввести GitHub username и **PAT** (не пароль аккаунта). PAT создать здесь: Settings → Developer
   settings → Personal access tokens (classic) → Generate new → scopes: `repo`.

### Решение 2: Перейти на SSH

```powershell
ssh-keygen -t ed25519 -C "you@example.com"
Get-Content ~/.ssh/id_ed25519.pub  # скопируй
```

Добавить ключ: GitHub → Settings → SSH and GPG keys → New SSH key. Затем:

```powershell
git remote set-url origin git@github.com:33hpS/markirovka.git
ssh -T git@github.com
git push origin main
```

### Решение 3: Временный пропуск тестов (для ускорения отладки)

Добавить в `.husky/pre-push` (bash синтаксис):

```sh
#!/usr/bin/env sh
[ "$SKIP_TESTS" = "1" ] && echo "[pre-push] SKIP_TESTS=1 -> skip tests" && exit 0
npx vitest --passWithNoTests
```

Тогда:

```powershell
$env:SKIP_TESTS=1; git push origin main; Remove-Item Env:SKIP_TESTS
```

### Проверка что push прошёл

```powershell
git rev-parse HEAD
git rev-parse origin/main
```

Хэши должны совпасть. Иначе повторите очистку credential helper.

### Признаки сетевой блокировки

Если при `GIT_CURL_VERBOSE=1` зависает после `Expect: 100-continue` → возможно, VPN / фильтр
трафика. Отключите их временно.

### Кратко

- Нет запроса логина → зависание → очистить учётки.
- PAT вместо пароля.
- SSH — надёжная альтернатива.

---
