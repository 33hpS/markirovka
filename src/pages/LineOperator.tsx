import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  description: string;
  manufacturer: string;
  weight: string;
  barcode: string;
  qrData: string;
  status: 'active' | 'inactive' | 'discontinued';
}

interface LabelTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  suitable: string[];
}

interface PrintJob {
  id: string;
  productId: string;
  templateId: string;
  quantity: number;
  type: 'direct' | 'pdf';
  timestamp: string;
  operator: string;
  status: 'pending' | 'completed' | 'failed';
}

// Мок данные товаров
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
  },
  {
    id: '3',
    name: 'Колбаса вареная "Докторская"',
    sku: 'SAUSAGE-DOC-300G',
    price: 285.0,
    category: 'Мясные изделия',
    description: 'Классическая вареная колбаса по ГОСТу',
    manufacturer: 'Мясокомбинат "Традиция"',
    weight: '300 г',
    barcode: '4600234789012',
    qrData:
      'https://markirovka.sherhan1988hp.workers.dev/product/SAUSAGE-DOC-300G',
    status: 'active',
  },
];

// Мок данные шаблонов
const mockTemplates: LabelTemplate[] = [
  {
    id: 'dairy-basic',
    name: 'Молочные продукты - Базовый',
    category: 'Молочные продукты',
    description: 'Простая этикетка для молочных продуктов',
    thumbnail: '🥛',
    suitable: ['Молочные продукты'],
  },
  {
    id: 'bread-standard',
    name: 'Хлебобулочные - Стандарт',
    category: 'Хлебобулочные изделия',
    description: 'Стандартная этикетка для хлеба и выпечки',
    thumbnail: '🍞',
    suitable: ['Хлебобулочные изделия'],
  },
  {
    id: 'meat-premium',
    name: 'Мясные изделия - Премиум',
    category: 'Мясные изделия',
    description: 'Премиум этикетка для мясных продуктов',
    thumbnail: '🥩',
    suitable: ['Мясные изделия'],
  },
  {
    id: 'universal',
    name: 'Универсальная этикетка',
    category: 'Универсальная',
    description: 'Подходит для всех типов товаров',
    thumbnail: '📄',
    suitable: [
      'Молочные продукты',
      'Хлебобулочные изделия',
      'Мясные изделия',
      'Напитки',
      'Консервы',
    ],
  },
];

// Мок принтеров
const mockPrinters = [
  { id: 'zebra-1', name: 'Zebra ZT420 (Линия 1)', status: 'online' },
  { id: 'brother-2', name: 'Brother QL-820 (Линия 2)', status: 'online' },
  { id: 'hp-3', name: 'HP LaserJet (Офис)', status: 'offline' },
];

