import * as React from 'react';

const Users: React.FC = () => {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Пользователи и Роли (WIP)</h1>
      <p className='text-sm text-gray-600 max-w-prose'>
        RBAC: роли admin / manager / worker, аудит действий, управление
        доступом.
      </p>
      <div className='mt-6 space-y-3'>
        <h2 className='text-sm font-semibold tracking-wide text-gray-700 uppercase'>
          Roadmap
        </h2>
        <ul className='list-disc pl-5 text-xs text-gray-600 space-y-1'>
          <li>Список пользователей</li>
          <li>Назначение ролей</li>
          <li>Журнал действий</li>
          <li>Блокировка / восстановление</li>
        </ul>
        <div className='grid grid-cols-3 gap-3 mt-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-10 rounded bg-gray-100 animate-pulse' />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Users;
