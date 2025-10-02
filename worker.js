// Cloudflare Worker entrypoint serving built Vite assets from /dist via Assets binding.
// Provides SPA fallback to /index.html for non-file routes.

export default {
  /**
   * @param {Request} request
   * @param {any} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health endpoint (cheap, no asset fetch)
    if (url.pathname === '/health') {
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    // First try to serve the exact asset
    let response = await env.ASSETS.fetch(request);

    // If 404 and looks like a SPA route (no dot in last path segment), fallback to index.html
    if (response.status === 404 && shouldSpaFallback(url)) {
      const indexReq = new Request(new URL('/index.html', url), request);
      const indexResp = await env.ASSETS.fetch(indexReq);
      if (indexResp.ok) {
        console.log('[worker] SPA fallback -> /index.html', {
          path: url.pathname,
        });
        return indexResp;
      } else {
        console.warn('[worker] Fallback also 404', { path: url.pathname });
      }
    }
    return response;
  },
};

function shouldSpaFallback(url) {
  const pathname = url.pathname;
  if (pathname === '/') return false; // root already served
  const last = pathname.split('/').pop();
  return last && !last.includes('.') && !pathname.startsWith('/api');
}
