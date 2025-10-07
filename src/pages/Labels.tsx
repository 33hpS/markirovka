import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  category: string;
  tags: string[];
  products: string[];
  dimensions: {
    width: number;
    height: number;
  };
  preview: string;
  isActive: boolean;
  downloads: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

const mockTemplates: LabelTemplate[] = [
  {
    id: '1',
    name: 'Стандартная этикетка продукта',
    description:
      'Базовый шаблон для маркировки продукции с QR-кодом и основной информацией',
    version: '2.1.0',
    createdAt: '2025-09-15',
    updatedAt: '2025-10-01',
    author: 'Система',
    category: 'Продукция',
    tags: ['QR-код', 'Базовый', 'ГОСТ'],
    products: ['Хлеб белый', 'Молоко 3.2%'],
    dimensions: { width: 40, height: 30 },
    preview: '🏷️',
    isActive: true,
    downloads: 156,
  },
  {
    id: '2',
    name: 'Экспортная этикетка',
    description: 'Шаблон для экспортной продукции с многоязычными подписями',
    version: '1.3.2',
    createdAt: '2025-08-20',
    updatedAt: '2025-09-28',
    author: 'А. Петров',
    category: 'Экспорт',
    tags: ['Экспорт', 'Многоязычный', 'EU'],
    products: ['Мёд липовый'],
    dimensions: { width: 50, height: 40 },
    preview: '🌍',
    isActive: true,
    downloads: 89,
  },
  {
    id: '3',
    name: 'Минимальная этикетка',
    description: 'Компактный шаблон только с обязательной информацией',
    version: '1.0.5',
    createdAt: '2025-07-10',
    updatedAt: '2025-09-15',
    author: 'М. Сидорова',
    category: 'Минимум',
    tags: ['Компактный', 'Минимум'],
    products: [],
    dimensions: { width: 25, height: 15 },
    preview: '📄',
    isActive: false,
    downloads: 34,
  },
  {
    id: '4',
    name: 'Премиум этикетка',
    description:
      'Роскошный дизайн для премиальной продукции с золотыми элементами',
    version: '3.0.1',
    createdAt: '2025-09-01',
    updatedAt: '2025-10-03',
    author: 'Дизайн-студия',
    category: 'Премиум',
    tags: ['Премиум', 'Золото', 'Роскошь'],
    products: ['Икра черная', 'Коньяк XO'],
    dimensions: { width: 60, height: 50 },
    preview: '✨',
    isActive: true,
    downloads: 67,
  },
];

const mockProducts: Product[] = [
  { id: '1', name: 'Хлеб белый', sku: 'BREAD-001' },
  { id: '2', name: 'Молоко 3.2%', sku: 'MILK-032' },
  { id: '3', name: 'Мёд липовый', sku: 'HONEY-LIP' },
  { id: '4', name: 'Икра черная', sku: 'CAVIAR-BLK' },
  { id: '5', name: 'Коньяк XO', sku: 'COGNAC-XO' },
  { id: '6', name: 'Сыр российский', sku: 'CHEESE-RUS' },
];

