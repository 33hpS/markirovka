import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../hooks/useLanguage';
import { PDFExportService } from '../services/pdfExportService';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  description: string;
  manufacturer: string;
  weight: string;
  expiryDate: string;
  batchNumber: string;
  barcode: string;
  qrData: string;
}

interface DesignElement {
  id: string;
  type: 'text' | 'qr' | 'image' | 'barcode';
  content: string;
  dataBinding?: string | undefined; // Привязка к данным продукта
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
  suitableFor: string[]; // Подходящие категории продуктов
  thumbnail: string;
}

// Шаблоны этикеток
const labelTemplates: LabelTemplate[] = [
  {
    id: 'dairy-basic',
    name: 'Молочные продукты - Базовый',
    category: 'Молочные продукты',
    description:
      'Простая этикетка для молочных продуктов с основной информацией',
    version: '2.1.0',
    suitableFor: ['Молочные продукты'],
    thumbnail: '🥛',
    elements: [
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
        color: '#1a365d',
      },
      {
        id: '2',
        type: 'text',
        content: 'Производитель',
        dataBinding: 'manufacturer',
        x: 10,
        y: 40,
        width: 150,
        height: 18,
        fontSize: 12,
        color: '#4a5568',
      },
      {
        id: '3',
        type: 'text',
        content: 'Срок годности',
        dataBinding: 'expiryDate',
        x: 10,
        y: 65,
        width: 120,
        height: 16,
        fontSize: 11,
        color: '#e53e3e',
      },
      {
        id: '4',
        type: 'qr',
        content: 'QR-код',
        dataBinding: 'qrData',
        x: 220,
        y: 10,
        width: 80,
        height: 80,
      },
    ],
  },
  {
    id: 'bread-detailed',
    name: 'Хлебобулочные - Детальный',
    category: 'Хлебобулочные изделия',
    description: 'Подробная этикетка для хлеба с акцентом на свежести',
    version: '1.3.2',
    suitableFor: ['Хлебобулочные изделия'],
    thumbnail: '🍞',
    elements: [
      {
        id: '1',
        type: 'text',
        content: 'Название',
        dataBinding: 'name',
        x: 10,
        y: 10,
        width: 180,
        height: 22,
        fontSize: 14,
        color: '#744210',
      },
      {
        id: '2',
        type: 'text',
        content: 'Вес',
        dataBinding: 'weight',
        x: 200,
        y: 10,
        width: 60,
        height: 20,
        fontSize: 12,
        color: '#1a202c',
      },
      {
        id: '3',
        type: 'text',
        content: 'Срок годности',
        dataBinding: 'expiryDate',
        x: 10,
        y: 40,
        width: 100,
        height: 18,
        fontSize: 11,
        color: '#e53e3e',
      },
      {
        id: '4',
        type: 'text',
        content: 'Партия',
        dataBinding: 'batchNumber',
        x: 120,
        y: 40,
        width: 90,
        height: 16,
        fontSize: 10,
        color: '#4a5568',
      },
      {
        id: '5',
        type: 'barcode',
        content: 'Штрих-код',
        dataBinding: 'barcode',
        x: 10,
        y: 65,
        width: 150,
        height: 25,
      },
    ],
  },
  {
    id: 'universal-compact',
    name: 'Универсальный - Компактный',
    category: 'Универсальный',
    description: 'Компактная этикетка для любых продуктов',
    version: '1.0.5',
    suitableFor: ['Молочные продукты', 'Хлебобулочные изделия', 'Другое'],
    thumbnail: '📦',
    elements: [
      {
        id: '1',
        type: 'text',
        content: 'Продукт',
        dataBinding: 'name',
        x: 10,
        y: 10,
        width: 140,
        height: 20,
        fontSize: 13,
        color: '#1a202c',
      },
      {
        id: '2',
        type: 'text',
        content: 'Цена',
        dataBinding: 'price',
        x: 160,
        y: 10,
        width: 60,
        height: 20,
        fontSize: 13,
        color: '#38a169',
      },
      {
        id: '3',
        type: 'qr',
        content: 'QR',
        dataBinding: 'qrData',
        x: 230,
        y: 10,
        width: 60,
        height: 60,
      },
      {
        id: '4',
        type: 'text',
        content: 'SKU',
        dataBinding: 'sku',
        x: 10,
        y: 35,
        width: 80,
        height: 16,
        fontSize: 10,
        color: '#4a5568',
      },
    ],
  },
  {
    id: 'premium-detailed',
    name: 'Премиум - Подробный',
    category: 'Премиум',
    description: 'Детальная этикетка с полной информацией о продукте',
    version: '3.0.1',
    suitableFor: ['Молочные продукты'],
    thumbnail: '⭐',
    elements: [
      {
        id: '1',
        type: 'text',
        content: 'Название',
        dataBinding: 'name',
        x: 10,
        y: 10,
        width: 200,
        height: 22,
        fontSize: 15,
        color: '#1a365d',
      },
      {
        id: '2',
        type: 'text',
        content: 'Описание',
        dataBinding: 'description',
        x: 10,
        y: 35,
        width: 200,
        height: 30,
        fontSize: 10,
        color: '#4a5568',
      },
      {
        id: '3',
        type: 'text',
        content: 'Производитель',
        dataBinding: 'manufacturer',
        x: 10,
        y: 70,
        width: 140,
        fontSize: 11,
        height: 16,
        color: '#2d3748',
      },
      {
        id: '4',
        type: 'text',
        content: 'Вес',
        dataBinding: 'weight',
        x: 160,
        y: 70,
        width: 50,
        height: 16,
        fontSize: 11,
        color: '#2d3748',
      },
      {
        id: '5',
        type: 'text',
        content: 'Срок годности',
        dataBinding: 'expiryDate',
        x: 10,
        y: 90,
        width: 100,
        height: 16,
        fontSize: 11,
        color: '#e53e3e',
      },
      {
        id: '6',
        type: 'text',
        content: 'Партия',
        dataBinding: 'batchNumber',
        x: 120,
        y: 90,
        width: 90,
        height: 16,
        fontSize: 9,
        color: '#718096',
      },
      {
        id: '7',
        type: 'qr',
        content: 'QR-код',
        dataBinding: 'qrData',
        x: 220,
        y: 35,
        width: 70,
        height: 70,
      },
      {
        id: '8',
        type: 'text',
        content: 'Цена',
        dataBinding: 'price',
        x: 10,
        y: 115,
        width: 80,
        height: 20,
        fontSize: 14,
        color: '#38a169',
      },
      {
        id: '9',
        type: 'barcode',
        content: 'Штрих-код',
        dataBinding: 'barcode',
        x: 100,
        y: 115,
        width: 120,
        height: 20,
      },
    ],
  },
];

