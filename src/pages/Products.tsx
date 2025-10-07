import * as React from 'react';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  description: string;
  manufacturer: string;
  weight: string;
  expiryDate?: string;
  batchNumber?: string;
  barcode: string; // Автоматически генерируемый штрих-код
  qrData: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  stock: number;
  minStock: number;
}

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Молочные продукты',
    code: '01',
    description: 'Молоко, творог, сыры, йогурты',
  },
  {
    id: '2',
    name: 'Мясные изделия',
    code: '02',
    description: 'Колбасы, сосиски, мясные полуфабрикаты',
  },
  {
    id: '3',
    name: 'Хлебобулочные изделия',
    code: '03',
    description: 'Хлеб, булочки, торты, печенье',
  },
  {
    id: '4',
    name: 'Напитки',
    code: '04',
    description: 'Соки, газированные напитки, вода',
  },
  {
    id: '5',
    name: 'Консервы',
    code: '05',
    description: 'Мясные, рыбные, овощные консервы',
  },
  {
    id: '6',
    name: 'Замороженные продукты',
    code: '06',
    description: 'Овощи, ягоды, полуфабрикаты',
  },
];

// Функция генерации штрих-кода EAN-13
const generateBarcode = (
  categoryCode: string,
  productNumber: number
): string => {
  // Формат: 460 (код страны) + categoryCode + 6-значный номер товара + контрольная цифра
  const countryCode = '460'; // Код России
  const productCode = categoryCode.padStart(2, '0');
  const productNum = productNumber.toString().padStart(6, '0');

  const baseCode = countryCode + productCode + productNum;

  // Вычисление контрольной цифры для EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(baseCode[i] ?? '0', 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return baseCode + checkDigit.toString();
};

