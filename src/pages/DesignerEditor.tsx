import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '../hooks/useLanguage';
import * as api from '../services/apiService';
import type {
  LabelTemplate as ApiLabelTemplate,
  Product as ApiProduct,
} from '../services/apiService';
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
  dataBinding?: string | undefined;
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
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const mapApiProduct = (product: ApiProduct): Product => {
  const metadata = isRecord(product.metadata) ? product.metadata : {};
  const metaString = (key: string, fallback = ''): string =>
    toString(metadata[key], fallback);

  const category =
    product.category ??
    metaString('categoryName') ??
    metaString('category') ??
    'Без категории';

  return {
    id: product.id,
    name: product.name,
    sku: product.sku ?? metaString('sku'),
    price: toNumber(product.price, 0),
    category,
    description: product.description ?? metaString('description'),
    manufacturer: metaString('manufacturer'),
    weight: metaString('weight'),
    expiryDate: metaString('expiryDate'),
    batchNumber: metaString('batchNumber'),
    barcode: product.barcode ?? metaString('barcode'),
    qrData: product.qrData ?? metaString('qrData'),
  };
};

const allowedElementTypes = new Set<DesignElement['type']>([
  'text',
  'qr',
  'image',
  'barcode',
]);

const toDesignElements = (elements: unknown): DesignElement[] => {
  if (!Array.isArray(elements)) {
    return [];
  }

  return elements
    .map((raw, index) => {
      if (!isRecord(raw)) {
        return null;
      }

      const type = raw.type;
      if (
        typeof type !== 'string' ||
        !allowedElementTypes.has(type as DesignElement['type'])
      ) {
        return null;
      }

      const id = toString(raw.id, `el-${Date.now()}-${index}`);
      const widthDefault = type === 'text' ? 120 : 60;
      const heightDefault = type === 'text' ? 20 : 60;

      const element: DesignElement = {
        id,
        type: type as DesignElement['type'],
        content: toString(raw.content, ''),
        dataBinding: toString(raw.dataBinding, '') || undefined,
        x: toNumber(raw.x, 50),
        y: toNumber(raw.y, 50),
        width: toNumber(raw.width, widthDefault),
        height: toNumber(raw.height, heightDefault),
      };

      if (typeof raw.fontSize === 'number') {
        element.fontSize = raw.fontSize;
      }

      if (typeof raw.color === 'string') {
        element.color = raw.color;
      }

      return element;
    })
    .filter((item): item is DesignElement => item !== null);
};

const mapApiTemplate = (template: ApiLabelTemplate): LabelTemplate => {
  const metadata = isRecord(template.metadata) ? template.metadata : {};

  const baseCategory =
    template.category ?? toString(metadata.category, 'Универсальный');

  const suitable = Array.from(
    new Set([
      ...ensureStringArray(metadata.suitableFor),
      ...ensureStringArray(metadata.categories),
      baseCategory,
    ])
  ).filter(Boolean);

  return {
    id: template.id ?? `template-${Date.now()}`,
    name: template.name ?? 'Без названия',
    category: baseCategory,
    description:
      template.description ?? toString(metadata.description, 'Шаблон этикетки'),
    version: toString(metadata.version, '1.0.0'),
    elements: toDesignElements(template.elements),
    suitableFor: suitable.length > 0 ? suitable : ['Универсальный'],
    thumbnail: toString(template.thumbnail ?? metadata.thumbnail, '🏷️') || '🏷️',
  };
};

