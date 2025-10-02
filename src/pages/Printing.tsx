import * as React from 'react';

const Printing: React.FC = () => (
  <div className='p-8'>
    <h1 className='text-2xl font-bold mb-4'>Печать (WIP)</h1>
    <p className='text-sm text-gray-600 max-w-prose'>
      Очередь печати, профили принтеров (ZPL/PDF), статусы устройств.
    </p>
    <div className='mt-6 space-y-3'>
      <h2 className='text-sm font-semibold tracking-wide text-gray-700 uppercase'>
        Roadmap
      </h2>
      <ul className='list-disc pl-5 text-xs text-gray-600 space-y-1'>
        <li>Очередь заданий</li>
        <li>Профили принтеров</li>
        <li>Монитор статусов</li>
        <li>Пакетная печать</li>
      </ul>
      <div className='grid grid-cols-4 gap-2 mt-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='h-8 rounded bg-gray-100 animate-pulse' />
        ))}
      </div>
    </div>
  </div>
);

export default Printing;