// Функция генерации QR-кода данных
const generateQRData = (product: Partial<Product>): string => {
  const baseUrl = 'https://markirovka.sherhan1988hp.workers.dev/product';
  return `${baseUrl}/${product.sku}?name=${encodeURIComponent(product.name ?? '')}&category=${encodeURIComponent(product.category ?? '')}`;
};

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Молоко цельное 3.2%',
    sku: 'MILK-032-1L',
    price: 89.9,
    category: 'Молочные продукты',
    description: 'Натуральное цельное молоко жирностью 3.2%',
    manufacturer: 'ООО "Молочная ферма"',
    weight: '1 л',
    barcode: '4600134912345',
    qrData: 'https://markirovka.sherhan1988hp.workers.dev/product/MILK-032-1L',
    status: 'active',
    createdAt: '2025-10-01T08:00:00',
    updatedAt: '2025-10-04T12:30:00',
    stock: 150,
    minStock: 20,
  },
  {
    id: '2',
    name: 'Хлеб пшеничный нарезной',
    sku: 'BREAD-WHT-500G',
    price: 45.5,
    category: 'Хлебобулочные изделия',
    description: 'Свежий пшеничный хлеб, нарезанный ломтиками',
    manufacturer: 'Хлебозавод №1',
    weight: '500 г',
    barcode: '4600334567890',
    qrData:
      'https://markirovka.sherhan1988hp.workers.dev/product/BREAD-WHT-500G',
    status: 'active',
    createdAt: '2025-10-02T06:00:00',
    updatedAt: '2025-10-04T14:15:00',
    stock: 85,
    minStock: 15,
  },
  {
    id: '3',
    name: 'Колбаса вареная "Докторская"',
    sku: 'SAUSAGE-DOC-300G',
    price: 285.0,
    category: 'Мясные изделия',
    description: 'Классическая вареная колбаса по ГОСТу',
    manufacturer: 'Мясоком бинат "Традиция"',
    weight: '300 г',
    barcode: '4600234789012',
    qrData:
      'https://markirovka.sherhan1988hp.workers.dev/product/SAUSAGE-DOC-300G',
    status: 'active',
    createdAt: '2025-10-01T10:00:00',
    updatedAt: '2025-10-03T16:45:00',
    stock: 45,
    minStock: 10,
  },
];

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'discontinued'
  >('all');

  // Форма нового товара
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    price: 0,
    category: '',
    description: '',
    manufacturer: '',
    weight: '',
    status: 'active',
    stock: 0,
    minStock: 10,
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'discontinued':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock <= 0)
      return { text: 'Нет в наличии', color: 'text-red-600 dark:text-red-400' };
    if (product.stock <= product.minStock)
      return { text: 'Мало', color: 'text-orange-600 dark:text-orange-400' };
    return { text: 'В наличии', color: 'text-green-600 dark:text-green-400' };
  };

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.category) {
      alert('Заполните обязательные поля: название, артикул, категория');
      return;
    }

    const category = categories.find(cat => cat.name === newProduct.category);
    const productNumber = products.length + 1;

    const barcode = generateBarcode(category?.code ?? '99', productNumber);
    const qrData = generateQRData(newProduct);

    const product: Product = {
      id: Date.now().toString(),
      ...(newProduct as Required<
        Omit<Product, 'id' | 'barcode' | 'qrData' | 'createdAt' | 'updatedAt'>
      >),
      barcode,
      qrData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts([...products, product]);
    setNewProduct({
      name: '',
      sku: '',
      price: 0,
      category: '',
      description: '',
      manufacturer: '',
      weight: '',
      status: 'active',
      stock: 0,
      minStock: 10,
    });
    setShowNewProduct(false);
  };

  const updateProductStatus = (
    productId: string,
    status: Product['status']
  ) => {
    setProducts(
      products.map(product =>
        product.id === productId
          ? { ...product, status, updatedAt: new Date().toISOString() }
          : product
      )
    );
  };

  const deleteProduct = (productId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      setProducts(products.filter(product => product.id !== productId));
    }
  };

  const regenerateBarcode = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const category = categories.find(cat => cat.name === product.category);
    const productNumber = parseInt(product.id) || products.length;
    const newBarcode = generateBarcode(category?.code ?? '99', productNumber);

    setProducts(
      products.map(p =>
        p.id === productId
          ? { ...p, barcode: newBarcode, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Управление товарами
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-2'>
          Каталог товаров с автоматической генерацией штрих-кодов и QR-кодов
        </p>
      </div>

      {/* Панель поиска и фильтров */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label
              htmlFor='product-search'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Поиск товаров
            </label>
            <input
              id='product-search'
              type='text'
              placeholder='Название, артикул, производитель...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label
              htmlFor='category-filter'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Категория
            </label>
            <select
              id='category-filter'
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='all'>Все категории</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
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
                  e.target.value as
                    | 'all'
                    | 'active'
                    | 'inactive'
                    | 'discontinued'
                )
              }
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='all'>Все статусы</option>
              <option value='active'>Активные</option>
              <option value='inactive'>Неактивные</option>
              <option value='discontinued'>Снятые с производства</option>
            </select>
          </div>
          <div className='flex items-end'>
            <button
              onClick={() => setShowNewProduct(true)}
              className='w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
            >
              + Добавить товар
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Всего товаров
          </div>
          <div className='text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2'>
            {products.length}
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Активных
          </div>
          <div className='text-3xl font-bold text-green-600 dark:text-green-400 mt-2'>
            {products.filter(p => p.status === 'active').length}
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Мало на складе
          </div>
          <div className='text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2'>
            {products.filter(p => p.stock <= p.minStock && p.stock > 0).length}
          </div>
        </div>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Нет в наличии
          </div>
          <div className='text-3xl font-bold text-red-600 dark:text-red-400 mt-2'>
            {products.filter(p => p.stock <= 0).length}
          </div>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-900'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Товар
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Штрих-код
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Цена
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Остаток
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Статус
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {filteredProducts.map(product => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr
                    key={product.id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div>
                          <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {product.name}
                          </div>
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {product.sku} • {product.category}
                          </div>
                          <div className='text-xs text-gray-400 dark:text-gray-500'>
                            {product.manufacturer} • {product.weight}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-mono text-gray-900 dark:text-gray-100'>
                        {product.barcode}
                      </div>
                      <button
                        onClick={() => regenerateBarcode(product.id)}
                        className='text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
                      >
                        🔄 Перегенерировать
                      </button>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>
                      ₽{product.price.toFixed(2)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900 dark:text-gray-100'>
                        {product.stock} шт.
                      </div>
                      <div className={`text-xs ${stockStatus.color}`}>
                        {stockStatus.text}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}
                      >
                        {product.status === 'active' && 'Активен'}
                        {product.status === 'inactive' && 'Неактивен'}
                        {product.status === 'discontinued' && 'Снят'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className='text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300'
                        title='Просмотр'
                      >
                        👁️
                      </button>
                      <button
                        onClick={() =>
                          updateProductStatus(
                            product.id,
                            product.status === 'active' ? 'inactive' : 'active'
                          )
                        }
                        className={
                          product.status === 'active'
                            ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300'
                            : 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                        }
                        title={
                          product.status === 'active'
                            ? 'Деактивировать'
                            : 'Активировать'
                        }
                      >
                        {product.status === 'active' ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className='text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300'
                        title='Удалить'
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 dark:text-gray-500 text-6xl mb-4'>
            📦
          </div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            Товары не найдены
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Попробуйте изменить параметры поиска или добавить новый товар
          </p>
        </div>
      )}

      {/* Модальное окно добавления товара */}
      {showNewProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  Добавить новый товар
                </h2>
                <button
                  onClick={() => setShowNewProduct(false)}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  ✕
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    htmlFor='new-name'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Название товара *
                  </label>
                  <input
                    id='new-name'
                    type='text'
                    value={newProduct.name}
                    onChange={e =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='Молоко цельное 3.2%'
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-sku'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Артикул (SKU) *
                  </label>
                  <input
                    id='new-sku'
                    type='text'
                    value={newProduct.sku}
                    onChange={e =>
                      setNewProduct({ ...newProduct, sku: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='MILK-032-1L'
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-category'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Категория *
                  </label>
                  <select
                    id='new-category'
                    value={newProduct.category}
                    onChange={e =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    <option value=''>Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor='new-price'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Цена (₽)
                  </label>
                  <input
                    id='new-price'
                    type='number'
                    step='0.01'
                    value={newProduct.price}
                    onChange={e =>
                      setNewProduct({
                        ...newProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-manufacturer'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Производитель
                  </label>
                  <input
                    id='new-manufacturer'
                    type='text'
                    value={newProduct.manufacturer}
                    onChange={e =>
                      setNewProduct({
                        ...newProduct,
                        manufacturer: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder="ООО 'Молочная ферма'"
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-weight'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Вес/Объем
                  </label>
                  <input
                    id='new-weight'
                    type='text'
                    value={newProduct.weight}
                    onChange={e =>
                      setNewProduct({ ...newProduct, weight: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='1 л'
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-stock'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Остаток на складе
                  </label>
                  <input
                    id='new-stock'
                    type='number'
                    value={newProduct.stock}
                    onChange={e =>
                      setNewProduct({
                        ...newProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-minStock'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Минимальный остаток
                  </label>
                  <input
                    id='new-minStock'
                    type='number'
                    value={newProduct.minStock}
                    onChange={e =>
                      setNewProduct({
                        ...newProduct,
                        minStock: parseInt(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>
              </div>

              <div className='mt-4'>
                <label
                  htmlFor='new-description'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Описание
                </label>
                <textarea
                  id='new-description'
                  value={newProduct.description}
                  onChange={e =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='Описание товара...'
                />
              </div>

              <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
                <h3 className='text-sm font-medium text-blue-900 dark:text-blue-300 mb-2'>
                  Автоматическая генерация
                </h3>
                <p className='text-xs text-blue-800 dark:text-blue-200'>
                  Штрих-код и QR-код будут сгенерированы автоматически на основе
                  категории и данных товара. Формат штрих-кода: EAN-13
                  (460XXYYYYYY#), где XX - код категории, YYYYYY - номер товара.
                </p>
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  onClick={handleCreateProduct}
                  className='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                >
                  Создать товар
                </button>
                <button
                  onClick={() => setShowNewProduct(false)}
                  className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра товара */}
      {selectedProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  ✕
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    Основная информация
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div>
                      <strong>Артикул:</strong> {selectedProduct.sku}
                    </div>
                    <div>
                      <strong>Категория:</strong> {selectedProduct.category}
                    </div>
                    <div>
                      <strong>Цена:</strong> ₽{selectedProduct.price.toFixed(2)}
                    </div>
                    <div>
                      <strong>Производитель:</strong>{' '}
                      {selectedProduct.manufacturer}
                    </div>
                    <div>
                      <strong>Вес/Объем:</strong> {selectedProduct.weight}
                    </div>
                    <div>
                      <strong>Остаток:</strong> {selectedProduct.stock} шт.
                    </div>
                    <div>
                      <strong>Мин. остаток:</strong> {selectedProduct.minStock}{' '}
                      шт.
                    </div>
                    <div>
                      <strong>Создан:</strong>{' '}
                      {new Date(selectedProduct.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Обновлен:</strong>{' '}
                      {new Date(selectedProduct.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    Коды и идентификаторы
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Штрих-код (EAN-13):
                      </div>
                      <div className='font-mono text-lg bg-gray-100 dark:bg-gray-700 p-2 rounded'>
                        {selectedProduct.barcode}
                      </div>
                      <button
                        onClick={() => regenerateBarcode(selectedProduct.id)}
                        className='text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-1'
                      >
                        🔄 Перегенерировать штрих-код
                      </button>
                    </div>

                    <div>
                      <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        QR-код данные:
                      </div>
                      <div className='text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all'>
                        {selectedProduct.qrData}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div className='mt-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                    Описание
                  </h3>
                  <p className='text-gray-700 dark:text-gray-200'>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              <div className='mt-6 flex gap-3'>
                <button
                  onClick={() =>
                    updateProductStatus(
                      selectedProduct.id,
                      selectedProduct.status === 'active'
                        ? 'inactive'
                        : 'active'
                    )
                  }
                  className={`px-4 py-2 rounded ${
                    selectedProduct.status === 'active'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedProduct.status === 'active'
                    ? 'Деактивировать'
                    : 'Активировать'}
                </button>
                <button className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700'>
                  Редактировать
                </button>
                <button
                  onClick={() => deleteProduct(selectedProduct.id)}
                  className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
