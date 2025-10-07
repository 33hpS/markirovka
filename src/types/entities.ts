// Базовые типы для системы маркировки

export interface Product {
  id: string;
  name: string;
  sku: string;
  article?: string; // Добавляем поле article
  category: string;
  description?: string;
  price?: number;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  expiration_days?: number;
  barcode?: string;
  qr_data?: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  min_stock: number;
  image_url?: string;
  created_at: Date | string;
  updated_at: Date | string;

  // Атрибуты мебели для ванной (опциональные)
  material?: string; // Материал (MDF, ДСП, Массив, Металл и т.п.)
  moisture_resistance?: string; // Класс влагостойкости/влагозащиты (например, P3/P5 или влагостойкая)
  installation_type?: 'подвесная' | 'напольная'; // Тип установки
  width_mm?: number; // Ширина, мм
  height_mm?: number; // Высота, мм
  depth_mm?: number; // Глубина, мм
  finish?: string; // Покрытие (матовый, глянец, эмаль и пр.)
  color?: string; // Цвет
  hardware?: string; // Фурнитура/петли/направляющие
  soft_close?: boolean; // Доводчики (да/нет)
  drawer_count?: number; // Количество ящиков
  sink_type?: 'накладная' | 'врезная' | 'столешница'; // Тип раковины/столешницы
  mirror_lighting?: boolean; // Подсветка зеркала
  ip_rating?: string; // Класс защиты IP (например, IP44)
  warranty_months?: number; // Гарантия, мес
  collection?: string; // Коллекция/серия
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  elements: TemplateElement[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'barcode' | 'qr' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface PrintJob {
  id: string;
  product_id: string;
  template_id: string;
  quantity: number;
  operator: string;
  type: 'direct' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date | string;
  updated_at?: Date | string;
  completed_at?: Date | string;
  error_message?: string;
  file_url?: string;
  productName?: string;
  templateName?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'blocked' | 'pending';
  department: string;
  permissions: string[];
  avatar_url?: string;
  last_login?: Date | string;
  created_at: Date | string;
}

export interface Printer {
  id: string;
  name: string;
  type: 'ZPL' | 'PDF' | 'EPL' | 'Direct';
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  location: string;
  ip_address?: string;
  model: string;
  capabilities: string[];
  paper_size: string;
  resolution: string;
  total_jobs: number;
  error_count: number;
  last_job_time?: Date | string;
  maintenance_date?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: Date | string;
}

// Типы для API запросов
export interface CreateProductRequest {
  name: string;
  sku: string;
  article?: string;
  category: string;
  description?: string;
  price?: number;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  expiration_days?: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreatePrintJobRequest {
  product_id: string;
  template_id: string;
  quantity: number;
  operator: string;
  type: 'direct' | 'pdf';
}

// Типы для ответов API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
