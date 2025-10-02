import * as React from 'react';
import { useState } from 'react';

interface Batch {
  id: string;
  name: string;
  product: string;
  quantity: number;
  produced: number;
  status:
    | 'planning'
    | 'production'
    | 'quality-check'
    | 'completed'
    | 'rejected';
  createdAt: string;
}

const mockBatches: Batch[] = [
  {
    id: 'B001',
    name: 'Партия молока 001',
    product: 'Молоко 3.2%',
    quantity: 1000,
    produced: 1000,
    status: 'completed',
    createdAt: '2025-10-01',
  },
  {
    id: 'B002',
    name: 'Партия хлеба 045',
    product: 'Хлеб белый',
    quantity: 500,
    produced: 320,
    status: 'production',
    createdAt: '2025-10-02',
  },
  {
    id: 'B003',
    name: 'Партия сыра 012',
    product: 'Сыр твёрдый',
    quantity: 200,
    produced: 200,
    status: 'quality-check',
    createdAt: '2025-10-02',
  },
];

const statusLabels = {
  planning: 'Планирование',
  production: 'Производство',
  'quality-check': 'Контроль качества',
  completed: 'Завершено',
  rejected: 'Отклонено',
};

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  production: 'bg-blue-100 text-blue-800',
  'quality-check': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const Production: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [showNewBatch, setShowNewBatch] = useState(false);

  const updateBatchStatus = (id: string, newStatus: Batch['status']) => {
    setBatches(prev =>
      prev.map(batch =>
        batch.id === id ? { ...batch, status: newStatus } : batch
      )
    );
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Производство</h1>
        <button
          onClick={() => setShowNewBatch(true)}
          className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition'
        >
          + Новая партия
        </button>
      </div>

      <div className='grid gap-6'>
        {/* Stats Cards */}
        <div className='grid md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white p-4 rounded-lg shadow border'>
            <div className='text-2xl font-bold text-blue-600'>
              {batches.filter(b => b.status === 'production').length}
            </div>
            <div className='text-sm text-gray-600'>В производстве</div>
          </div>
          <div className='bg-white p-4 rounded-lg shadow border'>
            <div className='text-2xl font-bold text-yellow-600'>
              {batches.filter(b => b.status === 'quality-check').length}
            </div>
            <div className='text-sm text-gray-600'>На контроле</div>
          </div>
          <div className='bg-white p-4 rounded-lg shadow border'>
            <div className='text-2xl font-bold text-green-600'>
              {batches.filter(b => b.status === 'completed').length}
            </div>
            <div className='text-sm text-gray-600'>Завершено</div>
          </div>
          <div className='bg-white p-4 rounded-lg shadow border'>
            <div className='text-2xl font-bold text-gray-600'>
              {batches.reduce((sum, b) => sum + b.produced, 0)}
            </div>
            <div className='text-sm text-gray-600'>Всего произведено</div>
          </div>
        </div>

        {/* Batches Table */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b bg-gray-50'>
            <h2 className='text-lg font-medium'>Производственные партии</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Название
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Продукт
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Прогресс
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Статус
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {batches.map(batch => (
                  <tr key={batch.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-mono'>
                      {batch.id}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {batch.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {batch.createdAt}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {batch.product}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {batch.produced} / {batch.quantity}
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                        <div
                          className='bg-blue-600 h-2 rounded-full transition-all'
                          style={{
                            width: `${(batch.produced / batch.quantity) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[batch.status]
                        }`}
                      >
                        {statusLabels[batch.status]}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {batch.status === 'quality-check' && (
                        <div className='flex gap-2'>
                          <button
                            onClick={() =>
                              updateBatchStatus(batch.id, 'completed')
                            }
                            className='text-green-600 hover:text-green-900'
                          >
                            Принять
                          </button>
                          <button
                            onClick={() =>
                              updateBatchStatus(batch.id, 'rejected')
                            }
                            className='text-red-600 hover:text-red-900'
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                      {batch.status === 'production' && (
                        <button
                          onClick={() =>
                            updateBatchStatus(batch.id, 'quality-check')
                          }
                          className='text-blue-600 hover:text-blue-900'
                        >
                          На контроль
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewBatch && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium mb-4'>Новая партия</h3>
            <div className='space-y-4'>
              <input
                type='text'
                placeholder='Название партии'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
              <input
                type='text'
                placeholder='Продукт'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
              <input
                type='number'
                placeholder='Количество'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
            <div className='flex gap-3 mt-6'>
              <button
                onClick={() => setShowNewBatch(false)}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
              >
                Отмена
              </button>
              <button
                onClick={() => setShowNewBatch(false)}
                className='flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500'
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
