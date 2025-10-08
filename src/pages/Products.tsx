import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  CategoryManager,
  type Category as CategoryType,
} from '../components/product/CategoryManager';
import { useRealtimeSync } from '../hooks/useRealtime';
import * as api from '../services/apiService';
import type {
  Product as ApiProduct,
  ProductPayload,
} from '../services/apiService';

type Product = Omit<
  ApiProduct,
  | 'category'
  | 'manufacturer'
  | 'weight'
  | 'price'
  | 'stock'
  | 'minStock'
  | 'status'
> & {
  category: string;
  manufacturer: string;
  weight: string;
  price: number;
  stock: number;
  minStock: number;
  status: ApiProduct['status'];
};

type NewProductState = {
  name: string;
  sku: string;
  category: string;
  categoryId: string | null;
  categoryCode: string | null;
  price: number;
  description: string;
  manufacturer: string;
  weight: string;
  status: Product['status'];
  stock: number;
  minStock: number;
  expiryDate?: string;
  batchNumber?: string;
  imageUrl?: string;
};

const initialNewProductState: NewProductState = {
  name: '',
  sku: '',
  category: '',
  categoryId: null,
  categoryCode: null,
  price: 0,
  description: '',
  manufacturer: '',
  weight: '',
  status: 'active',
  stock: 0,
  minStock: 10,
};

// Category типы импортируются из CategoryManager
type Category = CategoryType;

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