const LineOperator: React.FC = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<LabelTemplate | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [printHistory, setPrintHistory] = useState<PrintJob[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [operatorName, setOperatorName] = useState('Оператор 1');
  const [printType, setPrintType] = useState<'direct' | 'pdf'>('direct');

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Фокус на поле сканирования при загрузке
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  // Поиск товара по QR-коду или артикулу
  const searchProduct = (code: string) => {
    const product = mockProducts.find(
      p =>
        p.qrData.includes(code) ||
        p.sku === code ||
        p.barcode === code ||
        p.name.toLowerCase().includes(code.toLowerCase())
    );
    return product ?? null;
  };

  // Обработка сканирования
  const handleScan = () => {
    if (!scannedCode.trim()) return;

    setIsScanning(true);

    // Имитация времени сканирования
    setTimeout(() => {
      const product = searchProduct(scannedCode);
      setFoundProduct(product);
      setIsScanning(false);

      // Автоматический выбор подходящего шаблона
      if (product) {
        const suitableTemplate = mockTemplates.find(t =>
          t.suitable.includes(product.category)
        );
        if (suitableTemplate) {
          setSelectedTemplate(suitableTemplate);
        }
      }
    }, 500);
  };

  // Печать этикетки
  const handlePrint = () => {
    if (!foundProduct || !selectedTemplate) {
      alert('Выберите товар и шаблон для печати');
      return;
    }

    if (printType === 'direct' && !selectedPrinter) {
      alert('Выберите принтер для прямой печати');
      return;
    }

    const printJob: PrintJob = {
      id: Date.now().toString(),
      productId: foundProduct.id,
      templateId: selectedTemplate.id,
      quantity,
      type: printType,
      timestamp: new Date().toISOString(),
      operator: operatorName,
      status: 'pending',
    };

    if (printType === 'direct') {
      // Имитация прямой печати
      setTimeout(() => {
        setPrintHistory(prev => [
          ...prev,
          { ...printJob, status: 'completed' },
        ]);
        alert(
          `Печать завершена на принтере ${mockPrinters.find(p => p.id === selectedPrinter)?.name}`
        );
      }, 1000);
    } else {
      // PDF сохранение
      generatePDF(foundProduct, selectedTemplate, quantity);
      setPrintHistory(prev => [...prev, { ...printJob, status: 'completed' }]);
    }

    // Очистка после печати
    setScannedCode('');
    setFoundProduct(null);
    setQuantity(1);
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  // Генерация PDF
  const generatePDF = (
    product: Product,
    template: LabelTemplate,
    qty: number
  ) => {
    // Имитация генерации PDF
    const fileName = `${product.sku}_${template.id}_${qty}шт_${new Date().toISOString().split('T')[0]}.pdf`;
    alert(`PDF сохранен: ${fileName}`);

    // В реальной реализации здесь будет вызов сервиса генерации PDF
    // console.log('Генерация PDF для:', { product, template, quantity: qty });
  };

  // Очистка формы
  const handleClear = () => {
    setScannedCode('');
    setFoundProduct(null);
    setSelectedTemplate(null);
    setQuantity(1);
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  // Фильтрация подходящих шаблонов
  const suitableTemplates = foundProduct
    ? mockTemplates.filter(
        t => t.suitable.includes(foundProduct.category) || t.id === 'universal'
      )
    : mockTemplates;

  return (
    <div className='p-6 bg-gray-50 dark:bg-gray-900 min-h-screen'>
      {/* Заголовок */}
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Рабочее место оператора
        </h1>
        <p className='text-gray-600 dark:text-gray-300 mt-2'>
          Сканирование QR-кодов и печать этикеток
        </p>
      </div>

      {/* Настройки оператора */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label
              htmlFor='operator-name'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Имя оператора
            </label>
            <input
              id='operator-name'
              type='text'
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>
          <div>
            <label
              htmlFor='print-type'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Тип печати
            </label>
            <select
              id='print-type'
              value={printType}
              onChange={e => setPrintType(e.target.value as 'direct' | 'pdf')}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='direct'>Прямая печать</option>
              <option value='pdf'>Сохранить PDF</option>
            </select>
          </div>
          {printType === 'direct' && (
            <div>
              <label
                htmlFor='printer-select'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Принтер
              </label>
              <select
                id='printer-select'
                value={selectedPrinter}
                onChange={e => setSelectedPrinter(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>Выберите принтер</option>
                {mockPrinters.map(printer => (
                  <option
                    key={printer.id}
                    value={printer.id}
                    disabled={printer.status !== 'online'}
                  >
                    {printer.name} (
                    {printer.status === 'online' ? 'В сети' : 'Офлайн'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Левая панель - Сканирование */}
        <div className='space-y-6'>
          {/* Сканер QR-кода */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              📱 Сканирование QR-кода
            </h2>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='scan-input'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  QR-код / Артикул / Штрих-код
                </label>
                <div className='flex gap-2'>
                  <input
                    id='scan-input'
                    ref={scanInputRef}
                    type='text'
                    value={scannedCode}
                    onChange={e => setScannedCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScan()}
                    placeholder='Отсканируйте QR-код или введите артикул'
                    className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    disabled={isScanning}
                  />
                  <button
                    onClick={handleScan}
                    disabled={!scannedCode.trim() || isScanning}
                    className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                  >
                    {isScanning ? '🔄' : '🔍'}
                  </button>
                </div>
              </div>

              <div className='text-sm text-gray-500 dark:text-gray-400'>
                💡 Поместите курсор в поле выше и отсканируйте QR-код сканером
              </div>
            </div>
          </div>

          {/* Информация о товаре */}
          {foundProduct ? (
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                📦 Найденный товар
              </h3>
              <div className='space-y-3'>
                <div>
                  <div className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                    {foundProduct.name}
                  </div>
                  <div className='text-sm text-gray-500 dark:text-gray-400'>
                    {foundProduct.sku} • {foundProduct.category}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Производитель:
                    </span>
                    <div className='font-medium text-gray-900 dark:text-gray-100'>
                      {foundProduct.manufacturer}
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Вес/Объем:
                    </span>
                    <div className='font-medium text-gray-900 dark:text-gray-100'>
                      {foundProduct.weight}
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Цена:
                    </span>
                    <div className='font-medium text-gray-900 dark:text-gray-100'>
                      ₽{foundProduct.price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-500 dark:text-gray-400'>
                      Штрих-код:
                    </span>
                    <div className='font-mono text-sm text-gray-900 dark:text-gray-100'>
                      {foundProduct.barcode}
                    </div>
                  </div>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Описание:
                  </span>
                  <div className='text-sm text-gray-700 dark:text-gray-200'>
                    {foundProduct.description}
                  </div>
                </div>
              </div>
            </div>
          ) : scannedCode && !isScanning ? (
            <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6'>
              <div className='flex items-center'>
                <span className='text-yellow-600 dark:text-yellow-400 mr-2'>
                  ⚠️
                </span>
                <span className='text-yellow-800 dark:text-yellow-300'>
                  Товар с кодом &ldquo;{scannedCode}&rdquo; не найден
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Правая панель - Печать */}
        <div className='space-y-6'>
          {/* Выбор шаблона */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              🏷️ Выбор шаблона
            </h3>

            <div className='grid grid-cols-1 gap-3'>
              {suitableTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
                    selectedTemplate?.id === template.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className='flex items-center'>
                    <span className='text-2xl mr-3'>{template.thumbnail}</span>
                    <div>
                      <div className='font-medium text-gray-900 dark:text-gray-100'>
                        {template.name}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Параметры печати */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              🖨️ Параметры печати
            </h3>

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='quantity'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Количество этикеток
                </label>
                <input
                  id='quantity'
                  type='number'
                  min='1'
                  max='100'
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={handlePrint}
                  disabled={!foundProduct || !selectedTemplate}
                  className='flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-800 font-medium'
                >
                  {printType === 'direct' ? '🖨️ Печать' : '💾 Сохранить PDF'}
                </button>
                <button
                  onClick={handleClear}
                  className='px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  🗑️ Очистить
                </button>
              </div>
            </div>
          </div>

          {/* История печати */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              📋 История печати
            </h3>

            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {printHistory.length === 0 ? (
                <div className='text-gray-500 dark:text-gray-400 text-sm text-center py-4'>
                  История печати пуста
                </div>
              ) : (
                printHistory
                  .slice()
                  .reverse()
                  .map(job => {
                    const product = mockProducts.find(
                      p => p.id === job.productId
                    );
                    const template = mockTemplates.find(
                      t => t.id === job.templateId
                    );
                    return (
                      <div
                        key={job.id}
                        className='p-3 bg-gray-50 dark:bg-gray-700 rounded border'
                      >
                        <div className='flex justify-between items-start'>
                          <div>
                            <div className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                              {product?.name}
                            </div>
                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                              {template?.name} • {job.quantity} шт. •{' '}
                              {job.type === 'direct' ? 'Печать' : 'PDF'}
                            </div>
                          </div>
                          <div className='text-xs text-gray-500 dark:text-gray-400'>
                            {new Date(job.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineOperator;
