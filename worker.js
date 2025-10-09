// Cloudflare Worker with Content-Type fixes
// Helper function to create Supabase client
function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase не настроен');
  }

  return {
    async query(table, options = {}) {
      const { method = 'GET', body, select = '*', filters = {} } = options;

      let url = `${supabaseUrl}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (method === 'GET' && select) {
        params.append('select', select);
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : '',
      };

      const fetchOptions = { method, headers };
      if (body) fetchOptions.body = JSON.stringify(body);

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${response.status} - ${error}`);
      }

      return response.json();
    },

    async insert(table, data) {
      return this.query(table, { method: 'POST', body: data });
    },

    async update(table, id, data) {
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[Supabase update] Status:',
          response.status,
          'Error:',
          errorText
        );
        throw new Error(`Update error: ${response.status} - ${errorText}`);
      }

      return response.json();
    },

    async delete(table, id) {
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      return response.ok;
    },
  };
}

function parseNumeric(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function cleanMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
}

function buildProductRecord(payload, { includeDefaults = false } = {}) {
  const record = {};

  if (payload.name !== undefined) record.name = payload.name;
  if (payload.sku !== undefined) record.sku = payload.sku;
  if (payload.categoryId !== undefined) record.category_id = payload.categoryId;

  if (payload.price !== undefined) {
    record.price = payload.price === null ? null : Number(payload.price);
  }

  if (payload.unit !== undefined) record.unit = payload.unit;
  if (payload.description !== undefined)
    record.description = payload.description;
  if (payload.barcode !== undefined) record.barcode = payload.barcode;
  if (payload.qrData !== undefined) record.qr_data = payload.qrData;

  const metadata = {};

  if (payload.categoryName !== undefined)
    metadata.categoryName = payload.categoryName;
  if (payload.categoryCode !== undefined)
    metadata.categoryCode = payload.categoryCode;
  if (payload.manufacturer !== undefined)
    metadata.manufacturer = payload.manufacturer;
  if (payload.weight !== undefined) metadata.weight = payload.weight;
  if (payload.expiryDate !== undefined)
    metadata.expiryDate = payload.expiryDate;
  if (payload.batchNumber !== undefined)
    metadata.batchNumber = payload.batchNumber;
  if (payload.imageUrl !== undefined) metadata.imageUrl = payload.imageUrl;

  if (payload.status !== undefined) {
    metadata.status = payload.status;
  } else if (includeDefaults) {
    metadata.status = 'active';
  }

  if (payload.stock !== undefined) {
    metadata.stock = payload.stock;
  } else if (includeDefaults) {
    metadata.stock = 0;
  }

  if (payload.minStock !== undefined) {
    metadata.minStock = payload.minStock;
  } else if (includeDefaults) {
    metadata.minStock = 0;
  }

  const cleanedMetadata = cleanMetadata(metadata);
  if (Object.keys(cleanedMetadata).length > 0) {
    record.metadata = cleanedMetadata;
  }

  return record;
}