const DesignerEditor: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<LabelTemplate[]>(
    []
  );
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [selectedTemplate, setSelectedTemplate] =
    useState<LabelTemplate | null>(null);
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasSize] = useState({ width: 320, height: 200 });

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const response = await api.fetchProducts();
        if (!isMounted) return;
        const mapped = response.map(mapApiProduct);
        setProducts(mapped);
        const firstProduct = mapped[0] ?? null;
        if (firstProduct) {
          setSelectedProduct(prev => prev ?? firstProduct);
        }
      } catch (error) {
        if (!isMounted) return;
        // eslint-disable-next-line no-console
        console.error('Failed to load products for designer', error);
        setProductsError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить список продуктов'
        );
        setProducts([]);
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const response = await api.fetchTemplates();
        if (!isMounted) return;
        const mapped = response.map(mapApiTemplate);
        setAvailableTemplates(mapped);
      } catch (error) {
        if (!isMounted) return;
        // eslint-disable-next-line no-console
        console.error('Failed to load label templates for designer', error);
        setTemplatesError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить шаблоны этикеток'
        );
        setAvailableTemplates([]);
      } finally {
        if (isMounted) {
          setTemplatesLoading(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const shouldCreateNew = localStorage.getItem('createNewTemplate');
    if (shouldCreateNew === 'true') {
      localStorage.removeItem('createNewTemplate');
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
    } else {
      const editing = localStorage.getItem('editingTemplate');
      if (editing) {
        try {
          const tmpl = JSON.parse(editing) as LabelTemplate;
          setSelectedTemplate(tmpl);
          setElements(tmpl.elements ?? []);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setAvailableTemplates(prev => {
      if (prev.some(template => template.id === selectedTemplate.id)) {
        return prev;
      }
      return [...prev, selectedTemplate];
    });
  }, [selectedTemplate]);

  const suitableTemplates = React.useMemo(() => {
    if (!selectedProduct) {
      return availableTemplates;
    }
    return availableTemplates.filter(
      template =>
        template.suitableFor.includes(selectedProduct.category) ||
        template.category === selectedProduct.category ||
        template.suitableFor.includes('Универсальный')
    );
  }, [availableTemplates, selectedProduct]);

  const universalTemplates = React.useMemo(
    () =>
      availableTemplates.filter(
        template =>
          template.suitableFor.includes('Универсальный') ||
          template.category === 'Универсальный'
      ),
    [availableTemplates]
  );

  const applyTemplate = (template: LabelTemplate) => {
    setSelectedTemplate(template);
    const newElements = template.elements.map(el => ({
      ...el,
      id: `${template.id}-${el.id}-${Date.now()}`,
    }));
    setElements(newElements);
    setSelectedElement(null);
  };

  const getElementContent = (element: DesignElement): string => {
    if (element.dataBinding && selectedProduct) {
      const value = selectedProduct[element.dataBinding as keyof Product];
      if (element.dataBinding === 'price') return `${value} ₽`;
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

  const handleExportPDF = async () => {
    if (!selectedProduct) {
      alert('Выберите продукт перед экспортом этикетки в PDF');
      return;
    }
    try {
      await PDFExportService.exportLabelToPDF(elements, selectedProduct);
    } catch (error) {
      alert(
        `Ошибка при экспорте PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleExportHighQualityPDF = async () => {
    if (!selectedProduct) {
      alert('Выберите продукт перед экспортом высококачественного PDF');
      return;
    }
    try {
      await PDFExportService.exportHighQualityPDF(elements, selectedProduct);
    } catch (error) {
      alert(
        `Ошибка при экспорте высококачественного PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  };

  const handleCreatePreview = async () => {
    if (!selectedProduct) {
      alert('Выберите продукт перед созданием превью этикетки');
      return;
    }
    try {
      const previewUrl = await PDFExportService.createPreviewImage(
        elements,
        selectedProduct
      );
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

  const handleSaveTemplate = () => {
    if (!selectedTemplate) {
      alert('Сначала выберите шаблон для редактирования или создайте новый');
      return;
    }

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
    } as const;

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

    if (!selectedProduct) {
      alert('Выберите продукт, чтобы отправить этикетку в печать');
      return;
    }

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
        </div>

        {/* Шаг 1: Выбор продукта */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100'>
            Шаг 1: Выберите продукт
          </h2>
          {productsLoading && (
            <div className='rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700'>
              Загружаем список продуктов...
            </div>
          )}

          {productsError && (
            <div className='mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'>
              Не удалось загрузить продукты: {productsError}
            </div>
          )}

          {!productsLoading && !productsError && products.length === 0 && (
            <div className='rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700'>
              Продукты пока не найдены. Добавьте их через систему управления или
              обновите страницу позже.
            </div>
          )}

          <div className='mt-4 grid md:grid-cols-3 gap-4'>
            {products.map(product => (
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
                  selectedProduct?.id === product.id
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
                    <strong>Производитель:</strong>{' '}
                    {product.manufacturer || '—'}
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
              (подходящие для:{' '}
              {selectedProduct?.category ?? 'продукт не выбран'})
            </span>
          </h2>

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

          {templatesLoading && (
            <div className='rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700'>
              Загружаем шаблоны этикеток...
            </div>
          )}

          {templatesError && (
            <div className='mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600'>
              Не удалось загрузить шаблоны: {templatesError}
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
            {suitableTemplates.length === 0 &&
              !templatesLoading &&
              !templatesError &&
              availableTemplates.length === 0 && (
                <div className='col-span-full rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500'>
                  Шаблоны пока не загружены
                </div>
              )}
          </div>

          {suitableTemplates.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              {selectedProduct ? (
                <>
                  <p>
                    Нет подходящих шаблонов для категории &quot;
                    {selectedProduct.category}&quot;
                  </p>
                  <p className='text-sm mt-2'>
                    Используйте универсальный шаблон или создайте свой
                  </p>
                </>
              ) : (
                <p>Выберите продукт, чтобы увидеть подходящие шаблоны</p>
              )}
            </div>
          )}

          <div className='mt-6 pt-6 border-t'>
            <h3 className='font-medium mb-3 text-gray-700'>
              Универсальные шаблоны
            </h3>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {universalTemplates.map(template => (
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
              {universalTemplates.length === 0 && !templatesLoading && (
                <div className='col-span-full rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500'>
                  Универсальные шаблоны пока отсутствуют
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Редактор этикетки */}
        {selectedTemplate && (
          <div className='grid lg:grid-cols-4 gap-6'>
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
                        onChange={e =>
                          updateElement(selectedEl.id, {
                            dataBinding:
                              e.target.value === ''
                                ? undefined
                                : e.target.value,
                          })
                        }
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
                          min={10}
                          max={300}
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
                          min={10}
                          max={200}
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

                        {selectedElement === element.id && (
                          <>
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
                                  updateElement(element.id, {
                                    width: Math.max(10, startWidth + deltaX),
                                    height: Math.max(10, startHeight + deltaY),
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
                                  updateElement(element.id, {
                                    width: Math.max(10, startWidth + deltaX),
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
                                  updateElement(element.id, {
                                    height: Math.max(10, startHeight + deltaY),
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

            <div className='lg:col-span-1'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4'>
                <h3 className='font-medium mb-3 text-gray-900 dark:text-gray-100'>
                  Данные продукта
                </h3>
                {selectedProduct ? (
                  <div className='space-y-2 text-xs'>
                    <div>
                      <strong>Название:</strong> {selectedProduct.name}
                    </div>
                    <div>
                      <strong>SKU:</strong> {selectedProduct.sku || '—'}
                    </div>
                    <div>
                      <strong>Цена:</strong>{' '}
                      {Number.isFinite(selectedProduct.price)
                        ? `${selectedProduct.price.toFixed(2)} ₽`
                        : '—'}
                    </div>
                    <div>
                      <strong>Производитель:</strong>{' '}
                      {selectedProduct.manufacturer || '—'}
                    </div>
                    <div>
                      <strong>Вес:</strong> {selectedProduct.weight || '—'}
                    </div>
                    <div>
                      <strong>Срок годности:</strong>{' '}
                      {selectedProduct.expiryDate || '—'}
                    </div>
                    <div>
                      <strong>Партия:</strong>{' '}
                      {selectedProduct.batchNumber || '—'}
                    </div>
                  </div>
                ) : (
                  <div className='rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700'>
                    Выберите продукт, чтобы просмотреть его данные и
                    использовать привязку полей
                  </div>
                )}
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

export default DesignerEditor;
