import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  'https://fpgzozsspaipegxcfzug.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZ3pvenNzcGFpcGVneGNmenVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTYxNDYsImV4cCI6MjA2OTczMjE0Nn0.BNvvF-GjQ4I6Q2O9A4haE4uB_8u6TzmtRytHI-WBIaU'
);

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price?: number;
  description?: string;
  barcode?: string;
  qr_data?: string;
  created_at: string;
}

const ProductsTest: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>(
    'Проверка подключения...'
  );

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    testConnection();
    loadProducts();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

      if (error) {
        setConnectionStatus(`❌ Ошибка подключения: ${error.message}`);
      } else {
        setConnectionStatus(
          `✅ Подключение успешно. Товаров в базе: ${data?.length ?? 0}`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setConnectionStatus(`❌ Критическая ошибка: ${message}`);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data ?? []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Ошибка загрузки: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.category) {
      alert('Заполните обязательные поля: название, артикул, категория');
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        price: newProduct.price ? parseFloat(newProduct.price) : null,
        description: newProduct.description ?? null,
        barcode: generateBarcode(newProduct.sku),
        qr_data: generateQR(newProduct.sku),
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      setNewProduct({
        name: '',
        sku: '',
        category: '',
        price: '',
        description: '',
      });
      alert('Товар создан успешно!');
      setConnectionStatus(`✅ Товар "${data.name}" добавлен в базу данных`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Ошибка создания товара: ${message}`);
      setError(`Ошибка создания: ${message}`);
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Удалить товар "${name}"?`)) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      setConnectionStatus(`✅ Товар "${name}" удален из базы данных`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Ошибка удаления: ${message}`);
    }
  };

  const generateBarcode = (sku: string): string => {
    const hash = sku
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseNumber = (4600000000000 + (hash % 999999999999)).toString();
    return baseNumber.slice(0, 13);
  };

  const generateQR = (sku: string): string => {
    return `${sku}-${new Date().getFullYear()}`;
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Тест подключения к базе данных
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Проверка работы с Supabase PostgreSQL
          </p>
        </div>

        {/* Статус подключения */}
        <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Статус подключения
          </h2>
          <p className='text-sm dark:text-gray-300'>{connectionStatus}</p>
          {error && (
            <div className='mt-2 p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded'>
              {error}
            </div>
          )}
        </div>

        {/* Форма создания товара */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
            Добавить новый товар
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <input
              type='text'
              placeholder='Название товара *'
              value={newProduct.name}
              onChange={e =>
                setNewProduct(prev => ({ ...prev, name: e.target.value }))
              }
              className='border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            />
            <input
              type='text'
              placeholder='Артикул (SKU) *'
              value={newProduct.sku}
              onChange={e =>
                setNewProduct(prev => ({ ...prev, sku: e.target.value }))
              }
              className='border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            />
            <input
              type='text'
              placeholder='Категория *'
              value={newProduct.category}
              onChange={e =>
                setNewProduct(prev => ({ ...prev, category: e.target.value }))
              }
              className='border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            />
            <input
              type='number'
              step='0.01'
              placeholder='Цена (₽)'
              value={newProduct.price}
              onChange={e =>
                setNewProduct(prev => ({ ...prev, price: e.target.value }))
              }
              className='border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
            />
            <textarea
              placeholder='Описание товара'
              value={newProduct.description}
              onChange={e =>
                setNewProduct(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className='border rounded px-3 py-2 col-span-1 md:col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              rows={3}
            />
          </div>
          <div className='flex space-x-3 mt-4'>
            <button
              onClick={createProduct}
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
            >
              Создать товар
            </button>
            <button
              onClick={loadProducts}
              className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors'
            >
              Обновить список
            </button>
          </div>
        </div>

        {/* Список товаров */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
          <div className='p-6 border-b dark:border-gray-700'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              Товары из базы данных ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className='p-8 text-center'>
              <div className='text-gray-600 dark:text-gray-400'>
                Загрузка товаров...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className='p-8 text-center'>
              <div className='text-gray-500 dark:text-gray-400'>
                Товары не найдены. Создайте первый товар выше.
              </div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-gray-700'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Название
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      SKU
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Категория
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Цена
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Штрих-код
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Создан
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase'>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-600'>
                  {products.map(product => (
                    <tr
                      key={product.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='font-medium text-gray-900 dark:text-white'>
                          {product.name}
                        </div>
                        {product.description && (
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300'>
                        {product.sku}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300'>
                        <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                          {product.category}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300'>
                        {product.price ? `${product.price.toFixed(2)} ₽` : '—'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-300'>
                        {product.barcode ?? '—'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                        {new Date(product.created_at).toLocaleDateString(
                          'ru-RU'
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <button
                          onClick={() =>
                            deleteProduct(product.id, product.name)
                          }
                          className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Информация о подключении */}
        <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg'>
          <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>
            Информация о подключении
          </h3>
          <div className='text-sm text-blue-800 dark:text-blue-200 space-y-1'>
            <div>
              • <strong>База данных:</strong> Supabase PostgreSQL
            </div>
            <div>
              • <strong>URL:</strong> fpgzozsspaipegxcfzug.supabase.co
            </div>
            <div>
              • <strong>Таблица:</strong> products
            </div>
            <div>
              • <strong>Автоматическая генерация:</strong> ID, штрих-коды,
              QR-коды, временные метки
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsTest;
