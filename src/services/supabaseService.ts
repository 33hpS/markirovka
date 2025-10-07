import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseConfig } from '../config/config';

// Типы для базы данных
export interface DatabaseProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  description?: string;
  manufacturer: string;
  weight: string;
  barcode: string;
  qr_data: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  elements: unknown; // JSON field
  suitable_for: string[]; // JSON array
  version: string;
  is_active: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface DatabasePrintJob {
  id: string;
  product_id: string;
  template_id: string;
  quantity: number;
  operator: string;
  printer_id?: string;
  type: 'direct' | 'pdf';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'blocked' | 'pending';
  department: string;
  permissions: string[]; // JSON array
  last_login?: string;
  created_at: string;
  avatar_url?: string;
}

class SupabaseService {
  constructor(private readonly client: SupabaseClient) {}

  // Продукты
  async getProducts() {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DatabaseProduct[];
  }

  async getProductById(id: string) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DatabaseProduct;
  }

  async getProductBySku(sku: string) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) throw error;
    return data as DatabaseProduct;
  }

  async searchProducts(query: string) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .or(
        `name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query},qr_data.ilike.%${query}%`
      )
      .eq('status', 'active');

    if (error) throw error;
    return data as DatabaseProduct[];
  }

  async createProduct(
    product: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await this.client
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseProduct;
  }

  async updateProduct(id: string, updates: Partial<DatabaseProduct>) {
    const { data, error } = await this.client
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseProduct;
  }

  async deleteProduct(id: string) {
    const { error } = await this.client.from('products').delete().eq('id', id);

    if (error) throw error;
  }

  // Шаблоны
  async getTemplates() {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DatabaseTemplate[];
  }

  async getTemplateById(id: string) {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DatabaseTemplate;
  }

  async getSuitableTemplates(category: string) {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .contains('suitable_for', [category])
      .eq('is_active', true);

    if (error) throw error;
    return data as DatabaseTemplate[];
  }

  async createTemplate(
    template: Omit<DatabaseTemplate, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await this.client
      .from('templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTemplate;
  }

  async updateTemplate(id: string, updates: Partial<DatabaseTemplate>) {
    const { data, error } = await this.client
      .from('templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseTemplate;
  }

  // Задания печати
  async createPrintJob(job: Omit<DatabasePrintJob, 'id' | 'created_at'>) {
    const { data, error } = await this.client
      .from('print_jobs')
      .insert([job])
      .select()
      .single();

    if (error) throw error;
    return data as DatabasePrintJob;
  }

  async getPrintJobs(limit = 50) {
    const { data, error } = await this.client
      .from('print_jobs')
      .select(
        `
        *,
        products:product_id(name, sku),
        templates:template_id(name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async updatePrintJobStatus(
    id: string,
    status: DatabasePrintJob['status'],
    errorMessage?: string
  ) {
    const updates: Partial<DatabasePrintJob> = { status };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { data, error } = await this.client
      .from('print_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabasePrintJob;
  }

  // Пользователи
  async getUsers() {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DatabaseUser[];
  }

  async createUser(user: Omit<DatabaseUser, 'id' | 'created_at'>) {
    const { data, error } = await this.client
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseUser;
  }

  async updateUser(id: string, updates: Partial<DatabaseUser>) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseUser;
  }

  // Аналитика и отчеты
  async getProductionStats(dateFrom?: string, dateTo?: string) {
    let query = this.client.from('print_jobs').select('*');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getPopularProducts(limit = 10) {
    const { data, error } = await this.client.rpc('get_popular_products', {
      limit_count: limit,
    });

    if (error) throw error;
    return data;
  }

  // Реальное время подписки
  subscribeToProducts(callback: (payload: unknown) => void) {
    return this.client
      .channel('products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        callback
      )
      .subscribe();
  }

  subscribeToPrintJobs(callback: (payload: unknown) => void) {
    return this.client
      .channel('print_jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs' },
        callback
      )
      .subscribe();
  }

  // Аутентификация
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Файлы
  async uploadFile(bucket: string, fileName: string, file: File | Blob) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket: string, fileName: string) {
    const { data } = this.client.storage.from(bucket).getPublicUrl(fileName);

    return data.publicUrl;
  }
}

// Экспорт единственного экземпляра
let instance: SupabaseService | null = null;

export const isSupabaseAvailable = supabaseConfig.isConfigured;

export function getSupabaseService(): SupabaseService {
  if (
    !supabaseConfig.isConfigured ||
    !supabaseConfig.url ||
    !supabaseConfig.anonKey
  ) {
    throw new Error(
      'Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

  if (!instance) {
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    instance = new SupabaseService(client);
  }

  return instance;
}

export default getSupabaseService;