// Мок данные продуктов
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Молоко цельное 3.2%',
    sku: 'MILK-032-1L',
    price: 89.9,
    category: 'Молочные продукты',
    description: 'Натуральное цельное молоко 3.2% жирности',
    manufacturer: 'ООО "Молочная ферма"',
    weight: '1 л',
    expiryDate: '2025-10-15',
    batchNumber: 'БП-2025-10-04-001',
    barcode: '4607034376453',
    qrData: 'https://milk-farm.ru/product/milk-032-1l?batch=БП-2025-10-04-001',
  },
  {
    id: '2',
    name: 'Хлеб белый нарезной',
    sku: 'BREAD-WHITE-500G',
    price: 45.5,
    category: 'Хлебобулочные изделия',
    description: 'Хлеб пшеничный белый нарезной',
    manufacturer: 'Хлебозавод №1',
    weight: '500 г',
    expiryDate: '2025-10-06',
    batchNumber: 'ХБ-2025-10-04-015',
    barcode: '4607034587432',
    qrData:
      'https://bread-factory.ru/product/white-bread-500g?batch=ХБ-2025-10-04-015',
  },
  {
    id: '3',
    name: 'Сыр российский',
    sku: 'CHEESE-RUS-200G',
    price: 155.0,
    category: 'Молочные продукты',
    description: 'Сыр российский твердый 50% жирности',
    manufacturer: 'Сырзавод "Традиция"',
    weight: '200 г',
    expiryDate: '2025-11-04',
    batchNumber: 'СР-2025-10-03-007',
    barcode: '4607034912345',
    qrData:
      'https://cheese-tradition.ru/product/russian-cheese-200g?batch=СР-2025-10-03-007',
  },
];

// Доступные поля для привязки
const productFields = [
  { key: 'name', label: 'Название продукта' },
  { key: 'sku', label: 'Артикул (SKU)' },
  { key: 'price', label: 'Цена' },
  { key: 'category', label: 'Категория' },
  { key: 'description', label: 'Описание' },
  { key: 'manufacturer', label: 'Производитель' },
  { key: 'weight', label: 'Вес/Объем' },
  { key: 'expiryDate', label: 'Срок годности' },
  { key: 'batchNumber', label: 'Номер партии' },
  { key: 'barcode', label: 'Штрих-код' },
  { key: 'qrData', label: 'QR-код данные' },
];

