import { useId, useState } from 'react';

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
}

export function CategoryManager({
  categories: initialCategories,
  onSave,
  onClose,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    code: '',
    description: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const addFormId = useId();

  // Автогенерация кода для новой категории
  const generateCategoryCode = (): string => {
    if (categories.length === 0) return '01';

    // Находим максимальный код и увеличиваем на 1
    const maxCode = categories.reduce((max, cat) => {
      const codeNum = parseInt(cat.code, 10);
      return isNaN(codeNum) ? max : Math.max(max, codeNum);
    }, 0);

    const newCode = maxCode + 1;
    return newCode.toString().padStart(2, '0');
  };

  const handleAdd = () => {
    if (!newCategory.name) {
      alert('Заполните название категории');
      return;
    }

    // Автогенерируем код если он не указан
    const code = newCategory.code?.trim() ?? generateCategoryCode();

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      code,
      description: newCategory.description ?? '',
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', code: '', description: '' });
    setShowAddForm(false);
  };

  const handleUpdate = (id: string, updates: Partial<Category>) => {
    setCategories(
      categories.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleSave = () => {
    onSave(categories);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex justify-between items-center'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              Управление категориями
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl'
            >
              ✕
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {/* Кнопка добавления */}
          <div className='mb-4'>
            {!showAddForm ? (
              <button
                onClick={() => {
                  // Автоматически генерируем код при открытии формы
                  const autoCode = generateCategoryCode();
                  setNewCategory({ name: '', code: autoCode, description: '' });
                  setShowAddForm(true);
                }}
                className='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
              >
                + Добавить категорию
              </button>
            ) : (
              <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                <h3 className='font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  Новая категория
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label
                      htmlFor={`${addFormId}-name`}
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                    >
                      Название *
                    </label>
                    <input
                      type='text'
                      id={`${addFormId}-name`}
                      value={newCategory.name}
                      onChange={e =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                      placeholder='Молочные продукты'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${addFormId}-code`}
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                    >
                      Код (авто)
                    </label>
                    <input
                      type='text'
                      id={`${addFormId}-code`}
                      value={newCategory.code}
                      onChange={e =>
                        setNewCategory({ ...newCategory, code: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                      placeholder={`Следующий: ${generateCategoryCode()}`}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`${addFormId}-description`}
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                    >
                      Описание
                    </label>
                    <input
                      type='text'
                      id={`${addFormId}-description`}
                      value={newCategory.description}
                      onChange={e =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                      placeholder='Описание категории'
                    />
                  </div>
                </div>
                <div className='flex gap-2 mt-3'>
                  <button
                    onClick={handleAdd}
                    className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategory({ name: '', code: '', description: '' });
                    }}
                    className='border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Список категорий */}
          <div className='space-y-3'>
            {categories.map(category => (
              <div
                key={category.id}
                className='bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4'
              >
                {editingId === category.id ? (
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                      <label
                        htmlFor={`category-${category.id}-name`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Название
                      </label>
                      <input
                        type='text'
                        id={`category-${category.id}-name`}
                        defaultValue={category.name}
                        onChange={e =>
                          handleUpdate(category.id, { name: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`category-${category.id}-code`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Код
                      </label>
                      <input
                        type='text'
                        id={`category-${category.id}-code`}
                        defaultValue={category.code}
                        onChange={e =>
                          handleUpdate(category.id, { code: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`category-${category.id}-description`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Описание
                      </label>
                      <input
                        type='text'
                        id={`category-${category.id}-description`}
                        defaultValue={category.description}
                        onChange={e =>
                          handleUpdate(category.id, {
                            description: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-md'
                      />
                    </div>
                    <div className='flex items-end gap-2 col-span-full'>
                      <button
                        onClick={() => setEditingId(null)}
                        className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
                      >
                        ✓ Сохранить
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className='border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <span className='bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-sm font-mono'>
                          {category.code}
                        </span>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className='flex gap-2 ml-4'>
                      <button
                        onClick={() => setEditingId(category.id)}
                        className='text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-lg'
                        title='Редактировать'
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-lg'
                        title='Удалить'
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-400 dark:text-gray-500 text-6xl mb-4'>
                📁
              </div>
              <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                Нет категорий
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                Добавьте первую категорию для начала работы
              </p>
            </div>
          )}
        </div>

        <div className='p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className='bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
}
