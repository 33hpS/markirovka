// Cloudflare Worker entrypoint serving built Vite assets from /dist via Assets binding.
// Features:
//  - Health endpoint (/health)
//  - Version endpoint (/version) returning commit SHA + package version injected via env
//  - Conditional Sentry (or console) error logging if SENTRY_DSN provided
//  - Cache-Control headers for static assets (immutable hashed files) & HTML
//  - SPA fallback with configurable excluded routes
//  - Configurable no-fallback route list via env.NO_FALLBACK_PATHS (comma separated)

export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      // Pre-parse no-fallback list (cached across requests because module scope)
      if (!globalThis.__NO_FALLBACK) {
        globalThis.__NO_FALLBACK = (env.NO_FALLBACK_PATHS || '')
          .split(',')
          .map(p => p.trim())
          .filter(Boolean);
      }
      const noFallbackList = globalThis.__NO_FALLBACK;

      // Health endpoint (cheap, no asset fetch)
      if (url.pathname === '/health') {
        return new Response('ok', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }

      // Version endpoint: relies on env.COMMIT_SHA and env.PKG_VERSION (configured in deployment)
      if (url.pathname === '/version') {
        const body = JSON.stringify({
          commit: env.COMMIT_SHA || 'unknown',
          version: env.PKG_VERSION || 'unknown',
          time: new Date().toISOString(),
        });
        return new Response(body, {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
          },
        });
      }

      // First try to serve the exact asset
      let response = await env.ASSETS.fetch(request);

      // Apply caching strategy for successful static asset hits
      if (response.ok) {
        const path = url.pathname;
        // Heuristic: hashed assets (e.g. chunk.[hash].js/css) -> immutable
        if (/\.[a-f0-9]{8,}\.[a-z0-9]+$/i.test(path)) {
          response = new Response(
            response.body,
            new Response(response).headers
          );
          response.headers.set(
            'cache-control',
            'public, max-age=31536000, immutable'
          );
        } else if (path === '/' || path.endsWith('.html')) {
          response = new Response(
            response.body,
            new Response(response).headers
          );
          // Make HTML effectively uncacheable so new deployments show instantly
          response.headers.set('cache-control', 'no-store, must-revalidate');
          response.headers.set('cf-deploy-hint', Date.now().toString());
        }
        // Add common security headers to all successful direct hits
        response = withSecurityHeaders(response, url);
        return response;
      }

      // If client error (4xx) and looks like a SPA route (no dot in last path segment), fallback to index.html
      // Some edge cases return 400 with body 'Invalid URL' instead of a 404; we still want to serve the SPA shell.
      if (
        (response.status === 404 ||
          (response.status >= 400 && response.status < 500)) &&
        shouldSpaFallback(url, noFallbackList)
      ) {
        const originalStatus = response.status;
        const indexReq = new Request(new URL('/index.html', url), request);
        const indexResp = await env.ASSETS.fetch(indexReq);
        if (indexResp.ok) {
          console.log('[worker] SPA fallback -> /index.html', {
            path: url.pathname,
            originalStatus,
          });
          return new Response(indexResp.body, {
            status: 200,
            headers: indexResp.headers,
          });
        } else {
          console.warn('[worker] Fallback failed', {
            path: url.pathname,
            originalStatus,
            fallbackStatus: indexResp.status,
          });
        }
      }
      return withSecurityHeaders(response, url);
    } catch (err) {
      captureError(err, env);
      return new Response('Internal Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  },
};

function shouldSpaFallback(url, noFallbackList) {
  const pathname = url.pathname;
  if (pathname === '/') return false; // root already served
  if (noFallbackList.includes(pathname)) return false;
  const last = pathname.split('/').pop();
  const looksLikeFile = last && last.includes('.');
  if (looksLikeFile) return false;
  if (pathname.startsWith('/api')) return false;
  return true;
}

// Optional Sentry capture (minimal stub). Real integration can import @sentry/xyz edge SDK.
function captureError(err, env) {
  if (!env.SENTRY_DSN) {
    console.error('[worker:error]', err);
    return;
  }
  // Placeholder: send minimal beacon via fetch
  try {
    const body = JSON.stringify({
      message: String(err),
      stack: err?.stack,
      dsn: env.SENTRY_DSN,
    });
    fetch(env.SENTRY_DSN, { method: 'POST', body });
  } catch (e) {
    console.error('[worker:error:send-failed]', e);
  }
}

function withSecurityHeaders(resp, url) {
  const headers = new Headers(resp.headers);
  // Basic security hardening
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'DENY');
  headers.set('x-xss-protection', '0'); // modern browsers rely on CSP
  headers.set('permissions-policy', 'geolocation=(), microphone=(), camera=()');
  // Simple CSP (adjust later): allow self + inline styles (Tailwind JIT) & data images
  headers.set(
    'content-security-policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; ')
  );
  // Prefetch hints for SPA main bundle if we can infer hashed main files
  const pathname = url.pathname;
  if (pathname === '/' || pathname.endsWith('index.html')) {
    // Heuristic: prefetch vendor + main chunks
    // These Link headers are advisory; adjust when filenames change
    headers.append(
      'Link',
      '</assets/vendor-cxkclgJA.js>; rel=preload; as=script'
    );
    headers.append(
      'Link',
      '</assets/index-B2SJnuOB.js>; rel=preload; as=script'
    );
    headers.append(
      'Link',
      '</assets/index-B89X4AwN.css>; rel=preload; as=style'
    );
  }
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}
