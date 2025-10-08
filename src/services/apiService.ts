/**
 * API Service для работы с backend через Cloudflare Worker
 * Все данные синхронизируются с Supabase через Worker endpoints
 */

const API_BASE = ''; // Пустая строка означает текущий домен

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  category: string | null;
  categoryCode: string | null;
  description: string;
  price: number;
  manufacturer?: string;
  weight?: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  minStock: number;
  barcode: string;
  qrData: string;
  unit?: string | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProductPayload {
  name?: string;
  sku?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryCode?: string | null;
  description?: string | null;
  price?: number | null;
  manufacturer?: string | null;
  weight?: string | null;
  status?: 'active' | 'inactive' | 'discontinued';
  stock?: number;
  minStock?: number;
  barcode?: string | null;
  qrData?: string | null;
  unit?: string | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  imageUrl?: string | null;
}

export interface LabelTemplate {
  id?: string;
  name: string;
  category?: string;
  description?: string;
  width?: number;
  height?: number;
  elements?: unknown[];
  metadata?: Record<string, unknown>;
  is_default?: boolean;
  thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Printer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  type?: string | null;
  model?: string | null;
  location?: string | null;
  ip_address?: string | null;
  capabilities?: string[];
  paper_size?: string | null;
  resolution?: string | null;
  last_seen?: string | null;
  error_count?: number;
  total_jobs?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RawProduct {
  id?: string;
  name?: string;
  sku?: string;
  category_id?: string | null;
  categoryId?: string | null;
  description?: string | null;
  price?: number | string | null;
  barcode?: string | null;
  qr_data?: string | null;
  qrData?: string | null;
  unit?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  imageUrl?: string | null;
  image_url?: string | null;
}

interface RawPrinter {
  id?: string;
  name?: string;
  status?: string | null;
  type?: string | null;
  model?: string | null;
  location?: string | null;
  ip_address?: string | null;
  ipAddress?: string | null;
  capabilities?: unknown;
  paper_size?: string | null;
  paperSize?: string | null;
  resolution?: string | null;
  last_seen?: string | null;
  lastSeen?: string | null;
  error_count?: number | string | null;
  total_jobs?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function transformProduct(data: RawProduct): Product {
  if (!data?.id || !data?.name) {
    throw new Error('Empty product payload');
  }

  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const status = (metadata.status as Product['status']) ?? 'active';
  const barcode =
    data.barcode ?? (metadata.barcode as string | undefined) ?? '';
  const qrData =
    data.qrData ??
    data.qr_data ??
    (metadata.qrData as string | undefined) ??
    '';

  const product: Product = {
    id: data.id,
    name: data.name,
    sku: data.sku ?? '',
    categoryId: data.categoryId ?? data.category_id ?? null,
    category:
      (metadata.categoryName as string | undefined) ??
      (metadata.category as string | undefined) ??
      null,
    categoryCode: (metadata.categoryCode as string | undefined) ?? null,
    description:
      data.description ?? (metadata.description as string | undefined) ?? '',
    price:
      data.price !== undefined && data.price !== null ? Number(data.price) : 0,
    status,
    stock: parseNumber(metadata.stock, 0),
    minStock: parseNumber(metadata.minStock, 0),
    barcode,
    qrData,
    unit: data.unit ?? (metadata.unit as string | undefined) ?? null,
    imageUrl:
      data.imageUrl ??
      data.image_url ??
      (metadata.imageUrl as string | undefined) ??
      null,
    createdAt: data.createdAt ?? data.created_at ?? null,
    updatedAt: data.updatedAt ?? data.updated_at ?? null,
    metadata,
  };

  if (metadata.manufacturer !== undefined) {
    product.manufacturer = metadata.manufacturer as string;
  }
  if (metadata.weight !== undefined) {
    product.weight = metadata.weight as string;
  }
  if (metadata.expiryDate !== undefined) {
    product.expiryDate = metadata.expiryDate as string;
  }
  if (metadata.batchNumber !== undefined) {
    product.batchNumber = metadata.batchNumber as string;
  }

  return product;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
}

function transformPrinter(data: RawPrinter): Printer {
  if (!data?.id || !data?.name) {
    throw new Error('Empty printer payload');
  }

  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const rawStatus = (data.status ?? metadata.status ?? 'offline') as string;
  const normalizedStatus = (
    ['online', 'offline', 'busy', 'error', 'maintenance'] as const
  ).includes(rawStatus as Printer['status'])
    ? (rawStatus as Printer['status'])
    : 'offline';

  const capabilities = toStringArray(
    data.capabilities ?? metadata.capabilities
  );

  return {
    id: data.id,
    name: data.name,
    status: normalizedStatus,
    type: (data.type ?? metadata.type ?? null) as string | null,
    model: (data.model ?? metadata.model ?? null) as string | null,
    location: (data.location ?? metadata.location ?? null) as string | null,
    ip_address: (data.ip_address ??
      data.ipAddress ??
      metadata.ip_address ??
      metadata.ipAddress ??
      null) as string | null,
    capabilities,
    paper_size: (data.paper_size ??
      data.paperSize ??
      metadata.paper_size ??
      metadata.paperSize ??
      null) as string | null,
    resolution: (data.resolution ?? metadata.resolution ?? null) as
      | string
      | null,
    last_seen: (data.last_seen ??
      data.lastSeen ??
      metadata.last_seen ??
      metadata.lastSeen ??
      null) as string | null,
    error_count: parseNumber(data.error_count, 0),
    total_jobs: parseNumber(data.total_jobs, 0),
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null,
  };
}

// Утилита для retry запросов
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // Если успешно, возвращаем
      if (response.ok) return response;

