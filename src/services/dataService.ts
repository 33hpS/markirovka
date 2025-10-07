// Интеграционный сервис для работы с базой данных и файловым хранилищем
import { r2Service } from './r2Service';
import type { Product, Template, PrintJob } from '../types/entities';

type BaseProductPayload = {
  description?: string | null;
  price?: number | null;
  manufacturer?: string | null;
  weight?: string | null;
  dimensions?: string | null;
  expirationDays?: number | null;
  expiration_days?: number | null;
  barcode?: string | null;
  qr_data?: string | null;
  status?: Product['status'];
  stock?: number | null;
  minStock?: number | null;
  min_stock?: number | null;
  imageUrl?: string | null;
  image_url?: string | null;

  // Новые атрибуты для мебели ванной
  material?: string | null;
  moisture_resistance?: string | null;
  installation_type?: Product['installation_type'] | null;
  width_mm?: number | null;
  height_mm?: number | null;
  depth_mm?: number | null;
  finish?: string | null;
  color?: string | null;
  hardware?: string | null;
  soft_close?: boolean | null;
  drawer_count?: number | null;
  sink_type?: Product['sink_type'] | null;
  mirror_lighting?: boolean | null;
  ip_rating?: string | null;
  warranty_months?: number | null;
  collection?: string | null;
};

type ProductCreatePayload = BaseProductPayload & {
  name: string;
  sku: string;
  category: string;
};

type ProductUpdatePayload = Partial<ProductCreatePayload>;

type CreatePrintJobPayload = {
  productId: string;
  templateId: string;
  quantity: number;
  operator: string;
  type: PrintJob['type'];
  status?: PrintJob['status'];
};

type GetPrintJobsOptions = number | { limit?: number };

type ExtendedTemplate = Template & {
  category?: string;
  tags?: string[];
  is_active?: boolean;
};

type OptionalProductFields = Partial<
  Pick<
    Product,
    | 'description'
    | 'price'
    | 'manufacturer'
    | 'weight'
    | 'dimensions'
    | 'expiration_days'
    | 'barcode'
    | 'qr_data'
    | 'image_url'
    | 'material'
    | 'moisture_resistance'
    | 'installation_type'
    | 'width_mm'
    | 'height_mm'
    | 'depth_mm'
    | 'finish'
    | 'color'
    | 'hardware'
    | 'soft_close'
    | 'drawer_count'
    | 'sink_type'
    | 'mirror_lighting'
    | 'ip_rating'
    | 'warranty_months'
    | 'collection'
  >
>;
class DataService {
  private products: Product[] = [
    {
      id: 'prd-1',
      name: 'Молоко цельное 3.2%',
      sku: 'MILK-032-1L',
      category: 'Молочные продукты',
      description: 'Натуральное цельное молоко жирностью 3.2%',
      price: 89.9,
      manufacturer: 'ООО "Молочная ферма"',
      weight: '1 л',
      barcode: '4600134912345',
      qr_data:
        'https://markirovka.sherhan1988hp.workers.dev/product/MILK-032-1L',
      status: 'active',
      stock: 150,
      min_stock: 20,
      expiration_days: 7,
      created_at: '2025-10-01T08:00:00Z',
      updated_at: '2025-10-06T12:30:00Z',
    },
    {
      id: 'prd-2',
      name: 'Хлеб пшеничный нарезной',
      sku: 'BREAD-WHT-500G',
      category: 'Хлебобулочные изделия',
      description: 'Свежий пшеничный хлеб, нарезанный ломтиками',
      price: 45.5,
      manufacturer: 'Хлебозавод №1',
      weight: '500 г',
      barcode: '4600334567890',
      qr_data:
        'https://markirovka.sherhan1988hp.workers.dev/product/BREAD-WHT-500G',
      status: 'active',
      stock: 85,
      min_stock: 15,
      expiration_days: 3,
      created_at: '2025-10-02T06:00:00Z',
      updated_at: '2025-10-06T14:15:00Z',
    },
    {
      id: 'prd-3',
      name: 'Колбаса вареная «Докторская»',
      sku: 'SAUSAGE-DOC-300G',
      category: 'Мясные изделия',
      description: 'Классическая вареная колбаса по ГОСТу',
      price: 285,
      manufacturer: 'Мясокомбинат «Традиция»',
      weight: '300 г',
      barcode: '4600234789012',
      qr_data:
        'https://markirovka.sherhan1988hp.workers.dev/product/SAUSAGE-DOC-300G',
      status: 'active',
      stock: 45,
      min_stock: 10,
      expiration_days: 21,
      created_at: '2025-10-01T10:00:00Z',
      updated_at: '2025-10-03T16:45:00Z',
    },
  ];

