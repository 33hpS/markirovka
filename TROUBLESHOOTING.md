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

**Status**: All major issues resolved ✅  
**Ready for deployment**: Yes ✅