import * as React from 'react';
import { useState } from 'react';

interface PrintJob {
  id: string;
  name: string;
  template: string;
  quantity: number;
  printer: string;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  errorMessage?: string;
  user: string;
  estimatedTime?: string;
}

interface PrinterProfile {
  id: string;
  name: string;
  type: 'ZPL' | 'PDF' | 'EPL' | 'Direct';
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  location: string;
  ipAddress: string;
  model: string;
  capabilities: string[];
  paperSize: string;
  resolution: string;
  lastJobTime?: string;
  totalJobs: number;
  errorCount: number;
  maintenanceDate?: string;
}

const mockPrintJobs: PrintJob[] = [
  {
    id: '1',
    name: 'Этикетки молочной продукции',
    template: 'Стандартная этикетка',
    quantity: 500,
    printer: 'Zebra-ZT420-01',
    status: 'printing',
    priority: 'high',
    createdAt: '2025-10-04T10:30:00',
    startedAt: '2025-10-04T10:35:00',
    progress: 65,
    user: 'И. Петров',
    estimatedTime: '5 мин',
  },
  {
    id: '2',
    name: 'QR коды для экспорта',
    template: 'Экспортная этикетка',
    quantity: 200,
    printer: 'Brother-QL820-02',
    status: 'pending',
    priority: 'normal',
    createdAt: '2025-10-04T11:15:00',
    progress: 0,
    user: 'А. Сидорова',
    estimatedTime: '3 мин',
  },
  {
    id: '3',
    name: 'Премиум упаковка',
    template: 'Премиум этикетка',
    quantity: 50,
    printer: 'HP-LaserJet-03',
    status: 'completed',
    priority: 'normal',
    createdAt: '2025-10-04T09:45:00',
    startedAt: '2025-10-04T09:50:00',
    completedAt: '2025-10-04T10:05:00',
    progress: 100,
    user: 'М. Козлов',
  },
  {
    id: '4',
    name: 'Срочная партия хлебобулочных',
    template: 'Минимальная этикетка',
    quantity: 1000,
    printer: 'Zebra-ZT420-01',
    status: 'failed',
    priority: 'urgent',
    createdAt: '2025-10-04T08:20:00',
    startedAt: '2025-10-04T08:25:00',
    progress: 25,
    errorMessage: 'Замятие бумаги. Требуется обслуживание.',
    user: 'Е. Васильев',
  },
];

const mockPrinters: PrinterProfile[] = [
  {
    id: 'zebra-01',
    name: 'Zebra-ZT420-01',
    type: 'ZPL',
    status: 'busy',
    location: 'Склад А, участок 1',
    ipAddress: '192.168.1.101',
    model: 'Zebra ZT420',
    capabilities: ['203 dpi', '300 dpi', 'Термопечать', 'Термотрансфер'],
    paperSize: '104mm x 74mm',
    resolution: '203 dpi',
    lastJobTime: '2025-10-04T10:35:00',
    totalJobs: 1547,
    errorCount: 3,
    maintenanceDate: '2025-09-15',
  },
  {
    id: 'brother-02',
    name: 'Brother-QL820-02',
    type: 'PDF',
    status: 'online',
    location: 'Упаковочный участок',
    ipAddress: '192.168.1.102',
    model: 'Brother QL-820NWB',
    capabilities: ['300 dpi', 'Цветная печать', 'Wi-Fi'],
    paperSize: '62mm x 29mm',
    resolution: '300 dpi',
    totalJobs: 892,
    errorCount: 1,
    maintenanceDate: '2025-09-01',
  },
  {
    id: 'hp-03',
    name: 'HP-LaserJet-03',
    type: 'PDF',
    status: 'online',
    location: 'Офис, 2 этаж',
    ipAddress: '192.168.1.103',
    model: 'HP LaserJet Pro M404n',
    capabilities: ['1200 dpi', 'Двусторонняя печать', 'A4'],
    paperSize: 'A4',
    resolution: '1200 dpi',
    lastJobTime: '2025-10-04T10:05:00',
    totalJobs: 2341,
    errorCount: 0,
    maintenanceDate: '2025-08-20',
  },
  {
    id: 'zebra-04',
    name: 'Zebra-GK420d-04',
    type: 'ZPL',
    status: 'error',
    location: 'Склад Б, участок 2',
    ipAddress: '192.168.1.104',
    model: 'Zebra GK420d',
    capabilities: ['203 dpi', 'Термопечать'],
    paperSize: '58mm x 40mm',
    resolution: '203 dpi',
    totalJobs: 745,
    errorCount: 8,
    maintenanceDate: '2025-07-10',
  },
];

