import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRealtimeSync } from '../hooks/useRealtime';
import * as api from '../services/apiService';
import { generatePreview } from '../utils/templatePreview';

interface DesignElement {
  id: string;
  type: 'text' | 'qr' | 'image' | 'barcode';
  content: string;
  dataBinding?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  version?: string;
  elements: DesignElement[];
  suitableFor: string[];
  thumbnail: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

const Designer: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Молочные продукты',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция перезагрузки шаблонов
  const reloadTemplates = useCallback(async () => {
    try {
      const refreshed = await api.fetchTemplates();
      const converted: LabelTemplate[] = refreshed.map(t => ({
        id: t.id ?? `temp-${Date.now()}`,
        name: t.name,
        category: t.category ?? 'Без категории',
        description: t.description ?? '',
        version: '1.0.0',
        elements: (t.elements as DesignElement[]) ?? [],
        suitableFor: [t.category ?? 'Все'],
        thumbnail: t.thumbnail ?? getCategoryEmoji(t.category ?? ''),
        createdAt: t.created_at?.split('T')[0],
        updatedAt: t.updated_at?.split('T')[0],
      }));
      setTemplates(converted);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка перезагрузки шаблонов:', err);
    }
  }, []);

  // Подключение realtime для автоматической синхронизации
  const realtime = useRealtimeSync({
    templates: true,
    onTemplateChange: reloadTemplates,
  });

  // Загружаем шаблоны из API при монтировании
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await api.fetchTemplates();

        // Преобразуем формат API в формат компонента
        const converted: LabelTemplate[] = loaded.map(t => ({
          id: t.id ?? `temp-${Date.now()}`,
          name: t.name,
          category: t.category ?? 'Без категории',
          description: t.description ?? '',
          version: '1.0.0',
          elements: (t.elements as DesignElement[]) ?? [],
          suitableFor: [t.category ?? 'Все'],
          thumbnail: t.thumbnail ?? getCategoryEmoji(t.category ?? ''),
          createdAt: t.created_at?.split('T')[0],
          updatedAt: t.updated_at?.split('T')[0],
        }));