  // Добавим несколько примеров мебели для ванной
  constructor() {
    this.products.unshift(
      {
        id: 'bath-1',
        name: 'Тумба подвесная 80 см',
        sku: 'VB-CAB-80W-PRO',
        category: 'Мебель для ванной',
        description: 'Подвесная тумба 800 мм с раковиной и доводчиками',
        price: 18990,
        manufacturer: 'ООО «ВанРум»',
        weight: '28 кг',
        dimensions: '800x480x450',
        barcode: '4660001234567',
        qr_data: 'https://example.com/p/VB-CAB-80W-PRO',
        status: 'active',
        stock: 12,
        min_stock: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material: 'MDF',
        moisture_resistance: 'P5',
        installation_type: 'подвесная',
        width_mm: 800,
        height_mm: 480,
        depth_mm: 450,
        finish: 'глянец',
        color: 'белый',
        hardware: 'Boyard, петли ClipTop',
        soft_close: true,
        drawer_count: 2,
        sink_type: 'накладная',
        mirror_lighting: true,
        ip_rating: 'IP44',
        warranty_months: 24,
        collection: 'Pro Aqua',
      },
      {
        id: 'bath-2',
        name: 'Пенал напольный 35 см',
        sku: 'VB-TALL-35F-BASIC',
        category: 'Мебель для ванной',
        description: 'Пенал 350 мм, 4 полки, одна дверь',
        price: 11990,
        manufacturer: 'ООО «ВанРум»',
        weight: '22 кг',
        dimensions: '350x1800x320',
        barcode: '4660001234574',
        qr_data: 'https://example.com/p/VB-TALL-35F-BASIC',
        status: 'active',
        stock: 8,
        min_stock: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        material: 'ЛДСП',
        moisture_resistance: 'P3',
        installation_type: 'напольная',
        width_mm: 350,
        height_mm: 1800,
        depth_mm: 320,
        finish: 'матовый',
        color: 'графит',
        hardware: 'Hettich',
        soft_close: false,
        drawer_count: 0,
        sink_type: 'столешница',
        mirror_lighting: false,
        ip_rating: 'IP20',
        warranty_months: 12,
        collection: 'Basic',
      }
    );
  }

  private templates: ExtendedTemplate[] = [
    {
      id: 'dairy-basic',
      name: 'Молочные продукты — Базовый',
      description: 'Простая этикетка для молочных продуктов',
      width: 50,
      height: 30,
      elements: [],
      created_at: '2025-09-15T10:00:00Z',
      updated_at: '2025-10-01T12:00:00Z',
      category: 'Молочные продукты',
      tags: ['молоко', 'основное'],
      is_active: true,
    },
    {
      id: 'bread-standard',
      name: 'Хлебобулочные — Стандарт',
      description: 'Стандартная этикетка для хлеба и выпечки',
      width: 60,
      height: 30,
      elements: [],
      created_at: '2025-09-10T09:00:00Z',
      updated_at: '2025-09-25T11:30:00Z',
      category: 'Хлебобулочные изделия',
      tags: ['хлеб'],
      is_active: true,
    },
    {
      id: 'universal',
      name: 'Универсальная этикетка',
      description: 'Подходит для большинства категорий товаров',
      width: 55,
      height: 35,
      elements: [],
      created_at: '2025-09-01T08:00:00Z',
      updated_at: '2025-10-05T15:20:00Z',
      tags: ['универсальная'],
      is_active: true,
    },
  ];

