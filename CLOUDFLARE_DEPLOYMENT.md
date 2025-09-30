# Cloudflare Pages Deployment Guide

## 🚀 Cloudflare Pages Setup

### Build Configuration
- **Framework preset**: None (or React)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (default)

### Environment Variables
Set these in Cloudflare Pages dashboard under Settings > Environment variables:

```
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=Маркировочная система
VITE_PRINT_SERVICE_URL=https://your-print-service.com
VITE_QR_SERVICE_URL=https://your-qr-service.com
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
```

### Node.js Version
- **Recommended**: `18.x` or `20.x`
- Set in Cloudflare Pages dashboard under Settings > Environment variables:
  - Variable name: `NODE_VERSION`
  - Value: `18` or `20`

### Deployment Steps
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Pages
3. Connect to Git → Select GitHub → Choose `33hpS/markirovka`
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Set environment variables (see above)
6. Deploy!

### Troubleshooting

#### Common Issues:
1. **Submodule errors**: ✅ Fixed (nested git repository removed)
2. **Build failures**: Check Node.js version and environment variables
3. **Missing dependencies**: Ensure package.json is complete

#### Build Logs to Check:
- Node.js version
- npm install success
- TypeScript compilation
- Vite build process

### Performance Optimizations
- Automatic minification ✅
- Code splitting ✅
- Asset optimization ✅
- Gzip compression (automatic on Cloudflare)

## 📝 Custom Headers (Optional)
Create `public/_headers` file for security headers:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 🔄 Continuous Deployment
- Automatic deployments on `main` branch pushes ✅
- Preview deployments for pull requests ✅
- Build status integration with GitHub ✅