const Printing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'printers' | 'monitor'>(
    'queue'
  );
  const [printJobs, setPrintJobs] = useState<PrintJob[]>(mockPrintJobs);
  const [_printers] = useState<PrinterProfile[]>(mockPrinters);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [_selectedPrinter, setSelectedPrinter] =
    useState<PrinterProfile | null>(null);
  const [_showNewJob, setShowNewJob] = useState(false);

  const getStatusColor = (
    status: PrintJob['status'] | PrinterProfile['status']
  ) => {
    switch (status) {
      case 'completed':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'printing':
      case 'busy':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'paused':
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: PrintJob['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const pauseJob = (jobId: string) => {
    setPrintJobs(jobs =>
      jobs.map(job =>
        job.id === jobId
          ? { ...job, status: job.status === 'paused' ? 'pending' : 'paused' }
          : job
      )
    );
  };

  const cancelJob = (jobId: string) => {
    setPrintJobs(jobs => jobs.filter(job => job.id !== jobId));
  };

  const restartJob = (jobId: string) => {
    setPrintJobs(jobs =>
      jobs.map(job =>
        job.id === jobId
          ? { ...job, status: 'pending' as const, progress: 0 }
          : job
      )
    );
  };

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Управление печатью
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-2'>
          Очередь заданий, профили принтеров и мониторинг статусов
        </p>
      </div>

      {/* Навигационные вкладки */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6'>
        <div className='border-b border-gray-200 dark:border-gray-700'>
          <nav className='flex space-x-8 px-6'>
            {[
              { id: 'queue', name: 'Очередь печати', icon: '📋' },
              { id: 'printers', name: 'Принтеры', icon: '🖨️' },
              { id: 'monitor', name: 'Мониторинг', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as 'queue' | 'printers' | 'monitor')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Очередь печати */}
      {activeTab === 'queue' && (
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              Очередь заданий печати
            </h2>
            <button
              onClick={() => setShowNewJob(true)}
              className='bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
            >
              + Добавить задание
            </button>
          </div>{' '}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-900'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Задание
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Принтер
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Статус
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Прогресс
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                  {printJobs.map(job => (
                    <tr
                      key={job.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div
                            className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(job.priority)}`}
                          ></div>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {job.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {job.template} • {job.quantity} шт. • {job.user}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {job.printer}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}
                        >
                          {job.status === 'pending' && 'Ожидание'}
                          {job.status === 'printing' && 'Печатается'}
                          {job.status === 'completed' && 'Завершено'}
                          {job.status === 'failed' && 'Ошибка'}
                          {job.status === 'paused' && 'Приостановлено'}
                        </span>
                        {job.errorMessage && (
                          <div className='text-xs text-red-600 mt-1'>
                            {job.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full ${
                              job.status === 'failed'
                                ? 'bg-red-500'
                                : job.status === 'completed'
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {job.progress}%{' '}
                          {job.estimatedTime &&
                            `• ${job.estimatedTime} осталось`}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        {job.status === 'printing' && (
                          <button
                            onClick={() => pauseJob(job.id)}
                            className='text-yellow-600 hover:text-yellow-900'
                          >
                            ⏸️
                          </button>
                        )}
                        {job.status === 'paused' && (
                          <button
                            onClick={() => pauseJob(job.id)}
                            className='text-green-600 hover:text-green-900'
                          >
                            ▶️
                          </button>
                        )}
                        {job.status === 'failed' && (
                          <button
                            onClick={() => restartJob(job.id)}
                            className='text-blue-600 hover:text-blue-900'
                          >
                            🔄
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedJob(job)}
                          className='text-indigo-600 hover:text-indigo-900'
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => cancelJob(job.id)}
                          className='text-red-600 hover:text-red-900'
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Принтеры */}
      {activeTab === 'printers' && (
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
              Профили принтеров
            </h2>
            <button className='bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'>
              + Добавить принтер
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {_printers.map(printer => (
              <div
                key={printer.id}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {printer.name}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      {printer.model}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${getStatusColor(printer.status)}`}
                  >
                    {printer.status === 'online' && 'Онлайн'}
                    {printer.status === 'offline' && 'Офлайн'}
                    {printer.status === 'busy' && 'Занят'}
                    {printer.status === 'error' && 'Ошибка'}
                    {printer.status === 'maintenance' && 'Обслуживание'}
                  </span>
                </div>

                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Тип:
                    </span>
                    <span className='font-medium'>{printer.type}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Местоположение:
                    </span>
                    <span className='font-medium text-xs'>
                      {printer.location}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      IP:
                    </span>
                    <span className='font-medium font-mono text-xs'>
                      {printer.ipAddress}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Разрешение:
                    </span>
                    <span className='font-medium'>{printer.resolution}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Заданий:
                    </span>
                    <span className='font-medium'>{printer.totalJobs}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Ошибок:
                    </span>
                    <span
                      className={`font-medium ${printer.errorCount > 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      {printer.errorCount}
                    </span>
                  </div>
                </div>

                <div className='mt-4 space-y-2'>
                  <div className='flex flex-wrap gap-1'>
                    {printer.capabilities.slice(0, 3).map(capability => (
                      <span
                        key={capability}
                        className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded'
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='mt-4 flex gap-2'>
                  <button
                    onClick={() => setSelectedPrinter(printer)}
                    className='flex-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                  >
                    Настройки
                  </button>
                  <button className='px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700'>
                    Тест
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Мониторинг */}
      {activeTab === 'monitor' && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Мониторинг системы печати
          </h2>

          {/* Общая статистика */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {[
              {
                title: 'Активных заданий',
                value: printJobs.filter(j => j.status === 'printing').length,
                color: 'blue',
              },
              {
                title: 'В очереди',
                value: printJobs.filter(j => j.status === 'pending').length,
                color: 'yellow',
              },
              {
                title: 'Принтеров онлайн',
                value: _printers.filter(
                  p => p.status === 'online' || p.status === 'busy'
                ).length,
                color: 'green',
              },
              {
                title: 'Ошибок сегодня',
                value: _printers.reduce((sum, p) => sum + p.errorCount, 0),
                color: 'red',
              },
            ].map((stat, index) => (
              <div
                key={index}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'
              >
                <div className='text-sm font-medium text-gray-500'>
                  {stat.title}
                </div>
                <div
                  className={`text-3xl font-bold mt-2 text-${stat.color}-600`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Статус принтеров в реальном времени */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              Статус принтеров
            </h3>
            <div className='space-y-4'>
              {_printers.map(printer => (
                <div
                  key={printer.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div className='flex items-center'>
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        printer.status === 'online'
                          ? 'bg-green-500'
                          : printer.status === 'busy'
                            ? 'bg-blue-500'
                            : printer.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                      }`}
                    ></div>
                    <div>
                      <div className='font-medium'>{printer.name}</div>
                      <div className='text-sm text-gray-500'>
                        {printer.location}
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-medium'>
                      {printer.status === 'busy'
                        ? 'Печатает'
                        : printer.status === 'online'
                          ? 'Готов'
                          : printer.status === 'error'
                            ? 'Ошибка'
                            : 'Офлайн'}
                    </div>
                    {printer.lastJobTime && (
                      <div className='text-xs text-gray-500'>
                        Последнее:{' '}
                        {new Date(printer.lastJobTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно деталей задания */}
      {selectedJob && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-xl font-bold'>{selectedJob.name}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <strong>Шаблон:</strong> {selectedJob.template}
                  </div>
                  <div>
                    <strong>Количество:</strong> {selectedJob.quantity}
                  </div>
                  <div>
                    <strong>Принтер:</strong> {selectedJob.printer}
                  </div>
                  <div>
                    <strong>Приоритет:</strong> {selectedJob.priority}
                  </div>
                  <div>
                    <strong>Создано:</strong>{' '}
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Пользователь:</strong> {selectedJob.user}
                  </div>
                </div>

                {selectedJob.errorMessage && (
                  <div className='p-3 bg-red-50 border border-red-200 rounded'>
                    <strong className='text-red-800'>Ошибка:</strong>
                    <div className='text-red-700'>
                      {selectedJob.errorMessage}
                    </div>
                  </div>
                )}
              </div>

              <div className='mt-6 flex gap-3'>
                <button className='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'>
                  Повторить
                </button>
                <button className='border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50'>
                  Отменить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Printing;
