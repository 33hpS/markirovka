// Cloudflare Worker with Content-Type fixes
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      // Simple CORS helper
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Health endpoint
      if (url.pathname === '/health') {
        return new Response('ok', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }

      // Version endpoint
      if (url.pathname === '/version') {
        let versionData = {
          commit: env.COMMIT_SHA || 'unknown',
          version: env.PKG_VERSION || 'unknown',
          time: new Date().toISOString(),
          source: 'env',
        };

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
                time: new Date().toISOString(),
                source: fallbackData.source || 'fallback',
              };
            }
          } catch (err) {
            console.warn('[worker] version.json fallback failed', err);
          }
        }

        return new Response(JSON.stringify(versionData), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
            ...corsHeaders,
          },
        });
      }

      // API: R2 upload via Worker (avoid exposing R2 keys on frontend)
      if (url.pathname === '/api/r2/upload' && request.method === 'POST') {
        if (!env.R2) {
          return new Response(
            JSON.stringify({ error: 'R2 binding is not configured' }),
            {
              status: 501,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
          const form = await request.formData();
          const file = form.get('file');
          const key = form.get('key');
          const ct =
            form.get('contentType') ||
            (file && file.type) ||
            'application/octet-stream';

          if (!(file instanceof Blob) || typeof key !== 'string') {
            return new Response(
              JSON.stringify({
                error: 'Invalid form data: file and key are required',
              }),
              {
                status: 400,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          await env.R2.put(key.replace(/^\//, ''), file.stream(), {
            httpMetadata: { contentType: String(ct) },
          });

          const origin = `${url.protocol}//${url.host}`;
          return new Response(
            JSON.stringify({
              success: true,
              key,
              url: `${origin}/api/r2/file?key=${encodeURIComponent(key)}`,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }

        // Fallback: raw body upload with ?key= param
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Missing key parameter' }),
            {
              status: 400,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }

        if (!env.R2) {
          return new Response(
            JSON.stringify({ error: 'R2 binding is not configured' }),
            {
              status: 501,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }

        const ct =
          request.headers.get('content-type') || 'application/octet-stream';
        await env.R2.put(key.replace(/^\//, ''), request.body, {
          httpMetadata: { contentType: ct },
        });
        const origin = `${url.protocol}//${url.host}`;
        return new Response(
          JSON.stringify({
            success: true,
            key,
            url: `${origin}/api/r2/file?key=${encodeURIComponent(key)}`,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          }
        );
      }

      // API: Serve R2 file via Worker proxy
      if (url.pathname === '/api/r2/file' && request.method === 'GET') {
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response('Missing key', {
            status: 400,
            headers: { ...corsHeaders },
          });
        }
        if (!env.R2) {
          return new Response('R2 binding is not configured', {
            status: 501,
            headers: { ...corsHeaders },
          });
        }
        const obj = await env.R2.get(key.replace(/^\//, ''));
        if (!obj) {
          return new Response('Not Found', {
            status: 404,
            headers: { ...corsHeaders },
          });
        }
        const headers = new Headers({ ...corsHeaders });
        if (obj.httpMetadata?.contentType)
          headers.set('content-type', obj.httpMetadata.contentType);
        if (obj.size) headers.set('content-length', String(obj.size));
        return new Response(obj.body, { status: 200, headers });
      }

      // Known SPA routes - serve index.html directly
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
        const indexReq = new Request(new URL('/', url), request);
        const indexResp = await env.ASSETS.fetch(indexReq);
        if (indexResp.ok) {
          const headers = new Headers(indexResp.headers);
          headers.set('cache-control', 'no-store, must-revalidate');
          return new Response(indexResp.body, { status: 200, headers });
        }
      }

      // Try to serve the exact asset
      let response = await env.ASSETS.fetch(request);

      if (response.ok) {
        const path = url.pathname;
        const headers = new Headers(response.headers);

        // Fix Content-Type for CSS files
        if (path.endsWith('.css')) {
          headers.set('content-type', 'text/css; charset=utf-8');
          headers.set('x-worker-fix', 'css-content-type');
        } else if (path.endsWith('.js')) {
          headers.set('content-type', 'application/javascript; charset=utf-8');
        } else if (path.endsWith('.json')) {
          headers.set('content-type', 'application/json; charset=utf-8');
        }

        // Cache hashed assets
        if (/\.[a-f0-9]{8,}\.[a-z0-9]+$/i.test(path)) {
          headers.set('cache-control', 'public, max-age=31536000, immutable');
        } else if (path === '/' || path.endsWith('.html')) {
          headers.set('cache-control', 'no-store, must-revalidate');
          // Add prefetch hints for the main files
          if (path === '/' || path.endsWith('index.html')) {
            headers.append(
              'Link',
              '</assets/vendor-ggwPbhD5.js>; rel=preload; as=script'
            );
            headers.append(
              'Link',
              '</assets/index-Ch-zg86x.js>; rel=preload; as=script'
            );
            headers.append(
              'Link',
              '</assets/index-BqVOnNKd.css>; rel=preload; as=style'
            );
          }
        }

        // Security headers
        headers.set('x-content-type-options', 'nosniff');
        headers.set('referrer-policy', 'strict-origin-when-cross-origin');
        headers.set('x-frame-options', 'DENY');
        headers.set('x-xss-protection', '1; mode=block');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      // SPA fallback for failed assets that look like routes
      const shouldFallback =
        !url.pathname.includes('.') &&
        !url.pathname.startsWith('/api') &&
        url.pathname !== '/';

      if (shouldFallback) {
        const indexReq = new Request(new URL('/', url), request);
        const indexResp = await env.ASSETS.fetch(indexReq);

        if (indexResp.ok) {
          const headers = new Headers(indexResp.headers);
          headers.set('cache-control', 'no-store, must-revalidate');
          return new Response(indexResp.body, { status: 200, headers });
        }
      }

      return response;
    } catch (err) {
      console.error('[worker:error]', err);
      return new Response('Internal Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  },
};
