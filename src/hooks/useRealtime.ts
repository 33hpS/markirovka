/**
 * React Hook для Supabase Realtime
 * Упрощает использование realtime подписок в компонентах
 */

import { useEffect, useState, useCallback } from 'react';

import type { Category } from '../services/apiService';
import {
  subscribeToCategoriesChanges,
  subscribeToTemplatesChanges,
  subscribeToProductsChanges,
  RealtimeSubscription,
} from '../services/realtimeService';

// =====================================================
// useCategories Realtime Hook
// =====================================================

interface UseCategoriesRealtimeOptions {
  enabled?: boolean;
  onInsert?: (category: Category) => void;
  onUpdate?: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
}

export function useCategoriesRealtime(
  options: UseCategoriesRealtimeOptions = {}
) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: RealtimeSubscription | null = null;

    try {
      subscription = subscribeToCategoriesChanges(
        // INSERT
        payload => {
          const newCategory = payload.new as Category;
          if (onInsert && newCategory) {
            onInsert(newCategory);
          }
        },
        // UPDATE
        payload => {
          const updatedCategory = payload.new as Category;
          if (onUpdate && updatedCategory) {
            onUpdate(updatedCategory);
          }
        },
        // DELETE
        payload => {
          const oldCategory = payload.old as Category;
          if (onDelete && oldCategory?.id) {
            onDelete(oldCategory.id);
          }
        }
      );

      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка подключения к realtime';
      setError(errorMessage);
      setIsConnected(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [enabled, onInsert, onUpdate, onDelete]);

  return { isConnected, error };
}

// =====================================================
// useTemplates Realtime Hook
// =====================================================

interface UseTemplatesRealtimeOptions {
  enabled?: boolean;
  onInsert?: (template: unknown) => void;
  onUpdate?: (template: unknown) => void;
  onDelete?: (templateId: string) => void;
}

export function useTemplatesRealtime(
  options: UseTemplatesRealtimeOptions = {}
) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: RealtimeSubscription | null = null;

    try {
      subscription = subscribeToTemplatesChanges(
        // INSERT
        payload => {
          if (onInsert && payload.new) {
            onInsert(payload.new);
          }
        },
        // UPDATE
        payload => {
          if (onUpdate && payload.new) {
            onUpdate(payload.new);
          }
        },
        // DELETE
        payload => {
          const oldTemplate = payload.old as { id?: string };
          if (onDelete && oldTemplate?.id) {
            onDelete(oldTemplate.id);
          }
        }
      );

      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка подключения к realtime';
      setError(errorMessage);
      setIsConnected(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [enabled, onInsert, onUpdate, onDelete]);

  return { isConnected, error };
}

// =====================================================
// useProducts Realtime Hook
// =====================================================

interface UseProductsRealtimeOptions {
  enabled?: boolean;
  onInsert?: (product: unknown) => void;
  onUpdate?: (product: unknown) => void;
  onDelete?: (productId: string) => void;
}

export function useProductsRealtime(options: UseProductsRealtimeOptions = {}) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let subscription: RealtimeSubscription | null = null;

    try {
      subscription = subscribeToProductsChanges(
        // INSERT
        payload => {
          if (onInsert && payload.new) {
            onInsert(payload.new);
          }
        },
        // UPDATE
        payload => {
          if (onUpdate && payload.new) {
            onUpdate(payload.new);
          }
        },
        // DELETE
        payload => {
          const oldProduct = payload.old as { id?: string };
          if (onDelete && oldProduct?.id) {
            onDelete(oldProduct.id);
          }
        }
      );

      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка подключения к realtime';
      setError(errorMessage);
      setIsConnected(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [enabled, onInsert, onUpdate, onDelete]);

  return { isConnected, error };
}

// =====================================================
// useRealtimeSync - Combined Hook
// =====================================================

interface UseRealtimeSyncOptions {
  categories?: boolean;
  templates?: boolean;
  products?: boolean;
  onCategoryChange?: () => void;
  onTemplateChange?: () => void;
  onProductChange?: () => void;
}

/**
 * Универсальный хук для подписки на realtime изменения
 * Автоматически вызывает callback при любых изменениях
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const {
    categories = false,
    templates = false,
    products = false,
    onCategoryChange,
    onTemplateChange,
    onProductChange,
  } = options;

  const [connections, setConnections] = useState({
    categories: false,
    templates: false,
    products: false,
  });

  const handleCategoryChange = useCallback(() => {
    if (onCategoryChange) onCategoryChange();
  }, [onCategoryChange]);

  const handleTemplateChange = useCallback(() => {
    if (onTemplateChange) onTemplateChange();
  }, [onTemplateChange]);

  const handleProductChange = useCallback(() => {
    if (onProductChange) onProductChange();
  }, [onProductChange]);

  const categoriesRealtime = useCategoriesRealtime({
    enabled: categories,
    onInsert: handleCategoryChange,
    onUpdate: handleCategoryChange,
    onDelete: handleCategoryChange,
  });

  const templatesRealtime = useTemplatesRealtime({
    enabled: templates,
    onInsert: handleTemplateChange,
    onUpdate: handleTemplateChange,
    onDelete: handleTemplateChange,
  });

  const productsRealtime = useProductsRealtime({
    enabled: products,
    onInsert: handleProductChange,
    onUpdate: handleProductChange,
    onDelete: handleProductChange,
  });

  useEffect(() => {
    setConnections({
      categories: categoriesRealtime.isConnected,
      templates: templatesRealtime.isConnected,
      products: productsRealtime.isConnected,
    });
  }, [
    categoriesRealtime.isConnected,
    templatesRealtime.isConnected,
    productsRealtime.isConnected,
  ]);

  const isAnyConnected = categories
    ? categoriesRealtime.isConnected
    : templates
      ? templatesRealtime.isConnected
      : products
        ? productsRealtime.isConnected
        : false;

  const errors = [
    categoriesRealtime.error,
    templatesRealtime.error,
    productsRealtime.error,
  ].filter(Boolean);

  return {
    isConnected: isAnyConnected,
    connections,
    errors: errors.length > 0 ? errors : null,
  };
}
