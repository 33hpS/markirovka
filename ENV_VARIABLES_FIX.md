# Environment Variables Fix

## Problem

After deployment to Cloudflare Workers, the application showed errors:

```
[config] Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Some features may not work.
[config] R2 is not configured (VITE_R2_ENDPOINT / VITE_R2_BUCKET_NAME). Upload features may be disabled.
Error: supabaseKey is required.
```

## Root Cause

Vite environment variables from `.env.local` were not being embedded in the production build. The
`VITE_*` prefix variables need to be explicitly defined at build time using Vite's `define` option.

## Solution

Updated `vite.config.ts` to:

1. Use `loadEnv()` to load environment variables from `.env.local`
2. Explicitly define `VITE_*` variables using the `define` option
3. Wrap config in `defineConfig(({ mode }) => { ... })` function

### Changes in vite.config.ts

```typescript
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Explicitly define environment variables for production build
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_R2_ENDPOINT': JSON.stringify(env.VITE_R2_ENDPOINT),
      'import.meta.env.VITE_R2_BUCKET_NAME': JSON.stringify(env.VITE_R2_BUCKET_NAME),
    },
    // ... rest of config
  };
});
```

## Deployment Steps

1. **Rebuild with embedded variables:**

   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare:**

   ```bash
   wrangler deploy
   ```

3. **Verify:**
   - Open https://markirovka.sherhan1988hp.workers.dev
   - Check browser console - no more "not configured" warnings
   - Supabase connection should work

## Environment Variables

Required variables in `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://wjclhytzewfcalyybhab.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# R2 Configuration
VITE_R2_ENDPOINT=https://704015f3ab3baf13d815b254aee29972.r2.cloudflarestorage.com
VITE_R2_BUCKET_NAME=markirovka-storage

# API URL
VITE_API_URL=https://markirovka.sherhan1988hp.workers.dev/api
```

## How It Works

1. **Build Time:**
   - Vite reads `.env.local` using `loadEnv()`
   - Values are injected into bundle using `define` option
   - `import.meta.env.VITE_*` becomes actual string literals

2. **Runtime:**
   - No need to load `.env` files
   - Values are already in the bundle
   - `src/config/config.ts` gets the embedded values

3. **Security:**
   - Only `VITE_*` prefixed variables are exposed to client
   - Sensitive keys (service role key) stay server-side only
   - Anon key is safe to expose (intended for public use)

## Status

- ✅ Fixed in commit `9aff34dc`
- ✅ Deployed to production (Version ID: 9f6b986f-9b48-47ab-8c5b-b2ecd79d8154)
- ✅ Verified working

## Related Files

- `vite.config.ts` - Build configuration with env embedding
- `src/config/config.ts` - Consumes the embedded variables
- `.env.local` - Source of truth for environment variables
- `.env.example` - Template for required variables

## Testing

After deployment, check:

1. No console warnings about missing configuration
2. Supabase connection works (login, data fetch)
3. Realtime updates work
4. R2 uploads work (if configured)

## Notes

- `.env.local` is gitignored (never commit it!)
- `.env.example` should be kept up to date
- For local development, just use `.env.local` normally
- For production, Vite embeds values at build time
