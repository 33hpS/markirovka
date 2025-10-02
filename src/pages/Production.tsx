import * as React from 'react';

const Production: React.FC = () => {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Производство (WIP)</h1>
      <p className='text-sm text-gray-600 max-w-prose'>
        Управление партиями: создание, статусы, контроль качества, фильтрация.
      </p>
      <div className='mt-6 space-y-3'>
        <h2 className='text-sm font-semibold tracking-wide text-gray-700 uppercase'>
          Roadmap
        </h2>
        <ul className='list-disc pl-5 text-xs text-gray-600 space-y-1'>
          <li>Создание / редактирование партии</li>
          <li>Фильтры и поиск</li>
          <li>История изменений</li>
          <li>Экспорт отчётов</li>
        </ul>
        <div className='grid grid-cols-2 gap-3 mt-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='h-16 rounded-md bg-gray-100 animate-pulse'
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Production;