  private printJobs: PrintJob[] = [];

  async getProducts(): Promise<Product[]> {
    return this.products.map(product => ({ ...product }));
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = this.products.find(item => item.id === id);
    return product ? { ...product } : null;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.getProducts();
    }

    return this.products
      .filter(product => {
        return (
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.sku.toLowerCase().includes(normalizedQuery) ||
          product.barcode === query ||
          (product.qr_data?.toLowerCase().includes(normalizedQuery) ?? false)
        );
      })
      .map(product => ({ ...product }));
  }

  async createProduct(input: ProductCreatePayload): Promise<Product> {
    const timestamp = new Date().toISOString();
    const optionalFields = this.mapOptionalFields(input);
    const { barcode, qr_data, ...restOptional } = optionalFields;

    const product: Product = {
      id: this.generateId('prd'),
      name: input.name,
      sku: input.sku,
      category: input.category,
      status: input.status ?? 'active',
      stock: input.stock ?? 0,
      min_stock: input.minStock ?? input.min_stock ?? 0,
      created_at: timestamp,
      updated_at: timestamp,
      barcode: barcode ?? this.generateBarcode(input.sku),
      qr_data:
        qr_data ??
        this.generateQRData({
          sku: input.sku,
          name: input.name,
          category: input.category,
        }),
      ...restOptional,
    };

    this.products.unshift(product);
    return { ...product };
  }

  async updateProduct(
    id: string,
    updates: ProductUpdatePayload
  ): Promise<Product> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }

    const existing = this.products[index];
    if (!existing) {
      throw new Error(`Product with id ${id} not found`);
    }

    const optionalFields = this.mapOptionalFields(updates);
    const { barcode, qr_data, ...restOptional } = optionalFields;

    let stock = existing.stock;
    if (updates.stock !== undefined) {
      stock = updates.stock ?? existing.stock;
    }

    let minStock = existing.min_stock;
    if (updates.minStock !== undefined) {
      minStock = updates.minStock ?? existing.min_stock;
    }
    if (updates.min_stock !== undefined) {
      minStock = updates.min_stock ?? minStock;
    }

    const updated: Product = {
      ...existing,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.sku !== undefined ? { sku: updates.sku } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(barcode !== undefined ? { barcode } : {}),
      ...(qr_data !== undefined ? { qr_data } : {}),
      ...restOptional,
      stock,
      min_stock: minStock,
      updated_at: new Date().toISOString(),
    };

    this.products[index] = updated;
    return { ...updated };
  }

  async deleteProduct(id: string): Promise<boolean> {
    const index = this.products.findIndex(product => product.id === id);
    if (index === -1) {
      return false;
    }

    this.products.splice(index, 1);
    return true;
  }

  async getTemplates(): Promise<Template[]> {
    return this.templates
      .filter(template => template.is_active ?? true)
      .map(template => ({ ...template }));
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const template = this.templates.find(item => item.id === id);
    return template ? { ...template } : null;
  }

  async getSuitableTemplates(category: string): Promise<Template[]> {
    const normalized = category.trim().toLowerCase();
    return this.templates
      .filter(template => {
        if (template.is_active === false) {
          return false;
        }
        if (template.category?.toLowerCase() === normalized) {
          return true;
        }
        return (
          template.tags?.some(tag => tag.toLowerCase() === normalized) ?? false
        );
      })
      .map(template => ({ ...template }));
  }

  async createPrintJob(jobData: CreatePrintJobPayload): Promise<PrintJob> {
    const timestamp = new Date().toISOString();
    const printJob: PrintJob = {
      id: this.generateId('job'),
      product_id: jobData.productId,
      template_id: jobData.templateId,
      quantity: jobData.quantity,
      operator: jobData.operator,
      type: jobData.type,
      status: jobData.status ?? 'pending',
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.printJobs.unshift(printJob);
    return { ...printJob };
  }

  async updatePrintJobStatus(
    id: string,
    status: PrintJob['status'],
    errorMessage?: string
  ): Promise<PrintJob> {
    const job = this.printJobs.find(item => item.id === id);
    if (!job) {
      throw new Error(`Print job with id ${id} not found`);
    }

    job.status = status;
    job.updated_at = new Date().toISOString();

    if (status === 'completed') {
      job.completed_at = job.updated_at;
    }

    if (errorMessage) {
      job.error_message = errorMessage;
    }

    return { ...job };
  }

  async getPrintJobs(options?: GetPrintJobsOptions): Promise<PrintJob[]> {
    const limit =
      typeof options === 'number' ? options : (options?.limit ?? 50);
    return this.printJobs.slice(0, limit).map(job => ({ ...job }));
  }

  async uploadProductImage(
    productId: string,
    imageFile: File
  ): Promise<string | null> {
    const product = await this.getProductById(productId);
    if (!product) {
      return null;
    }

    const result = await r2Service.uploadProductImage(imageFile, product.sku);
    if (result.success && result.url) {
      await this.updateProduct(productId, { image_url: result.url });
      return result.url;
    }

    return null;
  }

  async savePrintJobPDF(jobId: string, pdfBlob: Blob): Promise<string | null> {
    const job = this.printJobs.find(item => item.id === jobId);
    if (!job) {
      return null;
    }

    const product = await this.getProductById(job.product_id);
    if (!product) {
      return null;
    }

    const result = await r2Service.uploadLabelPDF(
      pdfBlob,
      product.sku,
      job.template_id
    );
    if (result.success && result.url) {
      job.file_url = result.url;
      job.updated_at = new Date().toISOString();
      return result.url;
    }

    return null;
  }

  async getProductionStats(dateFrom?: string, dateTo?: string) {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toTs = dateTo ? new Date(dateTo).getTime() : undefined;

    const hasValidFrom = fromTs !== undefined && !Number.isNaN(fromTs);
    const hasValidTo = toTs !== undefined && !Number.isNaN(toTs);

    const jobs = this.printJobs.filter(job => {
      const createdAt = new Date(job.created_at).getTime();
      if (hasValidFrom && fromTs !== undefined && createdAt < fromTs) {
        return false;
      }
      if (hasValidTo && toTs !== undefined && createdAt > toTs) {
        return false;
      }
      return true;
    });

    return {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      pendingJobs: jobs.filter(job => job.status === 'pending').length,
      totalQuantity: jobs.reduce((sum, job) => sum + job.quantity, 0),
      directPrints: jobs.filter(job => job.type === 'direct').length,
      pdfExports: jobs.filter(job => job.type === 'pdf').length,
    };
  }

  async getPopularProducts(limit = 10) {
    const counts = new Map<string, number>();

    this.printJobs.forEach(job => {
      counts.set(
        job.product_id,
        (counts.get(job.product_id) ?? 0) + job.quantity
      );
    });

    const sorted = Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    const popular = await Promise.all(
      sorted.map(async ([productId, count]) => {
        const product = await this.getProductById(productId);
        return product ? { product, printCount: count } : null;
      })
    );

    return popular.filter(
      (item): item is { product: Product; printCount: number } => item !== null
    );
  }

  private mapOptionalFields(input: BaseProductPayload): OptionalProductFields {
    const optional: OptionalProductFields = {};

    const description = input.description ?? undefined;
    if (description !== undefined) {
      optional.description = description;
    }

    const price = input.price ?? undefined;
    if (price !== undefined) {
      optional.price = price;
    }

    const manufacturer = input.manufacturer ?? undefined;
    if (manufacturer !== undefined) {
      optional.manufacturer = manufacturer;
    }

    const weight = input.weight ?? undefined;
    if (weight !== undefined) {
      optional.weight = weight;
    }

    const dimensions = input.dimensions ?? undefined;
    if (dimensions !== undefined) {
      optional.dimensions = dimensions;
    }

    const expiration =
      input.expirationDays ?? input.expiration_days ?? undefined;
    if (expiration !== undefined) {
      optional.expiration_days = expiration;
    }

    const barcode = input.barcode ?? undefined;
    if (barcode !== undefined) {
      optional.barcode = barcode;
    }

    const qrData = input.qr_data ?? undefined;
    if (qrData !== undefined) {
      optional.qr_data = qrData;
    }

    const image = input.imageUrl ?? input.image_url ?? undefined;
    if (image !== undefined) {
      optional.image_url = image;
    }

    // Маппинг новых полей мебели для ванной
    if (input.material !== undefined && input.material !== null) {
      optional.material = input.material ?? undefined;
    }
    if (
      input.moisture_resistance !== undefined &&
      input.moisture_resistance !== null
    ) {
      optional.moisture_resistance = input.moisture_resistance ?? undefined;
    }
    if (
      input.installation_type !== undefined &&
      input.installation_type !== null
    ) {
      optional.installation_type = input.installation_type ?? undefined;
    }
    if (input.width_mm !== undefined && input.width_mm !== null) {
      optional.width_mm = input.width_mm ?? undefined;
    }
    if (input.height_mm !== undefined && input.height_mm !== null) {
      optional.height_mm = input.height_mm ?? undefined;
    }
    if (input.depth_mm !== undefined && input.depth_mm !== null) {
      optional.depth_mm = input.depth_mm ?? undefined;
    }
    if (input.finish !== undefined && input.finish !== null) {
      optional.finish = input.finish ?? undefined;
    }
    if (input.color !== undefined && input.color !== null) {
      optional.color = input.color ?? undefined;
    }
    if (input.hardware !== undefined && input.hardware !== null) {
      optional.hardware = input.hardware ?? undefined;
    }
    if (input.soft_close !== undefined && input.soft_close !== null) {
      optional.soft_close = input.soft_close ?? undefined;
    }
    if (input.drawer_count !== undefined && input.drawer_count !== null) {
      optional.drawer_count = input.drawer_count ?? undefined;
    }
    if (input.sink_type !== undefined && input.sink_type !== null) {
      optional.sink_type = input.sink_type ?? undefined;
    }
    if (input.mirror_lighting !== undefined && input.mirror_lighting !== null) {
      optional.mirror_lighting = input.mirror_lighting ?? undefined;
    }
    if (input.ip_rating !== undefined && input.ip_rating !== null) {
      optional.ip_rating = input.ip_rating ?? undefined;
    }
    if (input.warranty_months !== undefined && input.warranty_months !== null) {
      optional.warranty_months = input.warranty_months ?? undefined;
    }
    if (input.collection !== undefined && input.collection !== null) {
      optional.collection = input.collection ?? undefined;
    }

    return optional;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private generateBarcode(sku: string): string {
    const digits = sku.replace(/\D/g, '') || `${Date.now()}`;
    const base = (digits + Date.now().toString()).padStart(12, '0').slice(-12);
    const checkDigit = this.computeCheckDigit(base);
    return `${base}${checkDigit}`;
  }

  private computeCheckDigit(base: string): number {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      const digit = parseInt(base[i] ?? '0', 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  }

  private generateQRData(product: Partial<Product>): string {
    const baseUrl = 'https://markirovka.sherhan1988hp.workers.dev/product';
    const sku = encodeURIComponent(product.sku ?? 'unknown');
    const name = encodeURIComponent(product.name ?? '');
    const category = encodeURIComponent(product.category ?? '');
    return `${baseUrl}/${sku}?name=${name}&category=${category}`;
  }
}

export const dataService = new DataService();
export default dataService;
