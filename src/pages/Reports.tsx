import * as React from 'react';
import { useState, useEffect } from 'react';

import { dataService } from '../services/dataService';

interface ProductionStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  totalQuantity: number;
  directPrints: number;
  pdfExports: number;
}

const ReportsInteractive: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [reportType, setReportType] = useState('production');
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [_statsLoading, setStatsLoading] = useState(true);
  const [_statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const now = new Date();
        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[dateRange as keyof typeof daysMap] ?? 7;
        const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const data = await dataService.getProductionStats(dateFrom);
        if (!isMounted) return;

        setStats(data);
      } catch (err) {
        if (!isMounted) return;
        setStatsError(
          err instanceof Error ? err.message : 'Ошибка загрузки статистики'
        );
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  const totalProduced = stats?.totalQuantity ?? 0;
  const totalRejected = stats?.failedJobs ?? 0;
  const avgEfficiency = stats
    ? ((stats.completedJobs / (stats.totalJobs || 1)) * 100).toFixed(1)
    : '0';

  return (
    <div className='w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Отчёты и аналитика</h1>
        <div className='flex gap-3'>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
          >
            <option value='7d'>Последние 7 дней</option>
            <option value='30d'>Последние 30 дней</option>
            <option value='90d'>Последние 90 дней</option>
          </select>
          <button className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500'>
            📊 Экспорт отчёта
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white p-6 rounded-lg shadow border'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 rounded-md'>
              <div className='w-6 h-6 bg-blue-600 rounded'></div>
            </div>
            <div className='ml-4'>
              <div className='text-2xl font-bold text-blue-600'>
                {totalProduced.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>Всего произведено</div>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow border'>
          <div className='flex items-center'>
            <div className='p-2 bg-red-100 rounded-md'>
              <div className='w-6 h-6 bg-red-600 rounded'></div>
            </div>
            <div className='ml-4'>
              <div className='text-2xl font-bold text-red-600'>
                {totalRejected.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>Неудачных заданий</div>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow border'>
          <div className='flex items-center'>
            <div className='p-2 bg-green-100 rounded-md'>
              <div className='w-6 h-6 bg-green-600 rounded'></div>
            </div>
            <div className='ml-4'>
              <div className='text-2xl font-bold text-green-600'>
                {avgEfficiency}%
              </div>
              <div className='text-sm text-gray-600'>
                Коэффициент успешности
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow border'>
          <div className='flex items-center'>
            <div className='p-2 bg-purple-100 rounded-md'>
              <div className='w-6 h-6 bg-purple-600 rounded'></div>
            </div>
            <div className='ml-4'>
              <div className='text-2xl font-bold text-purple-600'>
                {stats?.totalJobs ?? 0}
              </div>
              <div className='text-sm text-gray-600'>Всего заданий</div>
            </div>
          </div>
        </div>
      </div>

      <div className='grid lg:grid-cols-3 gap-6'>
        {/* Production Chart */}
        <div className='lg:col-span-2 bg-white rounded-lg shadow'>
          <div className='p-6 border-b'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-medium'>График производства</h2>
              <div className='flex gap-2'>
                <button
                  onClick={() => setReportType('production')}
                  className={`px-3 py-1 text-sm rounded ${
                    reportType === 'production'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Производство
                </button>
                <button
                  onClick={() => setReportType('quality')}
                  className={`px-3 py-1 text-sm rounded ${
                    reportType === 'quality'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Качество
                </button>
              </div>
            </div>
          </div>
          <div className='p-6'>
            <div className='py-12 text-center text-gray-500'>
              Детализированная статистика по дням будет доступна в следующей
              версии.
              <br />
              Используйте верхние панели для просмотра общей статистики.
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className='bg-white rounded-lg shadow'>
          <div className='p-6 border-b'>
            <h2 className='text-lg font-medium'>Недавняя активность</h2>
          </div>
          <div className='p-6'>
            <div className='space-y-4'>
              <div className='flex gap-3'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <div className='w-3 h-3 bg-green-600 rounded-full'></div>
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Партия B003 завершена
                  </div>
                  <div className='text-xs text-gray-500'>5 минут назад</div>
                </div>
              </div>

              <div className='flex gap-3'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <div className='w-3 h-3 bg-blue-600 rounded-full'></div>
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Создана новая партия B004
                  </div>
                  <div className='text-xs text-gray-500'>1 час назад</div>
                </div>
              </div>

              <div className='flex gap-3'>
                <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <div className='w-3 h-3 bg-yellow-600 rounded-full'></div>
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Партия B002 на контроле
                  </div>
                  <div className='text-xs text-gray-500'>2 часа назад</div>
                </div>
              </div>

              <div className='flex gap-3'>
                <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                  <div className='w-3 h-3 bg-purple-600 rounded-full'></div>
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Сгенерировано 150 QR-кодов
                  </div>
                  <div className='text-xs text-gray-500'>3 часа назад</div>
                </div>
              </div>

              <div className='flex gap-3'>
                <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                  <div className='w-3 h-3 bg-red-600 rounded-full'></div>
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Отклонена партия B001
                  </div>
                  <div className='text-xs text-gray-500'>1 день назад</div>
                </div>
              </div>
            </div>

            <div className='mt-6 pt-4 border-t'>
              <button className='w-full px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800'>
                Показать всю историю →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsInteractive;
