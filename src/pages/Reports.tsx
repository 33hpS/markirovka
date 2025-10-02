import * as React from 'react';

const Reports: React.FC = () => {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Отчётность (WIP)</h1>
      <p className='text-sm text-gray-600 max-w-prose'>
        Аналитика: показатели производительности, качество, динамика выпусков.
      </p>
      <div className='mt-6 space-y-3'>
        <h2 className='text-sm font-semibold tracking-wide text-gray-700 uppercase'>
          Roadmap
        </h2>
        <ul className='list-disc pl-5 text-xs text-gray-600 space-y-1'>
          <li>График выпуска</li>
          <li>Брак / качество</li>
          <li>Загрузка мощностей</li>
          <li>Экспорт CSV / PDF</li>
        </ul>
        <div className='mt-4 h-40 rounded bg-gray-100 animate-pulse' />
      </div>
    </div>
  );
};

export default Reports;