function normalizeProductRow(row) {
  if (!row) return null;

  const metadata = row.metadata || {};

  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? '',
    categoryId: row.category_id ?? null,
    category: metadata.categoryName ?? metadata.category ?? null,
    categoryCode: metadata.categoryCode ?? null,
    description: row.description ?? metadata.description ?? '',
    price:
      row.price !== undefined && row.price !== null ? Number(row.price) : 0,
    unit: row.unit ?? metadata.unit ?? null,
    manufacturer: metadata.manufacturer ?? '',
    weight: metadata.weight ?? '',
    status: metadata.status ?? 'active',
    stock: parseNumeric(metadata.stock, 0),
    minStock: parseNumeric(metadata.minStock, 0),
    barcode: row.barcode ?? metadata.barcode ?? '',
    qrData: row.qr_data ?? metadata.qrData ?? '',
    expiryDate: metadata.expiryDate ?? null,
    batchNumber: metadata.batchNumber ?? null,
    imageUrl: metadata.imageUrl ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    metadata,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cspValue =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self' https: wss: wss://wjclhytzewfcalyybhab.supabase.co; worker-src 'self' blob:";

    try {
      // Simple CORS helper
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Health endpoint
      if (url.pathname === '/health') {
        return new Response('ok', {
          status: 200,
          headers: {
            'content-type': 'text/plain',
            ...corsHeaders,
          },
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

      // Health check: Supabase
      if (url.pathname === '/api/health/supabase') {
        try {
          const supabaseUrl = env.SUPABASE_URL;
          const supabaseKey = env.SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(
              JSON.stringify({
                connected: false,
                message: 'Supabase не настроен',
              }),
              {
                status: 200,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          // Простая проверка REST API
          const healthResp = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: AbortSignal.timeout(5000),
          });

          const connected = healthResp.ok;
          return new Response(
            JSON.stringify({
              connected,
              message: connected
                ? 'База данных активна'
                : `Ошибка: ${healthResp.status}`,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              connected: false,
              message: `Ошибка подключения: ${err.message}`,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }
      }

      // Health check: R2
      if (url.pathname === '/api/health/r2') {
        try {
          if (!env.R2) {
            return new Response(
              JSON.stringify({
                connected: false,
                message: 'R2 не настроен',
              }),
              {
                status: 200,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          // Проверка доступности R2 через list
          const list = await env.R2.list({ limit: 1 });
          const connected = list !== null && list !== undefined;

          return new Response(
            JSON.stringify({
              connected,
              message: connected ? 'Хранилище активно' : 'Ошибка доступа к R2',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              connected: false,
              message: `Ошибка R2: ${err.message}`,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }
      }

      // =====================================================
      // API Endpoints: Categories
      // =====================================================

      // GET /api/categories - Получить все категории
      if (url.pathname === '/api/categories' && request.method === 'GET') {
        try {
          const supabase = createSupabaseClient(env);
          const categories = await supabase.query('categories', {
            select: 'id,code,name,description,created_at,updated_at',
          });

          return new Response(JSON.stringify(categories), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // POST /api/categories - Создать категорию
      if (url.pathname === '/api/categories' && request.method === 'POST') {
        try {
          const supabase = createSupabaseClient(env);
          const body = await request.json();

          const newCategory = await supabase.insert('categories', body);

          return new Response(JSON.stringify(newCategory[0]), {
            status: 201,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // PUT /api/categories/:id - Обновить категорию
      if (
        url.pathname.match(/^\/api\/categories\/[^/]+$/) &&
        request.method === 'PUT'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const supabase = createSupabaseClient(env);
          const body = await request.json();

          const updated = await supabase.update('categories', id, body);

          return new Response(JSON.stringify(updated[0]), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // DELETE /api/categories/:id - Удалить категорию
      if (
        url.pathname.match(/^\/api\/categories\/[^/]+$/) &&
        request.method === 'DELETE'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const supabase = createSupabaseClient(env);

          await supabase.delete('categories', id);

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // =====================================================
      // API Endpoints: Products
      // =====================================================

      // GET /api/products - Получить все продукты
      if (url.pathname === '/api/products' && request.method === 'GET') {
        try {
          const supabase = createSupabaseClient(env);
          const products = await supabase.query('products', {
            select: '*',
          });

          const normalized = Array.isArray(products)
            ? products.map(normalizeProductRow).filter(Boolean)
            : [];

          return new Response(JSON.stringify(normalized), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // POST /api/products - Создать продукт
      if (url.pathname === '/api/products' && request.method === 'POST') {
        try {
          const supabase = createSupabaseClient(env);
          const payload = await request.json();
          const record = buildProductRecord(payload, { includeDefaults: true });

          const inserted = await supabase.insert('products', record);
          const first = Array.isArray(inserted) ? inserted[0] : inserted;
          if (!first) {
            throw new Error('Product insert returned no data');
          }
          const normalized = normalizeProductRow(first);

          return new Response(JSON.stringify(normalized), {
            status: 201,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // PUT /api/products/:id - Обновить продукт
      if (
        url.pathname.match(/^\/api\/products\/[^/]+$/) &&
        request.method === 'PUT'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const supabase = createSupabaseClient(env);
          const payload = await request.json();
          const record = buildProductRecord(payload);

          const updated = await supabase.update('products', id, record);
          const first = Array.isArray(updated) ? updated[0] : updated;
          if (!first) {
            return new Response(
              JSON.stringify({ error: 'Product not found' }),
              {
                status: 404,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }
          const normalized = normalizeProductRow(first);

          return new Response(JSON.stringify(normalized), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // DELETE /api/products/:id - Удалить продукт
      if (
        url.pathname.match(/^\/api\/products\/[^/]+$/) &&
        request.method === 'DELETE'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const supabase = createSupabaseClient(env);

          await supabase.delete('products', id);

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // =====================================================
      // API Endpoints: Label Templates
      // =====================================================

      // GET /api/templates - Получить все шаблоны
      if (url.pathname === '/api/templates' && request.method === 'GET') {
        try {
          const supabase = createSupabaseClient(env);
          const templates = await supabase.query('label_templates', {
            select: '*',
          });

          return new Response(JSON.stringify(templates), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // POST /api/templates - Создать шаблон
      if (url.pathname === '/api/templates' && request.method === 'POST') {
        try {
          const supabase = createSupabaseClient(env);
          const body = await request.json();

          const newTemplate = await supabase.insert('label_templates', body);

          return new Response(JSON.stringify(newTemplate[0]), {
            status: 201,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // POST /api/templates/:id/thumbnail - Загрузить превью в R2
      if (
        url.pathname.match(/^\/api\/templates\/[^/]+\/thumbnail$/) &&
        request.method === 'POST'
      ) {
        try {
          const id = url.pathname.split('/')[3]; // /api/templates/:id/thumbnail
          const body = await request.json();

          if (!body.thumbnail || !body.thumbnail.startsWith('data:image/')) {
            return new Response(
              JSON.stringify({ error: 'Invalid thumbnail data' }),
              {
                status: 400,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          // Извлекаем base64 данные
          const matches = body.thumbnail.match(
            /^data:image\/(jpeg|png);base64,(.+)$/
          );
          if (!matches) {
            return new Response(
              JSON.stringify({ error: 'Invalid base64 format' }),
              {
                status: 400,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          const [, imageType, base64Data] = matches;
          const imageBuffer = Uint8Array.from(atob(base64Data), c =>
            c.charCodeAt(0)
          );

          // Сохраняем в R2
          const thumbnailKey = `thumbnails/${id}.${imageType}`;
          await env.R2.put(thumbnailKey, imageBuffer, {
            httpMetadata: {
              contentType: `image/${imageType}`,
            },
          });

          // Формируем URL для доступа
          const thumbnailUrl = `/api/thumbnails/${id}.${imageType}`;

          // Обновляем шаблон с URL вместо base64
          const supabase = createSupabaseClient(env);
          const updated = await supabase.update('label_templates', id, {
            thumbnail: thumbnailUrl,
          });

          console.log('[POST thumbnail] id:', id, 'url:', thumbnailUrl);

          return new Response(
            JSON.stringify({
              success: true,
              thumbnailUrl,
              template: updated[0],
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        } catch (err) {
          console.error('[POST thumbnail] error:', err);
          return new Response(
            JSON.stringify({
              error: err.message,
            }),
            {
              status: 500,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }
      }

      // PATCH /api/templates/:id - Обновить шаблон
      if (
        url.pathname.match(/^\/api\/templates\/[^/]+$/) &&
        request.method === 'PATCH'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const body = await request.json();
          const supabase = createSupabaseClient(env);

          // Если есть thumbnail в base64 - загружаем в R2
          if (body.thumbnail && body.thumbnail.startsWith('data:image/')) {
            console.log('[PATCH templates] Uploading thumbnail to R2...');

            const matches = body.thumbnail.match(
              /^data:image\/(jpeg|png);base64,(.+)$/
            );
            if (matches) {
              const [, imageType, base64Data] = matches;
              const imageBuffer = Uint8Array.from(atob(base64Data), c =>
                c.charCodeAt(0)
              );

              const thumbnailKey = `thumbnails/${id}.${imageType}`;
              await env.R2.put(thumbnailKey, imageBuffer, {
                httpMetadata: {
                  contentType: `image/${imageType}`,
                },
              });

              // Заменяем base64 на URL
              body.thumbnail = `/api/thumbnails/${id}.${imageType}`;
              console.log(
                '[PATCH templates] Thumbnail uploaded, URL:',
                body.thumbnail
              );
            }
          }

          // Логируем размер данных для диагностики
          const bodySize = JSON.stringify(body).length;
          console.log(
            '[PATCH templates] id:',
            id,
            'has thumbnail:',
            !!body.thumbnail,
            'body size:',
            bodySize,
            'bytes'
          );

          // Показываем какие поля отправляем
          console.log(
            '[PATCH templates] fields:',
            Object.keys(body).join(', ')
          );
          console.log('[PATCH templates] thumbnail value:', body.thumbnail);

          const updated = await supabase.update('label_templates', id, body);

          console.log('[PATCH templates] updated successfully');

          if (!updated || updated.length === 0) {
            return new Response(
              JSON.stringify({ error: 'Template not found or not updated' }),
              {
                status: 404,
                headers: { 'content-type': 'application/json', ...corsHeaders },
              }
            );
          }

          return new Response(JSON.stringify(updated[0]), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          console.error('[PATCH templates] error:', err);
          return new Response(
            JSON.stringify({
              error: err.message,
              stack: err.stack,
            }),
            {
              status: 500,
              headers: { 'content-type': 'application/json', ...corsHeaders },
            }
          );
        }
      }

      // DELETE /api/templates/:id - Удалить шаблон
      if (
        url.pathname.match(/^\/api\/templates\/[^/]+$/) &&
        request.method === 'DELETE'
      ) {
        try {
          const id = url.pathname.split('/').pop();
          const supabase = createSupabaseClient(env);

          await supabase.delete('label_templates', id);

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // =====================================================
      // API Endpoints: Printers
      // =====================================================

      // GET /api/printers - Получить список принтеров
      if (url.pathname === '/api/printers' && request.method === 'GET') {
        try {
          // Пока возвращаем пустой массив
          // В будущем здесь будет запрос к таблице printers
          const printers = [];

          return new Response(JSON.stringify(printers), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // POST /api/printers - Добавить принтер
      if (url.pathname === '/api/printers' && request.method === 'POST') {
        try {
          const body = await request.json();

          // TODO: Сохранить принтер в базу данных
          // Пока просто возвращаем то, что получили с добавлением id
          const newPrinter = {
            id: crypto.randomUUID(),
            ...body,
            createdAt: new Date().toISOString(),
          };

          return new Response(JSON.stringify(newPrinter), {
            status: 201,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
      }

      // DELETE /api/printers/:id - Удалить принтер
      if (
        url.pathname.match(/^\/api\/printers\/[^/]+$/) &&
        request.method === 'DELETE'
      ) {
        try {
          const id = url.pathname.split('/').pop();

          // TODO: Удалить принтер из базы данных
          // Пока просто возвращаем success

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json', ...corsHeaders },
          });
        }
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

      // GET /api/thumbnails/:filename - Получить превью из R2
      if (
        url.pathname.match(/^\/api\/thumbnails\/.+\.(jpeg|png)$/) &&
        request.method === 'GET'
      ) {
        try {
          const filename = url.pathname.split('/').pop();
          const thumbnailKey = `thumbnails/${filename}`;

          const obj = await env.R2.get(thumbnailKey);
          if (!obj) {
            return new Response('Thumbnail not found', {
              status: 404,
              headers: { ...corsHeaders },
            });
          }

          return new Response(obj.body, {
            status: 200,
            headers: {
              'content-type': obj.httpMetadata.contentType || 'image/jpeg',
              'cache-control': 'public, max-age=31536000', // Кэш на год
              ...corsHeaders,
            },
          });
        } catch (err) {
          console.error('[GET thumbnail] error:', err);
          return new Response('Error loading thumbnail', {
            status: 500,
            headers: { ...corsHeaders },
          });
        }
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
          headers.set(
            'cache-control',
            'no-cache, no-store, must-revalidate, max-age=0'
          );
          headers.set('pragma', 'no-cache');
          headers.set('expires', '0');
          headers.set('content-security-policy', cspValue);
          headers.set('x-content-type-options', 'nosniff');
          headers.set('referrer-policy', 'strict-origin-when-cross-origin');
          headers.set('x-frame-options', 'DENY');
          headers.set('x-xss-protection', '1; mode=block');
          return new Response(indexResp.body, { status: 200, headers });
        }
      }

      // Try to serve the exact asset
      let response = await env.ASSETS.fetch(request);

      if (response.ok) {
        const path = url.pathname;
        const headers = new Headers(response.headers);
        const contentType = headers.get('content-type') || '';

        // Add CORS headers to all responses
        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });

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

        // CSP для разрешения WebSocket соединений с Supabase
        // Применяем ко всем HTML файлам и SPA роутам
        const isHtmlOrRoute =
          contentType.includes('text/html') ||
          path === '/' ||
          !path.includes('.');
        if (isHtmlOrRoute) {
          headers.set('content-security-policy', cspValue);
          // Отключаем кэширование HTML для немедленного применения изменений
          headers.set(
            'cache-control',
            'no-cache, no-store, must-revalidate, max-age=0'
          );
          headers.set('pragma', 'no-cache');
          headers.set('expires', '0');
        }

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
          headers.set(
            'cache-control',
            'no-cache, no-store, must-revalidate, max-age=0'
          );
          headers.set('pragma', 'no-cache');
          headers.set('expires', '0');
          // CSP для SPA роутов
          headers.set('content-security-policy', cspValue);
          headers.set('x-content-type-options', 'nosniff');
          headers.set('referrer-policy', 'strict-origin-when-cross-origin');
          headers.set('x-frame-options', 'DENY');
          headers.set('x-xss-protection', '1; mode=block');
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
