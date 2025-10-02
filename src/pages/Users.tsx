import * as React from 'react';

const Users: React.FC = () => (
  <div className='p-8'>
    <h1 className='text-2xl font-bold mb-4'>Пользователи и Роли (WIP)</h1>
    <p className='text-sm text-gray-600 max-w-prose'>
      RBAC: роли admin / manager / worker, аудит действий, управление доступом.
    </p>
  </div>
);

export default Users;
