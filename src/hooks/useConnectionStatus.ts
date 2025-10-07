import { useState, useEffect, useCallback } from 'react';

export type ServiceStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export interface ConnectionStatus {
  supabase: {
    status: ServiceStatus;
    message?: string;
    lastChecked?: Date;
  };
  r2: {
    status: ServiceStatus;
    message?: string;
    lastChecked?: Date;
  };
  worker: {
    status: ServiceStatus;
    message?: string;
    lastChecked?: Date;
  };
}

const WORKER_BASE_URL =
  import.meta.env.VITE_WORKER_BASE_URL ??
  'https://markirovka.sherhan1988hp.workers.dev';
const CHECK_INTERVAL = 60000; // Проверка каждую минуту

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    supabase: { status: 'checking' },
    r2: { status: 'checking' },
    worker: { status: 'checking' },
  });
  const [isChecking, setIsChecking] = useState(false);

  // Проверка Worker
  const checkWorker = useCallback(async () => {
    try {
      const response = await fetch(`${WORKER_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const text = await response.text();
        return {
          status: 'connected' as ServiceStatus,
          message: text === 'ok' ? 'Worker активен' : 'Неожиданный ответ',
          lastChecked: new Date(),
        };
      } else {
        return {
          status: 'error' as ServiceStatus,
          message: `HTTP ${response.status}`,
          lastChecked: new Date(),
        };
      }
    } catch (error) {
      return {
        status: 'disconnected' as ServiceStatus,
        message: error instanceof Error ? error.message : 'Ошибка подключения',
        lastChecked: new Date(),
      };
    }
  }, []);

  // Проверка Supabase (через Worker)
  const checkSupabase = useCallback(async () => {
    try {
      // Проверяем через простой запрос к API
      const response = await fetch(`${WORKER_BASE_URL}/api/health/supabase`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.connected
            ? ('connected' as ServiceStatus)
            : ('disconnected' as ServiceStatus),
          message:
            data.message ??
            (data.connected ? 'База данных активна' : 'База недоступна'),
          lastChecked: new Date(),
        };
      } else {
        return {
          status: 'error' as ServiceStatus,
          message: `HTTP ${response.status}`,
          lastChecked: new Date(),
        };
      }
    } catch {
      // Если эндпоинт не существует, считаем что Supabase настроен но мы не можем проверить
      return {
        status: 'checking' as ServiceStatus,
        message: 'Проверка недоступна',
        lastChecked: new Date(),
      };
    }
  }, []);

  // Проверка R2 (через Worker)
  const checkR2 = useCallback(async () => {
    try {
      const response = await fetch(`${WORKER_BASE_URL}/api/health/r2`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.connected
            ? ('connected' as ServiceStatus)
            : ('disconnected' as ServiceStatus),
          message:
            data.message ??
            (data.connected ? 'Хранилище активно' : 'Хранилище недоступно'),
          lastChecked: new Date(),
        };
      } else {
        return {
          status: 'error' as ServiceStatus,
          message: `HTTP ${response.status}`,
          lastChecked: new Date(),
        };
      }
    } catch {
      // Если эндпоинт не существует, считаем что R2 настроен но мы не можем проверить
      return {
        status: 'checking' as ServiceStatus,
        message: 'Проверка недоступна',
        lastChecked: new Date(),
      };
    }
  }, []);

  // Проверка всех сервисов
  const checkAll = useCallback(async () => {
    setIsChecking(true);

    try {
      const [workerStatus, supabaseStatus, r2Status] = await Promise.all([
        checkWorker(),
        checkSupabase(),
        checkR2(),
      ]);

      setStatus({
        worker: workerStatus,
        supabase: supabaseStatus,
        r2: r2Status,
      });
    } catch (error) {
      // Ошибка при проверке сервисов
      if (error instanceof Error) {
        // Можно добавить логирование в production
      }
    } finally {
      setIsChecking(false);
    }
  }, [checkWorker, checkSupabase, checkR2]);

  // Автоматическая проверка при монтировании и периодически
  useEffect(() => {
    checkAll();

    const interval = setInterval(checkAll, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkAll]);

  return {
    status,
    isChecking,
    checkAll,
  };
}