// Функция генерации SKU на основе названия товара и категории
const generateSKU = (productName: string, categoryCode: string): string => {
  // Извлекаем ключевые слова из названия (первые 2-3 слова, до 8 символов)
  const words = productName
    .toUpperCase()
    .replace(/[^А-ЯA-Z0-9\s]/g, '') // Удаляем спецсимволы
    .split(/\s+/)
    .filter(w => w.length > 2) // Только слова длиннее 2 букв
    .slice(0, 2); // Берём первые 2 слова

  // Транслитерация русских букв
  const translitMap: Record<string, string> = {
    А: 'A',
    Б: 'B',
    В: 'V',
    Г: 'G',
    Д: 'D',
    Е: 'E',
    Ё: 'E',
    Ж: 'ZH',
    З: 'Z',
    И: 'I',
    Й: 'Y',
    К: 'K',
    Л: 'L',
    М: 'M',
    Н: 'N',
    О: 'O',
    П: 'P',
    Р: 'R',
    С: 'S',
    Т: 'T',
    У: 'U',
    Ф: 'F',
    Х: 'H',
    Ц: 'TS',
    Ч: 'CH',
    Ш: 'SH',
    Щ: 'SCH',
    Ы: 'Y',
    Э: 'E',
    Ю: 'YU',
    Я: 'YA',
  };

  const translit = (text: string): string => {
    return text
      .split('')
      .map(char => translitMap[char] ?? char)
      .join('');
  };

  // Формируем префикс из слов (максимум 8 символов)
  const prefix = words
    .map(w => translit(w))
    .join('')
    .slice(0, 8);

  // Добавляем код категории, timestamp и случайное число
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${categoryCode}-${prefix || 'PROD'}-${timestamp}${random}`;
};

// Функция генерации QR-кода данных
const generateQRData = (product: Partial<Product>): string => {
  const baseUrl = 'https://markirovka.sherhan1988hp.workers.dev/product';
  return `${baseUrl}/${product.sku}?name=${encodeURIComponent(product.name ?? '')}&category=${encodeURIComponent(product.category ?? '')}`;
};

const normalizeProductRecord = (
  product: ApiProduct,
  categoryMap?: Map<string, Category>
): Product => {
  const categoryEntry =
    product.categoryId && categoryMap
      ? categoryMap.get(product.categoryId)
      : undefined;
  const categoryName = product.category ?? categoryEntry?.name ?? '';
  const categoryCode = product.categoryCode ?? categoryEntry?.code ?? null;

  return {
    ...product,
    category: categoryName,
    categoryCode,
    manufacturer: product.manufacturer ?? '',
    weight: product.weight ?? '',
    price: product.price ?? 0,
    stock: product.stock ?? 0,
    minStock: product.minStock ?? 0,
    status: product.status ?? 'active',
  } as Product;
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'discontinued'
  >('all');
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesMap = useMemo(() => {
    return new Map(categoriesList.map(category => [category.id, category]));
  }, [categoriesList]);

  const buildPayloadFromProduct = useCallback(
    (
      product: Product,
      overrides: Partial<Product> = {}
    ): ProductPayload & {
      name: string;
      sku: string;
      categoryId?: string | null;
    } => {
      const merged = { ...product, ...overrides };

      return {
        name: merged.name,
        sku: merged.sku,
        categoryId: merged.categoryId ?? null,
        categoryName: merged.category,
        categoryCode: merged.categoryCode ?? null,
        price: merged.price,
        description: merged.description,
        manufacturer: merged.manufacturer,
        weight: merged.weight,
        status: merged.status,
        stock: merged.stock,
        minStock: merged.minStock,
        barcode: merged.barcode,
        qrData: merged.qrData,
        unit: merged.unit ?? merged.weight ?? null,
        imageUrl: merged.imageUrl ?? null,
        expiryDate: merged.expiryDate ?? null,
        batchNumber: merged.batchNumber ?? null,
      };
    },
    []
  );

  const formatTimestamp = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : '—';

  // Функция перезагрузки категорий
  const reloadCategories = useCallback(async () => {
    try {
      const loadedCategories = await api.fetchCategories();
      setCategoriesList(loadedCategories);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Ошибка перезагрузки категорий:', err);
    }
  }, []);

  // Подключение realtime для автоматической синхронизации
  const realtime = useRealtimeSync({
    categories: true,
    onCategoryChange: reloadCategories,
  });

  // Загрузка данных из API при монтировании
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);

      try {
        await api.migrateLocalStorageData();

        const loadedCategories = await api.fetchCategories();
        if (!isMounted) return;
        setCategoriesList(loadedCategories);

        const categoryMap = new Map(
          loadedCategories.map(category => [category.id, category])
        );

        const loadedProducts = await api.fetchProducts();
        if (!isMounted) return;
        const normalizedProducts = loadedProducts.map(product =>
          normalizeProductRecord(product, categoryMap)
        );
        setProducts(normalizedProducts);
      } catch (err) {
        if (!isMounted) return;
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка загрузки данных';
        setError(errorMessage);

        const saved = localStorage.getItem('productCategories');
        if (saved) {
          try {
            setCategoriesList(JSON.parse(saved));
          } catch {
            setCategoriesList(categories);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Форма нового товара
  const [newProduct, setNewProduct] = useState<NewProductState>(
    initialNewProductState
  );

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

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.category) {
      alert('Заполните обязательные поля: название, артикул, категория');
      return;
    }

    const categoryEntry = newProduct.categoryId
      ? categoriesMap.get(newProduct.categoryId)
      : categoriesList.find(cat => cat.name === newProduct.category);

    if (!categoryEntry) {
      alert('Выберите категорию из списка');
      return;
    }

    const productNumber = products.length + 1;
    const categoryCode = categoryEntry.code ?? newProduct.categoryCode ?? '99';
    const barcode = generateBarcode(categoryCode, productNumber);
    const qrData = generateQRData({
      ...newProduct,
      category: newProduct.category,
      sku: newProduct.sku,
    });

    const payload: ProductPayload & {
      name: string;
      sku: string;
      categoryId?: string | null;
    } = {
      name: newProduct.name,
      sku: newProduct.sku,
      categoryId: categoryEntry.id,
      categoryName: newProduct.category,
      categoryCode,
      price: newProduct.price,
      description: newProduct.description,
      manufacturer: newProduct.manufacturer,
      weight: newProduct.weight,
      status: newProduct.status,
      stock: newProduct.stock,
      minStock: newProduct.minStock,
      barcode,
      qrData,
      unit: newProduct.weight,
      imageUrl: newProduct.imageUrl ?? null,
      expiryDate: newProduct.expiryDate ?? null,
      batchNumber: newProduct.batchNumber ?? null,
    };

    try {
      const created = await api.createProduct(payload);
      const normalized = normalizeProductRecord(created, categoriesMap);
      setProducts(prev => [...prev, normalized]);
      setNewProduct({ ...initialNewProductState });
      setShowNewProduct(false);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка создания товара';
      setError(message);
    }
  };

  const updateProductStatus = async (
    productId: string,
    status: Product['status']
  ) => {
    const target = products.find(product => product.id === productId);
    if (!target) return;

    try {
      const payload = buildPayloadFromProduct(target, { status });
      const updated = await api.updateProduct(productId, payload);
      const normalized = normalizeProductRecord(updated, categoriesMap);
      setProducts(prev =>
        prev.map(product => (product.id === productId ? normalized : product))
      );
      if (selectedProduct?.id === productId) {
        setSelectedProduct(normalized);
      }
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка обновления товара';
      setError(message);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(product => product.id !== productId));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка удаления товара';
      setError(message);
    }
  };

  const regenerateBarcode = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const categoryCode =
      product.categoryCode ??
      (product.categoryId
        ? categoriesMap.get(product.categoryId)?.code
        : null) ??
      '99';
    const productIndex = products.findIndex(p => p.id === productId);
    const productNumber =
      productIndex >= 0 ? productIndex + 1 : products.length + 1;
    const newBarcode = generateBarcode(categoryCode, productNumber);

    try {
      const payload = buildPayloadFromProduct(product, { barcode: newBarcode });
      const updated = await api.updateProduct(productId, payload);
      const normalized = normalizeProductRecord(updated, categoriesMap);
      setProducts(prev => prev.map(p => (p.id === productId ? normalized : p)));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(normalized);
      }
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка обновления штрих-кода';
      setError(message);
    }
  };

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      <div className='mb-6 flex items-start justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
            Управление товарами
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mt-2'>
            Каталог товаров с автоматической генерацией штрих-кодов и QR-кодов
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
      {!initialLoadComplete && loading && (
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6'>
          <div className='flex items-center'>
            <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3'></div>
            <span className='text-blue-800 dark:text-blue-300'>
              Загрузка данных из базы...
            </span>
          </div>
        </div>
      )}

      {/* Ошибка загрузки */}
      {error && (
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6'>
          <div className='flex items-center'>
            <svg
              className='w-5 h-5 text-red-600 mr-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span className='text-red-800 dark:text-red-300'>{error}</span>
          </div>
        </div>
      )}

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
              placeholder='Поиск товаров...'
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
              {categoriesList.map(category => (
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
          <div className='flex items-end gap-2'>
            <button
              onClick={() => setShowCategoryManager(true)}
              className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800'
            >
              📁 Категории
            </button>
            <button
              onClick={() => setShowNewProduct(true)}
              className='bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
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
                  />
                </div>

                <div>
                  <label
                    htmlFor='new-sku'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Артикул (SKU) *
                  </label>
                  <div className='flex gap-2'>
                    <input
                      id='new-sku'
                      type='text'
                      value={newProduct.sku}
                      onChange={e =>
                        setNewProduct({ ...newProduct, sku: e.target.value })
                      }
                      className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    />
                    <button
                      type='button'
                      onClick={() => {
                        if (!newProduct.name) {
                          alert('Сначала введите название товара');
                          return;
                        }
                        const category = categoriesList.find(
                          c => c.name === newProduct.category
                        );
                        const categoryCode = category?.code ?? 'XX';
                        const generatedSKU = generateSKU(
                          newProduct.name,
                          categoryCode
                        );
                        setNewProduct({ ...newProduct, sku: generatedSKU });
                      }}
                      className='px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center'
                      title='Сгенерировать SKU автоматически на основе названия'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                    </button>
                  </div>
                  <div className='mt-1 flex items-center gap-2'>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      💡 Нажмите 🔄 для автогенерации на основе названия
                    </p>
                  </div>
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
                    onChange={e => {
                      const newCategory = e.target.value;
                      const categoryEntry = categoriesList.find(
                        c => c.name === newCategory
                      );
                      setNewProduct(prev => {
                        const baseState = {
                          ...prev,
                          category: newCategory,
                          categoryId: categoryEntry?.id ?? null,
                          categoryCode: categoryEntry?.code ?? null,
                        } satisfies NewProductState;

                        if (baseState.name && !baseState.sku) {
                          const categoryCode = categoryEntry?.code ?? 'XX';
                          return {
                            ...baseState,
                            sku: generateSKU(baseState.name, categoryCode),
                          } satisfies NewProductState;
                        }

                        return baseState;
                      });
                    }}
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    <option value=''>Выберите категорию</option>
                    {categoriesList.map(category => (
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
                      {formatTimestamp(selectedProduct.createdAt)}
                    </div>
                    <div>
                      <strong>Обновлен:</strong>{' '}
                      {formatTimestamp(selectedProduct.updatedAt)}
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

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categoriesList}
          onSave={async updatedCategories => {
            try {
              // Сохраняем через API
              // Определяем какие категории новые, изменены или удалены
              const existingIds = categoriesList.map(c => c.id);
              const updatedIds = updatedCategories.map(c => c.id);

              // Новые категории (id начинается с temp или нет в existing)
              const newCategories = updatedCategories.filter(
                c => !existingIds.includes(c.id) || c.id.startsWith('temp')
              );

              // Измененные категории
              const changedCategories = updatedCategories.filter(
                c => existingIds.includes(c.id) && !c.id.startsWith('temp')
              );

              // Удаленные категории
              const deletedIds = existingIds.filter(
                id => !updatedIds.includes(id)
              );

              // Создаем новые
              for (const cat of newCategories) {
                await api.createCategory({
                  code: cat.code,
                  name: cat.name,
                  description: cat.description,
                });
              }

              // Обновляем измененные
              for (const cat of changedCategories) {
                await api.updateCategory(cat.id, {
                  code: cat.code,
                  name: cat.name,
                  description: cat.description,
                });
              }

              // Удаляем
              for (const id of deletedIds) {
                await api.deleteCategory(id);
              }

              // Обновляем локальный список
              const refreshed = await api.fetchCategories();
              setCategoriesList(refreshed);
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : 'Ошибка сохранения';
              alert(`Ошибка: ${errorMsg}`);
            }

            setShowCategoryManager(false);
          }}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
};

export default Products;
