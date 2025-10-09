/**
 * Централизованный Supabase клиент
 * Singleton паттерн для избежания множественных экземпляров
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { supabaseConfig } from '../config/config';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Получить единственный экземпляр Supabase клиента
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      throw new Error(
        'Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      );
    }

    supabaseInstance = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseInstance;
}

/**
 * Экспорт клиента для удобства
 */
export const supabase = getSupabaseClient();
