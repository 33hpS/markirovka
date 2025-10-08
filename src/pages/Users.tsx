import * as React from 'react';
import { useState, useEffect } from 'react';

import {
  getSupabaseService,
  type DatabaseUser,
} from '../services/supabaseService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'blocked' | 'pending';
  lastLogin?: string;
  createdAt: string;
  department: string;
  permissions: string[];
  avatar?: string;
}

interface Role {
  id: string;
  name: 'admin' | 'manager' | 'worker';
  displayName: string;
  description: string;
  permissions: string[];
  color: string;
}

const roles: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: [
      'users.manage',
      'system.config',
      'audit.view',
      'production.manage',
      'labels.manage',
      'printing.manage',
      'reports.view',
    ],
    color: 'red',
  },
  {
    id: 'manager',
    name: 'manager',
    displayName: 'Менеджер',
    description: 'Управление производством и отчетами',
    permissions: [
      'production.manage',
      'labels.create',
      'printing.manage',
      'reports.view',
      'users.view',
    ],
    color: 'blue',
  },
  {
    id: 'worker',
    name: 'worker',
    displayName: 'Сотрудник',
    description: 'Базовые операции с этикетками и печатью',
    permissions: ['labels.view', 'printing.basic', 'production.view'],
    color: 'green',
  },
];