const Labels: React.FC = () => {
  const [templates, setTemplates] = useState<LabelTemplate[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] =
    useState<LabelTemplate | null>(null);
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [showProductBinding, setShowProductBinding] = useState<string | null>(
    null
  );

  const categories = [
    'all',
    ...Array.from(new Set(templates.map(t => t.category))),
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const exportTemplate = (template: LabelTemplate) => {
    const data = JSON.stringify(template, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.replace(/\s+/g, '-').toLowerCase()}-v${template.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cloneTemplate = (template: LabelTemplate) => {
    const newTemplate: LabelTemplate = {
      ...template,
      id: String(Date.now()),
      name: `${template.name} (копия)`,
      version: '1.0.0',
      createdAt: new Date().toISOString().split('T')[0] ?? '',
      updatedAt: new Date().toISOString().split('T')[0] ?? '',
      author: 'Текущий пользователь',
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const navigate = useNavigate();

  const editTemplate = (template: LabelTemplate) => {
    // Сохраняем шаблон в localStorage для передачи в дизайнер
    localStorage.setItem('editingTemplate', JSON.stringify(template));
    // Переходим в дизайнер
    navigate('/designer');
  };

  const handleCreateTemplate = () => {
    // Устанавливаем флаг для создания нового шаблона
    localStorage.setItem('createNewTemplate', 'true');
    // Переходим в дизайнер без шаблона (с пустым холстом)
    localStorage.removeItem('editingTemplate'); // Очищаем любой существующий шаблон
    navigate('/designer');
  };

  const toggleTemplateStatus = (id: string) => {
    setTemplates(
      templates.map(template =>
        template.id === id
          ? { ...template, isActive: !template.isActive }
          : template
      )
    );
  };

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Каталог шаблонов этикеток
        </h1>
        <p className='text-gray-600 mt-2'>
          Управление шаблонами, версионирование и привязка к продуктам
        </p>
      </div>

      {/* Панель поиска и фильтров */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label
              htmlFor='search-input'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Поиск шаблонов
            </label>
            <input
              id='search-input'
              type='text'
              placeholder='Название, описание, теги...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label
              htmlFor='category-select'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Категория
            </label>
            <select
              id='category-select'
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Все категории' : category}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-end'>
            <button
              onClick={handleCreateTemplate}
              className='w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              + Создать шаблон
            </button>
          </div>
        </div>
      </div>

      {/* Сетка шаблонов */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'
          >
            {/* Превью */}
            <div className='h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-4xl'>
              {template.preview}
            </div>

            {/* Информация */}
            <div className='p-4'>
              <div className='flex items-start justify-between mb-2'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 truncate'>
                  {template.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    template.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {template.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>

              <p className='text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2'>
                {template.description}
              </p>

              <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3'>
                <span>v{template.version}</span>
                <span>{template.downloads} загрузок</span>
              </div>

              <div className='flex flex-wrap gap-1 mb-3'>
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className='px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded'
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded'>
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {template.products.length > 0 && (
                <div className='mb-3'>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Привязанные продукты:
                  </div>
                  <div className='text-xs text-gray-700 dark:text-gray-200'>
                    {template.products.slice(0, 2).join(', ')}
                    {template.products.length > 2 &&
                      ` и ещё ${template.products.length - 2}`}
                  </div>
                </div>
              )}

              {/* Действия */}
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className='flex-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                >
                  Открыть
                </button>
                <button
                  onClick={() =>
                    setShowVersions(
                      showVersions === template.id ? null : template.id
                    )
                  }
                  className='px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700'
                  title='Версии'
                >
                  📋
                </button>
                <button
                  onClick={() => cloneTemplate(template)}
                  className='px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50'
                  title='Клонировать'
                >
                  📋
                </button>
                <button
                  onClick={() =>
                    setShowProductBinding(
                      showProductBinding === template.id ? null : template.id
                    )
                  }
                  className='px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50'
                  title='Привязать к продуктам'
                >
                  🔗
                </button>
                <button
                  onClick={() => exportTemplate(template)}
                  className='px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50'
                  title='Экспорт'
                >
                  📤
                </button>
              </div>

              {/* Панель версий */}
              {showVersions === template.id && (
                <div className='mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-500 dark:border-blue-700'>
                  <div className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                    История версий
                  </div>
                  <div className='space-y-1 text-xs'>
                    <div className='flex justify-between'>
                      <span className='font-medium'>
                        v{template.version} (текущая)
                      </span>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {template.updatedAt}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>v2.0.0</span>
                      <span className='text-gray-500 dark:text-gray-400'>
                        2025-09-15
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>v1.0.0</span>
                      <span className='text-gray-500 dark:text-gray-400'>
                        2025-08-01
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Панель привязки к продуктам */}
              {showProductBinding === template.id && (
                <div className='mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-green-500 dark:border-green-700'>
                  <div className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-2'>
                    Привязка к продуктам
                  </div>
                  <div className='space-y-2'>
                    {mockProducts.slice(0, 3).map(product => (
                      <label
                        key={product.id}
                        className='flex items-center text-xs'
                      >
                        <input
                          type='checkbox'
                          defaultChecked={template.products.includes(
                            product.name
                          )}
                          className='mr-2'
                        />
                        <span>
                          {product.name} ({product.sku})
                        </span>
                      </label>
                    ))}
                    <button className='text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'>
                      Показать все продукты →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно просмотра шаблона */}
      {selectedTemplate && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  ✕
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Информация</h3>
                  <div className='space-y-2 text-sm'>
                    <div>
                      <strong>Версия:</strong> {selectedTemplate.version}
                    </div>
                    <div>
                      <strong>Автор:</strong> {selectedTemplate.author}
                    </div>
                    <div>
                      <strong>Категория:</strong> {selectedTemplate.category}
                    </div>
                    <div>
                      <strong>Размеры:</strong>{' '}
                      {selectedTemplate.dimensions.width}×
                      {selectedTemplate.dimensions.height} мм
                    </div>
                    <div>
                      <strong>Создан:</strong> {selectedTemplate.createdAt}
                    </div>
                    <div>
                      <strong>Обновлен:</strong> {selectedTemplate.updatedAt}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold mb-3'>Превью</h3>
                  <div className='h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded flex items-center justify-center text-6xl'>
                    {selectedTemplate.preview}
                  </div>
                </div>
              </div>

              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-3'>Описание</h3>
                <p className='text-gray-700 dark:text-gray-200'>
                  {selectedTemplate.description}
                </p>
              </div>

              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-3'>Теги</h3>
                <div className='flex flex-wrap gap-2'>
                  {selectedTemplate.tags.map(tag => (
                    <span
                      key={tag}
                      className='px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  onClick={() => editTemplate(selectedTemplate)}
                  className='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                >
                  Редактировать
                </button>
                <button
                  onClick={() => cloneTemplate(selectedTemplate)}
                  className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800'
                >
                  Клонировать
                </button>
                <button
                  onClick={() => exportTemplate(selectedTemplate)}
                  className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  Экспорт
                </button>
                <button
                  onClick={() => toggleTemplateStatus(selectedTemplate.id)}
                  className={`px-4 py-2 rounded ${
                    selectedTemplate.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedTemplate.isActive
                    ? 'Деактивировать'
                    : 'Активировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 dark:text-gray-500 text-6xl mb-4'>
            📄
          </div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            Шаблоны не найдены
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Попробуйте изменить параметры поиска или создать новый шаблон
          </p>
        </div>
      )}
    </div>
  );
};

export default Labels;
