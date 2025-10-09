/**
 * Supabase Realtime Service
 * Обеспечивает синхронизацию данных в реальном времени между клиентами
 */

import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

// =====================================================
// Categories Realtime
// =====================================================

export function subscribeToCategoriesChanges(
  onInsert?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onUpdate?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onDelete?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
): RealtimeSubscription {
  const channel = supabase
    .channel('categories_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'categories' },
      payload => {
        if (onInsert) onInsert(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'categories' },
      payload => {
        if (onUpdate) onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'categories' },
      payload => {
        if (onDelete) onDelete(payload);
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// =====================================================
// Label Templates Realtime
// =====================================================

export function subscribeToTemplatesChanges(
  onInsert?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onUpdate?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onDelete?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
): RealtimeSubscription {
  const channel = supabase
    .channel('templates_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'label_templates' },
      payload => {
        if (onInsert) onInsert(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'label_templates' },
      payload => {
        if (onUpdate) onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'label_templates' },
      payload => {
        if (onDelete) onDelete(payload);
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// =====================================================
// Products Realtime
// =====================================================

export function subscribeToProductsChanges(
  onInsert?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onUpdate?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void,
  onDelete?: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
): RealtimeSubscription {
  const channel = supabase
    .channel('products_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'products' },
      payload => {
        if (onInsert) onInsert(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      payload => {
        if (onUpdate) onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'products' },
      payload => {
        if (onDelete) onDelete(payload);
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// =====================================================
// Broadcast Messages
// =====================================================

export interface BroadcastMessage<T = unknown> {
  event: string;
  payload: T;
  timestamp?: string;
}

export function subscribeToBroadcast<T = unknown>(
  channelName: string,
  eventName: string,
  callback: (message: BroadcastMessage<T>) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(channelName)
    .on('broadcast', { event: eventName }, payload => {
      callback(payload as unknown as BroadcastMessage<T>);
    })
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export async function sendBroadcast<T = unknown>(
  channelName: string,
  eventName: string,
  payload: T
): Promise<void> {
  const channel = supabase.channel(channelName);

  await channel.send({
    type: 'broadcast',
    event: eventName,
    payload,
  });
}

// =====================================================
// Presence (Online Users)
// =====================================================

export interface UserPresence {
  user_id: string;
  username?: string;
  online_at: string;
}

export function subscribeToPresence(
  channelName: string,
  currentUser: UserPresence,
  onJoin?: (user: UserPresence) => void,
  onLeave?: (user: UserPresence) => void,
  onSync?: (users: UserPresence[]) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(channelName)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as unknown as UserPresence[];
      if (onSync) onSync(users);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach(presence => {
        if (onJoin) onJoin(presence as unknown as UserPresence);
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach(presence => {
        if (onLeave) onLeave(presence as unknown as UserPresence);
      });
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track(currentUser);
      }
    });

  return {
    channel,
    unsubscribe: async () => {
      await channel.untrack();
      supabase.removeChannel(channel);
    },
  };
}

// =====================================================
// Utility Functions
// =====================================================

export function getConnectionState(): string {
  const realtime = supabase.realtime as { connectionState?: () => string };
  return realtime.connectionState?.() ?? 'DISCONNECTED';
}

export function isConnected(): boolean {
  return getConnectionState() === 'CONNECTED';
}

// =====================================================
// Export Supabase Client
// =====================================================

export { supabase };
