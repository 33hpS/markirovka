import { RefreshCw, Database, HardDrive, Server } from 'lucide-react';

import {
  useConnectionStatus,
  type ServiceStatus,
} from '../../hooks/useConnectionStatus';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface ServiceIndicatorProps {
  name: string;
  status: ServiceStatus;
  message: string | undefined;
  lastChecked: Date | undefined;
  icon: React.ReactNode;
}

function ServiceIndicator({
  name,
  status,
  message,
  lastChecked,
  icon,
}: ServiceIndicatorProps) {
  const getStatusColor = (s: ServiceStatus) => {
    switch (s) {
      case 'connected':
        return 'bg-green-500';
      case 'checking':
        return 'bg-gray-400 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (s: ServiceStatus) => {
    switch (s) {
      case 'connected':
        return 'Подключено';
      case 'checking':
        return 'Проверка...';
      case 'disconnected':
        return 'Отключено';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Не проверялось';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} сек назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    return date.toLocaleTimeString('ru-RU');
  };

  return (
    <div className='flex items-center justify-between p-2 hover:bg-accent rounded-md'>
      <div className='flex items-center gap-3'>
        <div className='text-muted-foreground'>{icon}</div>
        <div>
          <div className='font-medium text-sm'>{name}</div>
          <div className='text-xs text-muted-foreground'>{message}</div>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className='text-xs'>
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(status)} mr-2`}
          />
          {getStatusText(status)}
        </Badge>
        <div className='text-xs text-muted-foreground whitespace-nowrap'>
          {formatTime(lastChecked)}
        </div>
      </div>
    </div>
  );
}

export function ConnectionStatus() {
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

  const overallStatus = getOverallStatus();

  const getIndicatorColor = () => {
    switch (overallStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'checking':
        return 'bg-gray-400 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 gap-2 px-2'
          aria-label='Статус подключений'
        >
          <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
          <span className='text-xs hidden sm:inline'>Сервисы</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80' align='end'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold text-sm'>Статус сервисов</h4>
            <Button
              variant='ghost'
              size='sm'
              onClick={checkAll}
              disabled={isChecking}
              className='h-7 px-2'
            >
              <RefreshCw
                className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>

          <div className='space-y-1'>
            <ServiceIndicator
              name='Cloudflare Worker'
              status={status.worker.status}
              message={status.worker.message}
              lastChecked={status.worker.lastChecked}
              icon={<Server className='h-4 w-4' />}
            />
            <ServiceIndicator
              name='Supabase'
              status={status.supabase.status}
              message={status.supabase.message}
              lastChecked={status.supabase.lastChecked}
              icon={<Database className='h-4 w-4' />}
            />
            <ServiceIndicator
              name='R2 Storage'
              status={status.r2.status}
              message={status.r2.message}
              lastChecked={status.r2.lastChecked}
              icon={<HardDrive className='h-4 w-4' />}
            />
          </div>

          <div className='pt-2 border-t text-xs text-muted-foreground'>
            Автоматическая проверка каждую минуту
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
