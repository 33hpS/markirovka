import * as React from 'react';

const Labels: React.FC = () => (
  <div className='p-8'>
    <h1 className='text-2xl font-bold mb-4'>Этикетки / Шаблоны (WIP)</h1>
    <p className='text-sm text-gray-600 max-w-prose'>
      Каталог шаблонов, версии, клонирование, привязка к продуктам.
    </p>
    <div className='mt-6 space-y-3'>
      <h2 className='text-sm font-semibold tracking-wide text-gray-700 uppercase'>
        Roadmap
      </h2>
      <ul className='list-disc pl-5 text-xs text-gray-600 space-y-1'>
        <li>Версионирование шаблонов</li>
        <li>Каталог / поиск</li>
        <li>Привязка к продуктам</li>
        <li>Экспорт / импорт</li>
      </ul>
      <div className='grid grid-cols-3 gap-3 mt-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='h-14 rounded bg-gray-100 animate-pulse' />
        ))}
      </div>
    </div>
  </div>
);

export default Labels;
