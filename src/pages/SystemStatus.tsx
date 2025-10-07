import {
  RefreshCw,
  Database,
  HardDrive,
  Server,
  Activity,
  Clock,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  useConnectionStatus,
  type ServiceStatus,
} from '../hooks/useConnectionStatus';

function StatusBadge({ status }: { status: ServiceStatus }) {
  const configs = {
    connected: { color: 'green' as const, label: 'Подключено' },
    checking: { color: 'gray' as const, label: 'Проверка...' },
    disconnected: { color: 'red' as const, label: 'Отключено' },
    error: { color: 'yellow' as const, label: 'Ошибка' },
  };

  const config = configs[status] || configs.checking;

  return <Badge color={config.color}>{config.label}</Badge>;
}

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: ServiceStatus;
  message: string | undefined;
  lastChecked: Date | undefined;
}

function ServiceCard({
  title,
  description,
  icon,
  status,
  message,
  lastChecked,
}: ServiceCardProps) {
  const formatTime = (date: Date | undefined) => {
    if (!date) return 'Не проверялось';
    return date.toLocaleString('ru-RU');
  };

  const getStatusIcon = (s: ServiceStatus) => {
    if (s === 'checking') return 'animate-pulse';
    if (s === 'connected') return 'text-green-500';
    if (s === 'disconnected') return 'text-red-500';
    if (s === 'error') return 'text-yellow-500';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className={getStatusIcon(status)}>{icon}</div>
            <div>
              <CardTitle className='text-lg'>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='space-y-2 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>Статус:</span>
            <span className='font-medium'>{message ?? 'Нет данных'}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              Последняя проверка:
            </span>
            <span className='text-xs'>{formatTime(lastChecked)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemStatus() {
  const { status, isChecking, checkAll } = useConnectionStatus();

  const getOverallStatus = (): ServiceStatus => {
    const statuses = [
      status.worker.status,
      status.supabase.status,
      status.r2.status,
    ];
    if (statuses.every(s => s === 'connected')) return 'connected';
    if (statuses.some(s => s === 'disconnected')) return 'disconnected';
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.some(s => s === 'checking')) return 'checking';
    return 'checking';
  };

  return (
    <div className='container max-w-6xl py-8 space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Activity className='h-8 w-8' />
            Статус системы
          </h1>
          <p className='text-muted-foreground mt-2'>
            Мониторинг подключений к внешним сервисам
          </p>
        </div>
        <Button onClick={checkAll} disabled={isChecking} className='gap-2'>
          <RefreshCw
            className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`}
          />
          Обновить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Общий статус</span>
            <StatusBadge status={getOverallStatus()} />
          </CardTitle>
          <CardDescription>
            Все сервисы работают корректно, если все индикаторы зелёные
          </CardDescription>
        </CardHeader>
      </Card>

      <div className='grid gap-6 md:grid-cols-1 lg:grid-cols-1'>
        <ServiceCard
          title='Cloudflare Worker'
          description='Основной API сервер на Cloudflare Workers'
          icon={<Server className='h-6 w-6' />}
          status={status.worker.status}
          message={status.worker.message}
          lastChecked={status.worker.lastChecked}
        />

        <ServiceCard
          title='Supabase'
          description='PostgreSQL база данных с аутентификацией'
          icon={<Database className='h-6 w-6' />}
          status={status.supabase.status}
          message={status.supabase.message}
          lastChecked={status.supabase.lastChecked}
        />

        <ServiceCard
          title='R2 Storage'
          description='Cloudflare R2 для хранения файлов и документов'
          icon={<HardDrive className='h-6 w-6' />}
          status={status.r2.status}
          message={status.r2.message}
          lastChecked={status.r2.lastChecked}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Информация о мониторинге</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground space-y-2'>
          <p>• Автоматическая проверка выполняется каждую минуту</p>
          <p>• Зелёный статус означает успешное подключение</p>
          <p>• Жёлтый статус указывает на проблемы с ответом сервиса</p>
          <p>• Красный статус означает полное отсутствие подключения</p>
          <p>• Серый пульсирующий статус показывает процесс проверки</p>
        </CardContent>
      </Card>
    </div>
  );
}
