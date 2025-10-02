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
      // Fallback to version.json if env vars not available
      if (url.pathname === '/version') {
        let versionData = {
          commit: env.COMMIT_SHA || 'unknown',
          version: env.PKG_VERSION || 'unknown',
          time: new Date().toISOString(),
          source: 'env',
        };

        // If env vars missing, try fallback to version.json
        if (
          versionData.commit === 'unknown' ||
          versionData.version === 'unknown'
        ) {
          try {
            const versionJsonReq = new Request(
              new URL('/version.json', url),
              request
            );
            const versionJsonResp = await env.ASSETS.fetch(versionJsonReq);
            if (versionJsonResp.ok) {
              const fallbackData = await versionJsonResp.json();
              versionData = {
                ...fallbackData,
                time: new Date().toISOString(), // Always current timestamp
                source: fallbackData.source || 'fallback',
              };
              console.log('[worker] Using version.json fallback', versionData);
            }
          } catch (err) {
            console.warn('[worker] version.json fallback failed', err);
          }
        }

        const body = JSON.stringify(versionData);
        return new Response(body, {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
          },
        });
      }

      // Special handling for known SPA routes - serve index.html immediately
      const knownSpaRoutes = [
        '/production',
        '/designer',
        '/reports',
        '/users',
        '/labels',
        '/printing',
        '/login',
        '/docs',
      ];
      if (knownSpaRoutes.includes(url.pathname)) {
        console.log(
          '[worker] Known SPA route, serving index.html directly:',
          url.pathname
        );
        // Try root path instead of /index.html to avoid redirect issues
        const indexReq = new Request(new URL('/', url), request);
        const indexResp = await env.ASSETS.fetch(indexReq);
        if (indexResp.ok) {
          const spaResponse = new Response(indexResp.body, {
            status: 200,
            headers: new Headers(indexResp.headers),
          });
          spaResponse.headers.set(
            'cache-control',
            'no-store, must-revalidate, no-cache'
          );
          spaResponse.headers.set('pragma', 'no-cache');
          spaResponse.headers.set('expires', '0');
          return withSecurityHeaders(spaResponse, url);
        }
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

      // SPA fallback: for any failed asset request that looks like a SPA route
      const shouldFallback = shouldSpaFallback(url, noFallbackList);
      console.log(
        '[worker] Asset failed, shouldFallback:',
        shouldFallback,
        'status:',
        response.status
      );

      if (shouldFallback) {
        console.log('[worker] Attempting SPA fallback for:', url.pathname);

        try {
          const indexReq = new Request(new URL('/', url), request);
          const indexResp = await env.ASSETS.fetch(indexReq);

          if (indexResp.ok) {
            console.log('[worker] SPA fallback SUCCESS');
            const spaResponse = new Response(indexResp.body, {
              status: 200,
              headers: new Headers(indexResp.headers),
            });
            // Set no-cache for SPA routes to ensure fresh content
            spaResponse.headers.set(
              'cache-control',
              'no-store, must-revalidate'
            );
            return withSecurityHeaders(spaResponse, url);
          } else {
            console.error(
              '[worker] index.html fetch failed:',
              indexResp.status
            );
          }
        } catch (err) {
          console.error('[worker] SPA fallback error:', err);
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
  console.log('[worker] shouldSpaFallback check:', {
    pathname,
    noFallbackList,
  });

  if (pathname === '/') {
    console.log('[worker] Skip root');
    return false; // root already served
  }

  if (noFallbackList.includes(pathname)) {
    console.log('[worker] In no-fallback list');
    return false;
  }

  const last = pathname.split('/').pop();
  const looksLikeFile = last && last.includes('.');
  if (looksLikeFile) {
    console.log('[worker] Looks like file:', last);
    return false;
  }

  if (pathname.startsWith('/api')) {
    console.log('[worker] API route');
    return false;
  }

  console.log('[worker] Should fallback to SPA');
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