        setTemplates(converted);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Ошибка загрузки шаблонов';
        setError(errorMsg);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [reloadTemplates]);

  const getCategoryEmoji = (category: string): string => {
    if (category.includes('Молочн')) return '🥛';
    if (category.includes('Хлеб')) return '🍞';
    if (category.includes('Мясн')) return '🥩';
    return '📦';
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateNew = () => {
    setNewTemplate({
      name: '',
      category: categories[0] ?? 'Молочные продукты',
      description: '',
    });
    setShowCreateModal(true);
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplate.name.trim()) {
      alert('Введите название шаблона');
      return;
    }

    setLoading(true);

    try {
      // Создаем базовые элементы для нового шаблона
      const baseElements: DesignElement[] = [
        {
          id: '1',
          type: 'text',
          content: 'Название продукта',
          dataBinding: 'name',
          x: 10,
          y: 10,
          width: 200,
          height: 25,
          fontSize: 16,
          color: '#000000',
        },
        {
          id: '2',
          type: 'qr',
          content: 'QR',
          dataBinding: 'qrData',
          x: 220,
          y: 10,
          width: 80,
          height: 80,
        },
      ];

      // Создаем временный шаблон для генерации превью
      const tempTemplate = {
        id: 'temp',
        name: newTemplate.name,
        category: newTemplate.category,
        description: newTemplate.description,
        elements: baseElements,
        version: '1.0.0',
        suitableFor: [newTemplate.category],
        thumbnail: getCategoryEmoji(newTemplate.category),
      };

      // Генерируем превью
      let thumbnailUrl = getCategoryEmoji(newTemplate.category);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thumbnailUrl = await generatePreview(tempTemplate as any);
      } catch {
        // Используем emoji если не удалось сгенерировать
      }

      // Сохраняем в API
      await api.createTemplate({
        name: newTemplate.name,
        category: newTemplate.category,
        description: newTemplate.description,
        width: 400,
        height: 300,
        elements: baseElements,
        thumbnail: thumbnailUrl,
      });

      // Перезагружаем список
      await reloadTemplates();

      setShowCreateModal(false);
      alert(
        'Шаблон успешно создан! Используйте кнопку "Использовать" для редактирования элементов.'
      );
    } catch (err) {
      alert(
        `Ошибка создания: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAllPreviews = async () => {
    if (
      !window.confirm(
        'Регенерировать превью для всех шаблонов? Это может занять некоторое время.'
      )
    ) {
      return;
    }

    setLoading(true);
    let updated = 0;

    try {
      for (const template of templates) {
        try {
          // Генерируем preview
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const thumbnailUrl = await generatePreview(template as any);

          // Обновляем в базе данных
          if (template.id) {
            await api.updateTemplate(template.id, {
              thumbnail: thumbnailUrl,
            });
            updated++;
          }
        } catch (err) {
          // Пропускаем шаблоны с ошибками
          void err;
        }
      }

      alert(`Успешно обновлено превью для ${updated} шаблонов`);
      await reloadTemplates();
    } catch (err) {
      alert(
        `Ошибка регенерации: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (
      !template?.id.startsWith('custom-') &&
      template?.id.startsWith('dairy-') === false &&
      template?.id.startsWith('bakery-') === false
    ) {
      // Удаляем шаблоны из базы данных
      try {
        await api.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        alert(
          `Ошибка удаления: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
        );
      }
    } else {
      alert('Нельзя удалить базовый шаблон.');
    }
    setShowDeleteConfirm(null);
  };

  const handleUseTemplate = (template: LabelTemplate) => {
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    navigate('/labels');
  };

  const handleEditTemplate = (template: LabelTemplate) => {
    setEditingTemplate(template);
  };

  const handleSaveEdit = async (updatedTemplate: LabelTemplate) => {
    try {
      // Генерируем preview изображение
      let thumbnailUrl = updatedTemplate.thumbnail;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thumbnailUrl = await generatePreview(updatedTemplate as any);
      } catch {
        // Если не удалось сгенерировать превью, используем emoji
        thumbnailUrl = getCategoryEmoji(updatedTemplate.category);
      }

      await api.updateTemplate(updatedTemplate.id, {
        name: updatedTemplate.name,
        category: updatedTemplate.category,
        description: updatedTemplate.description,
        width: 400,
        height: 300,
        elements: updatedTemplate.elements,
        thumbnail: thumbnailUrl,
      });

      // Перезагружаем список шаблонов
      await reloadTemplates();
      setEditingTemplate(null);
    } catch (err) {
      alert(
        `Ошибка сохранения: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleDuplicateTemplate = async (template: LabelTemplate) => {
    const duplicated: LabelTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (копия)`,
      version: '1.0.0',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: undefined,
    };

    // Генерируем preview изображение для дубликата
    let thumbnailUrl = template.thumbnail;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thumbnailUrl = await generatePreview(duplicated as any);
    } catch {
      // Если не удалось сгенерировать превью, используем emoji
      thumbnailUrl = getCategoryEmoji(duplicated.category);
    }

    // Сохраняем в API
    try {
      await api.createTemplate({
        name: duplicated.name,
        category: duplicated.category,
        description: duplicated.description,
        width: 400,
        height: 300,
        elements: duplicated.elements,
        thumbnail: thumbnailUrl,
      });

      // Перезагружаем список шаблонов
      await reloadTemplates();
    } catch (err) {
      alert(
        `Ошибка дублирования: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
      );
    }
  };

  return (
    <div className='w-full min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='w-full px-4 sm:px-6 lg:px-8 py-6'>
        <div className='mb-6 flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              Шаблоны этикеток
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>
              Управление готовыми шаблонами для создания этикеток
            </p>
          </div>

          {/* Realtime индикатор */}
          {realtime.isConnected && (
            <div className='flex items-center gap-2 text-sm'>
              <div className='flex items-center gap-1.5'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-gray-600 dark:text-gray-400'>
                  Синхронизация
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Индикатор загрузки */}
        {loading && (
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3'></div>
              <span className='text-blue-800 dark:text-blue-300'>
                Загрузка шаблонов...
              </span>
            </div>
          </div>
        )}

        {/* Ошибка загрузки */}
        {error && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-yellow-600 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <div>
                <span className='text-yellow-800 dark:text-yellow-300 font-semibold'>
                  Ошибка загрузки:{' '}
                </span>
                <span className='text-yellow-700 dark:text-yellow-400'>
                  {error} (используются локальные шаблоны)
                </span>
              </div>
            </div>
          </div>
        )}

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <input
                type='text'
                placeholder='Поиск шаблонов...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className='w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value='all'>Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={handleCreateNew}
                className='w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2'
              >
                <span>✨</span>
                <span>Создать новый</span>
              </button>
            </div>
            <div>
              <button
                onClick={handleRegenerateAllPreviews}
                disabled={loading}
                className='w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2'
                title='Регенерировать превью для всех шаблонов'
              >
                <span>🖼️</span>
                <span>Обновить превью</span>
              </button>
            </div>
          </div>
        </div>

        <div className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
          Найдено шаблонов: {filteredTemplates.length}
        </div>

        {filteredTemplates.length === 0 ? (
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center'>
            <div className='text-6xl mb-4'>📋</div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              Шаблоны не найдены
            </h3>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className='bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700'
              >
                <div className='bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-t-lg flex items-center justify-center min-h-[160px] relative overflow-hidden'>
                  {template.thumbnail?.startsWith('data:') ||
                  template.thumbnail?.startsWith('http') ||
                  template.thumbnail?.startsWith('/api/') ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className='w-full h-full object-contain'
                      loading='eager'
                      decoding='async'
                    />
                  ) : (
                    <div className='text-6xl'>{template.thumbnail}</div>
                  )}
                </div>
                <div className='p-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                      {template.name}
                    </h3>
                    {template.version && (
                      <span className='text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded'>
                        v{template.version}
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    {template.description}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-gray-500 mb-3'>
                    <span className='bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'>
                      {template.category}
                    </span>
                    <span>•</span>
                    <span>{template.elements.length} элементов</span>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className='flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-sm'
                    >
                      Использовать
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className='bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm'
                      title='Редактировать'
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className='bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 text-sm'
                      title='Дублировать'
                    >
                      📋
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(template.id)}
                      className='bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-md hover:bg-red-200 text-sm'
                      title='Удалить'
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                Удалить шаблон?
              </h3>
              <p className='text-gray-600 dark:text-gray-400 mb-6'>
                Вы уверены, что хотите удалить этот шаблон?
              </p>
              <div className='flex gap-3'>
                <button
                  onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                  className='flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700'
                >
                  Удалить
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className='flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50'
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                Создать новый шаблон
              </h3>
              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='new-template-name'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Название *
                  </label>
                  <input
                    id='new-template-name'
                    type='text'
                    value={newTemplate.name}
                    onChange={e =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <div>
                  <label
                    htmlFor='new-template-category'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Категория
                  </label>
                  <select
                    id='new-template-category'
                    value={newTemplate.category}
                    onChange={e =>
                      setNewTemplate({
                        ...newTemplate,
                        category: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor='new-template-description'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Описание
                  </label>
                  <textarea
                    id='new-template-description'
                    value={newTemplate.description}
                    onChange={e =>
                      setNewTemplate({
                        ...newTemplate,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                  <p className='text-sm text-blue-800 dark:text-blue-300'>
                    <span className='font-semibold'>ℹ️ Базовая структура:</span>
                  </p>
                  <ul className='text-sm text-blue-700 dark:text-blue-400 mt-2 ml-4 list-disc'>
                    <li>Текстовое поле для названия продукта</li>
                    <li>QR-код для маркировки</li>
                  </ul>
                  <p className='text-xs text-blue-600 dark:text-blue-400 mt-2'>
                    После создания используйте кнопку &quot;Использовать&quot;
                    для добавления дополнительных элементов
                  </p>
                </div>
              </div>
              <div className='flex gap-3 mt-6'>
                <button
                  onClick={handleSaveNewTemplate}
                  disabled={loading}
                  className='flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                  className='flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed'
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTemplate && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4'>
                Редактировать шаблон
              </h3>
              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='template-name'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Название
                  </label>
                  <input
                    id='template-name'
                    type='text'
                    value={editingTemplate.name}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <div>
                  <label
                    htmlFor='template-category'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Категория
                  </label>
                  <select
                    id='template-category'
                    value={editingTemplate.category}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        category: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor='template-description'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                  >
                    Описание
                  </label>
                  <textarea
                    id='template-description'
                    value={editingTemplate.description || ''}
                    onChange={e =>
                      setEditingTemplate({
                        ...editingTemplate,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Элементов: {editingTemplate.elements.length}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                    Для редактирования элементов используйте
                    &quot;Использовать&quot; → редактор этикеток
                  </p>
                </div>
              </div>
              <div className='flex gap-3 mt-6'>
                <button
                  onClick={() => handleSaveEdit(editingTemplate)}
                  className='flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700'
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className='flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Designer;