const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>(
    'users'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [_usersLoading, setUsersLoading] = useState(true);
  const [_usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [_showNewUser, setShowNewUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const supabase = getSupabaseService();
        const dbUsers = await supabase.getUsers();
        if (!isMounted) return;

        const mapped: User[] = dbUsers.map((u: DatabaseUser) => {
          const user: User = {
            id: u.id,
            email: u.email,
            firstName: u.first_name ?? 'Имя',
            lastName: u.last_name ?? 'Фамилия',
            role: (u.role as User['role']) ?? 'worker',
            status: (u.status as User['status']) ?? 'active',
            createdAt: u.created_at,
            department: u.department ?? 'Не указан',
            permissions: [],
          };
          if (u.last_login) user.lastLogin = u.last_login;
          return user;
        });

        setUsers(mapped);
      } catch (err) {
        if (!isMounted) return;
        setUsersError(
          err instanceof Error ? err.message : 'Ошибка загрузки пользователей'
        );
      } finally {
        if (isMounted) setUsersLoading(false);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'admin' | 'manager' | 'worker'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'blocked' | 'pending'
  >('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: User['role']) => {
    const roleInfo = roles.find(r => r.name === role);
    return roleInfo
      ? `bg-${roleInfo.color}-100 text-${roleInfo.color}-800`
      : 'bg-gray-100 text-gray-800';
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(
      users.map(user => {
        if (user.id === userId) {
          const newStatus = user.status === 'active' ? 'blocked' : 'active';
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
  };

  const changeUserRole = (userId: string, newRole: User['role']) => {
    setUsers(
      users.map(user => {
        if (user.id === userId) {
          const rolePermissions =
            roles.find(r => r.name === newRole)?.permissions ?? [];
          return { ...user, role: newRole, permissions: rolePermissions };
        }
        return user;
      })
    );
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Управление пользователями
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-2'>
          RBAC система управления ролями, аудит действий и контроль доступа
        </p>
      </div>

      {/* Навигационные вкладки */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6'>
        <div className='border-b border-gray-200 dark:border-gray-700'>
          <nav className='flex space-x-8 px-6'>
            {[
              { id: 'users', name: 'Пользователи', icon: '👥' },
              { id: 'roles', name: 'Роли и права', icon: '🛡️' },
              { id: 'audit', name: 'Журнал действий', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as 'users' | 'roles' | 'audit')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Пользователи */}
      {activeTab === 'users' && (
        <div className='space-y-6'>
          {/* Панель поиска и фильтров */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label
                  htmlFor='user-search'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Поиск пользователей
                </label>
                <input
                  id='user-search'
                  type='text'
                  placeholder='Поиск пользователей...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label
                  htmlFor='role-filter'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Роль
                </label>
                <select
                  id='role-filter'
                  value={roleFilter}
                  onChange={e =>
                    setRoleFilter(
                      e.target.value as 'all' | 'admin' | 'manager' | 'worker'
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value='all'>Все роли</option>
                  <option value='admin'>Администратор</option>
                  <option value='manager'>Менеджер</option>
                  <option value='worker'>Сотрудник</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor='status-filter'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Статус
                </label>
                <select
                  id='status-filter'
                  value={statusFilter}
                  onChange={e =>
                    setStatusFilter(
                      e.target.value as 'all' | 'active' | 'blocked' | 'pending'
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value='all'>Все статусы</option>
                  <option value='active'>Активные</option>
                  <option value='blocked'>Заблокированные</option>
                  <option value='pending'>Ожидающие</option>
                </select>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={() => setShowNewUser(true)}
                  className='w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700'
                >
                  + Добавить пользователя
                </button>
              </div>
            </div>
          </div>

          {/* Таблица пользователей */}
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Пользователь
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Роль
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Статус
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Последний вход
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='text-2xl mr-3'>{user.avatar}</div>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {user.firstName} {user.lastName}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {user.email}
                            </div>
                            <div className='text-xs text-gray-400'>
                              {user.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}
                        >
                          {roles.find(r => r.name === user.role)?.displayName}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}
                        >
                          {user.status === 'active' && 'Активен'}
                          {user.status === 'blocked' && 'Заблокирован'}
                          {user.status === 'pending' && 'Ожидает'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : 'Никогда'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        <button
                          onClick={() => setSelectedUser(user)}
                          className='text-indigo-600 hover:text-indigo-900'
                          title='Просмотр'
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }
                          title={
                            user.status === 'active'
                              ? 'Заблокировать'
                              : 'Активировать'
                          }
                        >
                          {user.status === 'active' ? '🚫' : '✅'}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className='text-red-600 hover:text-red-900'
                          title='Удалить'
                        >
                          🗑️
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

      {/* Роли и права */}
      {activeTab === 'roles' && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Роли и разрешения
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {roles.map(role => (
              <div
                key={role.id}
                className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'
              >
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {role.displayName}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm bg-${role.color}-100 text-${role.color}-800`}
                  >
                    {role.name}
                  </span>
                </div>

                <p className='text-gray-600 mb-4'>{role.description}</p>

                <div className='space-y-3'>
                  <div className='text-sm font-medium text-gray-700'>
                    Разрешения:
                  </div>
                  <div className='space-y-1'>
                    {role.permissions.map(permission => (
                      <div
                        key={permission}
                        className='flex items-center text-sm'
                      >
                        <span className='text-green-500 mr-2'>✓</span>
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='text-sm text-gray-500'>
                    Пользователей:{' '}
                    {users.filter(u => u.role === role.name).length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Журнал действий */}
      {activeTab === 'audit' && (
        <div className='space-y-6'>
          <h2 className='text-xl font-semibold text-gray-900'>Журнал аудита</h2>

          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Время
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Пользователь
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Действие
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Результат
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      IP адрес
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  <tr>
                    <td
                      colSpan={5}
                      className='px-6 py-12 text-center text-gray-500'
                    >
                      Аудит действий пользователей будет доступен в следующей
                      версии.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра пользователя */}
      {selectedUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-2xl font-bold text-gray-900'>
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  ✕
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-lg font-semibold mb-3'>
                    Основная информация
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div>
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    <div>
                      <strong>Отдел:</strong> {selectedUser.department}
                    </div>
                    <div>
                      <strong>Роль:</strong>{' '}
                      {
                        roles.find(r => r.name === selectedUser.role)
                          ?.displayName
                      }
                    </div>
                    <div>
                      <strong>Статус:</strong> {selectedUser.status}
                    </div>
                    <div>
                      <strong>Создан:</strong>{' '}
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Последний вход:</strong>{' '}
                      {selectedUser.lastLogin
                        ? new Date(selectedUser.lastLogin).toLocaleString()
                        : 'Никогда'}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Разрешения</h3>
                  <div className='space-y-1'>
                    {selectedUser.permissions.map(permission => (
                      <div
                        key={permission}
                        className='flex items-center text-sm'
                      >
                        <span className='text-green-500 mr-2'>✓</span>
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-3'>Изменение роли</h3>
                <div className='flex gap-2'>
                  {roles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => changeUserRole(selectedUser.id, role.name)}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedUser.role === role.name
                          ? `bg-${role.color}-500 text-white`
                          : `bg-${role.color}-100 text-${role.color}-800 hover:bg-${role.color}-200`
                      }`}
                    >
                      {role.displayName}
                    </button>
                  ))}
                </div>
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  onClick={() => toggleUserStatus(selectedUser.id)}
                  className={`px-4 py-2 rounded ${
                    selectedUser.status === 'active'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedUser.status === 'active'
                    ? 'Заблокировать'
                    : 'Активировать'}
                </button>
                <button className='border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50'>
                  Сбросить пароль
                </button>
                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && activeTab === 'users' && (
        <div className='text-center py-12'>
          <div className='text-gray-400 text-6xl mb-4'>👥</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Пользователи не найдены
          </h3>
          <p className='text-gray-500'>
            Попробуйте изменить параметры поиска или добавить нового
            пользователя
          </p>
        </div>
      )}
    </div>
  );
};

export default Users;