      // Если ошибка клиента (4xx), не повторяем
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      // Для 5xx ошибок пробуем еще раз
      if (i === retries - 1) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error('Превышено количество попыток');
}

// =====================================================
// Categories API
// =====================================================

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetchWithRetry(`${API_BASE}/api/categories`);
  return response.json();
}

export async function createCategory(
  category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
): Promise<Category> {
  const response = await fetchWithRetry(`${API_BASE}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  return response.json();
}

export async function updateCategory(
  id: string,
  category: Partial<Category>
): Promise<Category> {
  const response = await fetchWithRetry(`${API_BASE}/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/categories/${id}`, {
    method: 'DELETE',
  });
}

// =====================================================
// Products API
// =====================================================

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetchWithRetry(`${API_BASE}/api/products`);
  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(item => transformProduct(item as RawProduct));
}

export async function createProduct(
  product: ProductPayload & {
    name: string;
    sku: string;
    categoryId?: string | null;
  }
): Promise<Product> {
  const response = await fetchWithRetry(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  const data = await response.json();
  if (Array.isArray(data)) {
    return transformProduct(data[0] as RawProduct);
  }
  return transformProduct(data as RawProduct);
}

export async function updateProduct(
  id: string,
  product: ProductPayload
): Promise<Product> {
  const response = await fetchWithRetry(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  const data = await response.json();
  if (Array.isArray(data)) {
    return transformProduct(data[0] as RawProduct);
  }
  return transformProduct(data as RawProduct);
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
  });
}

// =====================================================
// Label Templates API
// =====================================================

export async function fetchTemplates(): Promise<LabelTemplate[]> {
  const response = await fetchWithRetry(`${API_BASE}/api/templates`);
  return response.json();
}

export async function createTemplate(
  template: Omit<LabelTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<LabelTemplate> {
  const response = await fetchWithRetry(`${API_BASE}/api/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  return response.json();
}

export async function updateTemplate(
  id: string,
  template: Partial<Omit<LabelTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<LabelTemplate> {
  const response = await fetchWithRetry(`${API_BASE}/api/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
  });
  return response.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/templates/${id}`, {
    method: 'DELETE',
  });
}

// =====================================================
// Printers API
// =====================================================

export async function fetchPrinters(): Promise<Printer[]> {
  const response = await fetchWithRetry(`${API_BASE}/api/printers`);
  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  const printers: Printer[] = [];
  for (const item of data) {
    try {
      printers.push(transformPrinter(item as RawPrinter));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Skipping invalid printer payload', error);
    }
  }

  return printers;
}

// =====================================================
// Migration from localStorage
// =====================================================

/**
 * Мигрирует данные из localStorage в Supabase
 * Вызывается один раз при первой загрузке после обновления
 */
export async function migrateLocalStorageData(): Promise<void> {
  const MIGRATION_KEY = 'supabase_migration_completed';

  // Проверяем, была ли уже миграция
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return;
  }

  try {
    // Мигрируем категории
    const savedCategories = localStorage.getItem('productCategories');
    if (savedCategories) {
      const categories: Category[] = JSON.parse(savedCategories);

      // Получаем существующие категории из базы
      const existingCategories = await fetchCategories();

      // Мигрируем только те, которых нет в базе
      for (const category of categories) {
        const exists = existingCategories.some(c => c.code === category.code);
        if (!exists) {
          await createCategory({
            code: category.code,
            name: category.name,
            description: category.description,
          });
        }
      }
    }

    // Мигрируем шаблоны (если есть в localStorage)
    const savedTemplates = localStorage.getItem('labelTemplates');
    if (savedTemplates) {
      const templates: LabelTemplate[] = JSON.parse(savedTemplates);

      const existingTemplates = await fetchTemplates();

      for (const template of templates) {
        const exists = existingTemplates.some(t => t.name === template.name);
        if (!exists) {
          const newTemplate: Omit<
            LabelTemplate,
            'id' | 'created_at' | 'updated_at'
          > = {
            name: template.name,
            width: template.width ?? 400,
            height: template.height ?? 300,
            elements: template.elements ?? [],
          };
          if (template.category) {
            newTemplate.category = template.category;
          }
          if (template.description) {
            newTemplate.description = template.description;
          }
          await createTemplate(newTemplate);
        }
      }
    }

    // Отмечаем миграцию как завершенную
    localStorage.setItem(MIGRATION_KEY, 'true');
    // eslint-disable-next-line no-console
    console.log('✅ Миграция данных из localStorage в Supabase завершена');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ошибка миграции данных:', error);
    // Не устанавливаем флаг миграции, чтобы попробовать снова при следующей загрузке
  }
}