const DesignerInteractive: React.FC = () => {
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    () =>
      mockProducts[0] ?? {
        id: '1',
        name: 'Молоко цельное 3.2%',
        sku: 'MILK-032-1L',
        price: 89.9,
        category: 'Молочные продукты',
        description: 'Натуральное цельное молоко 3.2% жирности',
        manufacturer: 'ООО "Молочная ферма"',
        weight: '1 л',
        expiryDate: '2025-10-15',
        batchNumber: 'БП-2025-10-04-001',
        barcode: '4607034376453',
        qrData:
          'https://milk-farm.ru/product/milk-032-1l?batch=БП-2025-10-04-001',
      }
  );

  const [selectedTemplate, setSelectedTemplate] =
    useState<LabelTemplate | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasSize] = useState({ width: 320, height: 200 }); // 80x50mm at 4px/mm

  const navigate = useNavigate();

  // Проверяем, нужно ли создать новый шаблон
  useEffect(() => {
    const shouldCreateNew = localStorage.getItem('createNewTemplate');
    if (shouldCreateNew === 'true') {
      // Удаляем флаг
      localStorage.removeItem('createNewTemplate');

      // Создаем пустой шаблон для редактирования
      const newTemplate: LabelTemplate = {
        id: `custom-${Date.now()}`,
        name: 'Новый шаблон',
        category: 'Пользовательский',
        description: 'Создайте свой уникальный шаблон этикетки',
        version: '1.0.0',
        elements: [],
        suitableFor: ['Универсальный'],
        thumbnail: '✨',
      };

      setSelectedTemplate(newTemplate);
      setElements([]);
      setSelectedElement(null);
    }
  }, []);

  // Получаем подходящие шаблоны для выбранного продукта
  const suitableTemplates = labelTemplates.filter(template =>
    template.suitableFor.includes(selectedProduct.category)
  );

  // Функция применения шаблона
  const applyTemplate = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    // Создаем копии элементов шаблона с новыми ID
    const newElements = template.elements.map(element => ({
      ...element,
      id: `${template.id}-${element.id}-${Date.now()}`,
    }));
    setElements(newElements);
    setSelectedElement(null);
  };

  // Функция для получения актуального содержимого элемента
  const getElementContent = (element: DesignElement): string => {
    if (element.dataBinding && selectedProduct) {
      const value = selectedProduct[element.dataBinding as keyof Product];
      if (element.dataBinding === 'price') {
        return `${value} ₽`;
      }
      return value?.toString() || element.content;
    }
    return element.content;
  };

  const addElement = (type: DesignElement['type']) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type,
      content:
        type === 'text'
          ? 'Новый текст'
          : type === 'qr'
            ? 'QR-код'
            : type === 'barcode'
              ? 'Штрих-код'
              : 'Изображение',
      x: 50,
      y: 50,
      width: type === 'text' ? 120 : 60,
      height: type === 'text' ? 20 : 60,
      ...(type === 'text' && { fontSize: 12 }),
      color: '#000000',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  // Функции экспорта
  const handleExportPDF = async () => {
    try {
      await PDFExportService.exportLabelToPDF(elements, selectedProduct);
    } catch (error) {
      alert(
        `Ошибка при экспорте PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleExportHighQualityPDF = async () => {
    try {
      await PDFExportService.exportHighQualityPDF(elements, selectedProduct);
    } catch (error) {
      alert(
        `Ошибка при экспорте высококачественного PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleCreatePreview = async () => {
    try {
      const previewUrl = await PDFExportService.createPreviewImage(
        elements,
        selectedProduct
      );
      // Открываем превью в новом окне
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Превью этикетки - ${selectedProduct.name}</title></head>
            <body style="margin: 20px; text-align: center;">
              <h2>Превью этикетки</h2>
              <p><strong>Продукт:</strong> ${selectedProduct.name} (${selectedProduct.sku})</p>
              <img src="${previewUrl}" style="border: 1px solid #ccc; max-width: 100%;" />
              <br><br>
              <button onclick="window.print()">Печать</button>
              <button onclick="window.close()">Закрыть</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      alert(
        `Ошибка при создании превью: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  // Функции для кнопок в шапке
  const handleSaveTemplate = () => {
    if (!selectedTemplate) {
      alert('Сначала выберите шаблон для редактирования или создайте новый');
      return;
    }

    // Для кастомных шаблонов просим ввести имя
    let templateName = selectedTemplate.name;
    if (selectedTemplate.id.startsWith('custom-')) {
      const newName = prompt(
        'Введите название для вашего шаблона:',
        selectedTemplate.name
      );
      if (!newName || newName.trim() === '') {
        alert('Название шаблона не может быть пустым');
        return;
      }
      templateName = newName.trim();
    }

    const templateData = {
      ...selectedTemplate,
      name: templateName,
      elements,
      updatedAt: new Date().toISOString().split('T')[0],
      version: selectedTemplate.id.startsWith('custom-')
        ? '1.0.0'
        : `${parseFloat(selectedTemplate.version ?? '1.0') + 0.1}.0`,
    };

    const data = JSON.stringify(templateData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${templateName.replace(/\s+/g, '-').toLowerCase()}-v${templateData.version}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`Шаблон "${templateName}" сохранен как JSON файл`);
  };
  const handlePrintLabel = () => {
    if (elements.length === 0) {
      alert('Добавьте элементы на этикетку перед печатью');
      return;
    }

    // Переходим в раздел Печать с сохраненными данными
    const printData = {
      elements,
      product: selectedProduct,
      template: selectedTemplate,
    };
    localStorage.setItem('printQueue', JSON.stringify([printData]));
    navigate('/printing');
  };

  return (
    <div className='w-full min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='w-full px-4 sm:px-6 lg:px-8 py-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
              {t.designerTitle}
            </h1>
            {selectedTemplate?.id.startsWith('custom-') && (
              <p className='text-sm text-green-600 dark:text-green-400 mt-1'>
                ✨ {t.templateCreationHint}
              </p>
            )}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={handleSaveTemplate}
              className='px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
            >
              {t.saveTemplate}
            </button>
            <button
              onClick={handlePrintLabel}
              className='px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-500 dark:hover:bg-green-400'
            >
              {t.printLabel}
            </button>
          </div>
        </div>{' '}
        {/* Шаг 1: Выбор продукта */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100'>
            Шаг 1: Выберите продукт
          </h2>
          <div className='grid md:grid-cols-3 gap-4'>
            {mockProducts.map(product => (
              <div
                key={product.id}
                role='button'
                tabIndex={0}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedProduct.id === product.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }`}
              >
                <div className='flex justify-between items-start mb-2'>
                  <h3 className='font-medium text-sm'>{product.name}</h3>
                  <span className='text-xs bg-gray-100 px-2 py-1 rounded'>
                    {product.category}
                  </span>
                </div>
                <div className='text-xs text-gray-600 space-y-1'>
                  <div>
                    <strong>SKU:</strong> {product.sku}
                  </div>
                  <div>
                    <strong>Цена:</strong> {product.price} ₽
                  </div>
                  <div>
                    <strong>Производитель:</strong> {product.manufacturer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Шаг 2: Выбор шаблона */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100'>
            Шаг 2: Выберите шаблон этикетки
            <span className='text-sm font-normal text-gray-600 ml-2'>
              (подходящие для: {selectedProduct.category})
            </span>
          </h2>

          {/* Кастомный шаблон (если создается) */}
          {selectedTemplate?.id.startsWith('custom-') && (
            <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
              <h3 className='font-medium text-green-800 mb-2'>
                🎨 Создание нового шаблона
              </h3>
              <p className='text-sm text-green-700 mb-3'>
                Вы создаете новый шаблон с нуля. Используйте инструменты справа
                для добавления элементов.
              </p>
              <div className='grid md:grid-cols-1 gap-4'>
                <div className='p-4 border-2 border-green-300 rounded-lg bg-white'>
                  <div className='text-center mb-3'>
                    <div className='text-3xl mb-2'>
                      {selectedTemplate.thumbnail}
                    </div>
                    <h3 className='font-medium text-sm'>
                      {selectedTemplate.name}
                    </h3>
                  </div>
                  <p className='text-xs text-gray-600 text-center'>
                    {selectedTemplate.description}
                  </p>
                  <div className='mt-3 text-center'>
                    <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                      {elements.length} элементов
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {suitableTemplates.map(template => (
              <div
                key={template.id}
                role='button'
                tabIndex={0}
                onClick={() => applyTemplate(template)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    applyTemplate(template);
                  }
                }}
                className={`p-4 border rounded-lg cursor-pointer transition hover:border-indigo-300 ${
                  selectedTemplate?.id === template.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200'
                }`}
              >
                <div className='text-center mb-3'>
                  <div className='text-3xl mb-2'>{template.thumbnail}</div>
                  <h3 className='font-medium text-sm'>{template.name}</h3>
                </div>
                <p className='text-xs text-gray-600 text-center'>
                  {template.description}
                </p>
                <div className='mt-3 text-center'>
                  <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                    {template.elements.length} элементов
                  </span>
                </div>
              </div>
            ))}
          </div>

          {suitableTemplates.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <p>
                Нет подходящих шаблонов для категории &quot;
                {selectedProduct.category}&quot;
              </p>
              <p className='text-sm mt-2'>
                Используйте универсальный шаблон или создайте свой
              </p>
            </div>
          )}

          {/* Универсальные шаблоны */}
          <div className='mt-6 pt-6 border-t'>
            <h3 className='font-medium mb-3 text-gray-700'>
              Универсальные шаблоны
            </h3>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {labelTemplates
                .filter(
                  template =>
                    template.suitableFor.includes('Универсальный') ||
                    template.category === 'Универсальный'
                )
                .map(template => (
                  <div
                    key={template.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => applyTemplate(template)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        applyTemplate(template);
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition hover:border-indigo-300 ${
                      selectedTemplate?.id === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className='text-center mb-3'>
                      <div className='text-3xl mb-2'>{template.thumbnail}</div>
                      <h3 className='font-medium text-sm'>{template.name}</h3>
                    </div>
                    <p className='text-xs text-gray-600 text-center'>
                      {template.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {/* Редактор этикетки (показывается только если выбран шаблон) */}
        {selectedTemplate && (
          <div className='grid lg:grid-cols-4 gap-6'>
            {/* Tools Panel */}
            <div className='lg:col-span-1'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4'>
                <h3 className='font-medium mb-3 text-gray-900 dark:text-gray-100'>
                  {t.tools}
                </h3>
                <div className='space-y-2'>
                  <button
                    onClick={() => addElement('text')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800'
                  >
                    📝 {t.addText}
                  </button>
                  <button
                    onClick={() => addElement('qr')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800'
                  >
                    📱 {t.addQR}
                  </button>
                  <button
                    onClick={() => addElement('barcode')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800'
                  >
                    📊 {t.addBarcode}
                  </button>
                  <button
                    onClick={() => addElement('image')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800'
                  >
                    🖼️ {t.addImage}
                  </button>
                </div>
              </div>

              {/* Properties Panel */}
              {selectedEl && (
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                  <h3 className='font-medium mb-3 text-gray-900 dark:text-gray-100'>
                    {t.elementProperties}
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <label
                        htmlFor='content-input'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        Содержимое
                      </label>
                      <input
                        id='content-input'
                        type='text'
                        value={selectedEl.content}
                        onChange={e =>
                          updateElement(selectedEl.id, {
                            content: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      />
                    </div>

                    {/* Привязка к данным */}
                    <div>
                      <label
                        htmlFor='data-binding-select'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        Привязка к данным продукта
                      </label>
                      <select
                        id='data-binding-select'
                        value={selectedEl.dataBinding ?? ''}
                        onChange={e => {
                          const value = e.target.value;
                          updateElement(selectedEl.id, {
                            dataBinding: value === '' ? undefined : value,
                          });
                        }}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      >
                        <option value=''>Без привязки</option>
                        {productFields.map(field => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      {selectedEl.dataBinding && (
                        <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
                          <strong>Предпросмотр:</strong>{' '}
                          {getElementContent(selectedEl)}
                        </div>
                      )}
                    </div>

                    {selectedEl.type === 'text' && (
                      <>
                        <div>
                          <label
                            htmlFor='font-size-input'
                            className='block text-sm font-medium text-gray-700 mb-1'
                          >
                            Размер шрифта
                          </label>
                          <input
                            id='font-size-input'
                            type='number'
                            value={selectedEl.fontSize ?? 12}
                            onChange={e =>
                              updateElement(selectedEl.id, {
                                fontSize: parseInt(e.target.value),
                              })
                            }
                            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                          />
                        </div>
                        <div>
                          <label
                            htmlFor='color-input'
                            className='block text-sm font-medium text-gray-700 mb-1'
                          >
                            Цвет
                          </label>
                          <input
                            id='color-input'
                            type='color'
                            value={selectedEl.color ?? '#000000'}
                            onChange={e =>
                              updateElement(selectedEl.id, {
                                color: e.target.value,
                              })
                            }
                            className='w-full h-10 border border-gray-300 rounded-md'
                          />
                        </div>
                      </>
                    )}

                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <label
                          htmlFor='x-input'
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          X
                        </label>
                        <input
                          id='x-input'
                          type='number'
                          value={selectedEl.x}
                          onChange={e =>
                            updateElement(selectedEl.id, {
                              x: parseInt(e.target.value),
                            })
                          }
                          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm'
                        />
                      </div>
                      <div>
                        <label
                          htmlFor='y-input'
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          Y
                        </label>
                        <input
                          id='y-input'
                          type='number'
                          value={selectedEl.y}
                          onChange={e =>
                            updateElement(selectedEl.id, {
                              y: parseInt(e.target.value),
                            })
                          }
                          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 mt-4'>
                      <div>
                        <label
                          htmlFor='width-input'
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          Ширина
                        </label>
                        <input
                          id='width-input'
                          type='number'
                          value={selectedEl.width}
                          onChange={e =>
                            updateElement(selectedEl.id, {
                              width: parseInt(e.target.value),
                            })
                          }
                          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm'
                          min='10'
                          max='300'
                        />
                      </div>
                      <div>
                        <label
                          htmlFor='height-input'
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          Высота
                        </label>
                        <input
                          id='height-input'
                          type='number'
                          value={selectedEl.height}
                          onChange={e =>
                            updateElement(selectedEl.id, {
                              height: parseInt(e.target.value),
                            })
                          }
                          className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md text-sm'
                          min='10'
                          max='200'
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => deleteElement(selectedEl.id)}
                      className='w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-500'
                    >
                      Удалить элемент
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className='lg:col-span-2'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='font-medium text-gray-900 dark:text-gray-100'>
                    Холст (80×50mm) - {selectedTemplate.name}
                  </h3>
                  <div className='text-sm text-gray-500'>Масштаб: 1:1</div>
                </div>

                <div className='border-2 border-dashed border-gray-300 p-4 bg-gray-50'>
                  <div
                    className='relative bg-white border shadow-sm mx-auto'
                    style={{
                      width: `${canvasSize.width}px`,
                      height: `${canvasSize.height}px`,
                    }}
                    role='button'
                    tabIndex={0}
                    onClick={() => setSelectedElement(null)}
                    onKeyDown={e =>
                      e.key === 'Escape' && setSelectedElement(null)
                    }
                  >
                    {elements.map(element => (
                      <div
                        key={element.id}
                        className={`absolute border cursor-pointer transition ${
                          selectedElement === element.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        style={{
                          left: element.x,
                          top: element.y,
                          width: element.width,
                          height: element.height,
                          fontSize: element.fontSize,
                          color: element.color,
                        }}
                        role='button'
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedElement(element.id);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedElement(element.id);
                          }
                        }}
                      >
                        {element.type === 'text' && (
                          <div className='w-full h-full flex items-center'>
                            <span
                              className={`block truncate ${element.dataBinding ? 'text-blue-600' : ''}`}
                            >
                              {getElementContent(element)}
                            </span>
                            {element.dataBinding && (
                              <span className='ml-1 text-xs text-blue-500'>
                                🔗
                              </span>
                            )}
                          </div>
                        )}
                        {element.type === 'qr' && (
                          <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs relative'>
                            QR
                            {element.dataBinding && (
                              <span className='absolute top-0 right-0 text-blue-500'>
                                🔗
                              </span>
                            )}
                          </div>
                        )}
                        {element.type === 'barcode' && (
                          <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs relative'>
                            |||||||
                            {element.dataBinding && (
                              <span className='absolute top-0 right-0 text-blue-500'>
                                🔗
                              </span>
                            )}
                          </div>
                        )}
                        {element.type === 'image' && (
                          <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs relative'>
                            🖼️
                            {element.dataBinding && (
                              <span className='absolute top-0 right-0 text-blue-500'>
                                🔗
                              </span>
                            )}
                          </div>
                        )}

                        {/* Resize handles for selected element */}
                        {selectedElement === element.id && (
                          <>
                            {/* Bottom-right corner handle */}
                            <div
                              className='absolute w-3 h-3 bg-indigo-500 border border-white cursor-se-resize'
                              style={{ bottom: -1, right: -1 }}
                              role='button'
                              tabIndex={0}
                              aria-label='Изменить размер элемента'
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startWidth = element.width;
                                const startHeight = element.height;

                                const handleMouseMove = (e: MouseEvent) => {
                                  const deltaX = e.clientX - startX;
                                  const deltaY = e.clientY - startY;
                                  const newWidth = Math.max(
                                    10,
                                    startWidth + deltaX
                                  );
                                  const newHeight = Math.max(
                                    10,
                                    startHeight + deltaY
                                  );

                                  updateElement(element.id, {
                                    width: newWidth,
                                    height: newHeight,
                                  });
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.removeEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                };

                                document.addEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.addEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              }}
                            />

                            {/* Right edge handle */}
                            <div
                              className='absolute w-2 h-full bg-indigo-400 opacity-50 cursor-e-resize'
                              style={{ right: -1, top: 0 }}
                              role='button'
                              tabIndex={0}
                              aria-label='Изменить ширину элемента'
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                const startX = e.clientX;
                                const startWidth = element.width;

                                const handleMouseMove = (e: MouseEvent) => {
                                  const deltaX = e.clientX - startX;
                                  const newWidth = Math.max(
                                    10,
                                    startWidth + deltaX
                                  );

                                  updateElement(element.id, {
                                    width: newWidth,
                                  });
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.removeEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                };

                                document.addEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.addEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              }}
                            />

                            {/* Bottom edge handle */}
                            <div
                              className='absolute w-full h-2 bg-indigo-400 opacity-50 cursor-s-resize'
                              style={{ bottom: -1, left: 0 }}
                              role='button'
                              tabIndex={0}
                              aria-label='Изменить высоту элемента'
                              onMouseDown={e => {
                                e.preventDefault();
                                e.stopPropagation();

                                const startY = e.clientY;
                                const startHeight = element.height;

                                const handleMouseMove = (e: MouseEvent) => {
                                  const deltaY = e.clientY - startY;
                                  const newHeight = Math.max(
                                    10,
                                    startHeight + deltaY
                                  );

                                  updateElement(element.id, {
                                    height: newHeight,
                                  });
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    'mousemove',
                                    handleMouseMove
                                  );
                                  document.removeEventListener(
                                    'mouseup',
                                    handleMouseUp
                                  );
                                };

                                document.addEventListener(
                                  'mousemove',
                                  handleMouseMove
                                );
                                document.addEventListener(
                                  'mouseup',
                                  handleMouseUp
                                );
                              }}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Data & Export */}
            <div className='lg:col-span-1'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4'>
                <h3 className='font-medium mb-3 text-gray-900 dark:text-gray-100'>
                  Данные продукта
                </h3>
                <div className='space-y-2 text-xs'>
                  <div>
                    <strong>Название:</strong> {selectedProduct.name}
                  </div>
                  <div>
                    <strong>SKU:</strong> {selectedProduct.sku}
                  </div>
                  <div>
                    <strong>Цена:</strong> {selectedProduct.price} ₽
                  </div>
                  <div>
                    <strong>Производитель:</strong>{' '}
                    {selectedProduct.manufacturer}
                  </div>
                  <div>
                    <strong>Вес:</strong> {selectedProduct.weight}
                  </div>
                  <div>
                    <strong>Срок годности:</strong> {selectedProduct.expiryDate}
                  </div>
                  <div>
                    <strong>Партия:</strong> {selectedProduct.batchNumber}
                  </div>
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4'>
                <h3 className='font-medium mb-3 text-gray-900 dark:text-gray-100'>
                  Экспорт
                </h3>
                <div className='space-y-2'>
                  <button
                    onClick={handleExportPDF}
                    className='w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500'
                  >
                    📄 Скачать PDF
                  </button>
                  <button
                    onClick={handleExportHighQualityPDF}
                    className='w-full px-3 py-2 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600'
                  >
                    📄 HD PDF (печать)
                  </button>
                  <button
                    onClick={handleCreatePreview}
                    className='w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-500'
                  >
                    👁️ Превью этикетки
                  </button>
                  <button className='w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-500'>
                    🖨️ ZPL для принтера
                  </button>
                  <button className='w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50'>
                    💾 Сохранить как PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerInteractive;
