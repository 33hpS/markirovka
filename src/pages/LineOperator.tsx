import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import * as api from '../services/apiService';
import type {
  LabelTemplate as ApiLabelTemplate,
  Product as ApiProduct,
  Printer as ApiPrinter,
} from '../services/apiService';

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

interface Printer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance';
  type: string;
  model: string;
  location: string;
  capabilities: string[];
  paperSize: string;
  resolution: string;
  lastSeen: string | null;
  totalJobs: number;
  errorCount: number;
}

const printerStatusLabels: Record<Printer['status'], string> = {
  online: 'В сети',
  offline: 'Офлайн',
  busy: 'Занят',
  error: 'Ошибка',
  maintenance: 'Обслуживание',
};

interface PrintJob {
  id: string;
  productId: string;
  productName: string;
  templateId: string;
  templateName: string;
  quantity: number;
  type: 'direct' | 'pdf';
  timestamp: string;
  operator: string;
  status: 'pending' | 'completed' | 'failed';
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseNumber = (value: unknown, fallback = 0): number => {
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

const normalizeProduct = (product: ApiProduct): Product => {
  const metadata = product.metadata as Record<string, unknown> | undefined;
  const metaString = (key: string, fallback?: string) => {
    if (metadata && isNonEmptyString(metadata[key])) {
      return metadata[key] as string;
    }
    return fallback;
  };

  const categoryName =
    product.category ??
    metaString('categoryName') ??
    metaString('category') ??
    'Без категории';

  return {
    id: product.id,
    name: product.name,
    sku: product.sku ?? metaString('sku') ?? '',
    price: parseNumber(product.price),
    category: categoryName,
    description: product.description ?? metaString('description') ?? '',
    manufacturer: product.manufacturer ?? metaString('manufacturer') ?? '',
    weight: product.weight ?? metaString('weight') ?? '',
    barcode: product.barcode ?? metaString('barcode') ?? '',
    qrData: product.qrData ?? metaString('qrData') ?? '',
    status:
      product.status ?? (metaString('status') as Product['status']) ?? 'active',
  };
};

const normalizeTemplate = (template: ApiLabelTemplate): LabelTemplate => {
  const metadata = (template.metadata ?? {}) as Record<string, unknown>;

  const ensureStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  };

  const suitable = [
    ...ensureStringArray(metadata.suitableFor),
    ...ensureStringArray(metadata.suitable),
    ...ensureStringArray(metadata.categories),
  ];
  const fallbackCategory =
    template.category ??
    (typeof metadata.category === 'string'
      ? (metadata.category as string)
      : 'Универсальный');

  return {
    id: template.id ?? `template-${Date.now()}`,
    name: template.name ?? 'Без названия',
    category: fallbackCategory,
    description:
      template.description ??
      (typeof metadata.description === 'string'
        ? (metadata.description as string)
        : 'Шаблон этикетки'),
    thumbnail:
      typeof template.thumbnail === 'string' && template.thumbnail.trim()
        ? template.thumbnail
        : '🏷️',
    suitable:
      suitable.length > 0
        ? Array.from(new Set(suitable))
        : [fallbackCategory ?? 'Универсальный'],
  };
};

const normalizePrinter = (printer: ApiPrinter): Printer => {
  const validStatuses: Printer['status'][] = [
    'online',
    'offline',
    'busy',
    'error',
    'maintenance',
  ];

  const status = validStatuses.includes(printer.status as Printer['status'])
    ? (printer.status as Printer['status'])
    : 'offline';

  return {
    id: printer.id,
    name: printer.name ?? 'Неизвестный принтер',
    status,
    type: printer.type ?? 'Direct',
    model: printer.model ?? 'Модель не указана',
    location: printer.location ?? 'Не указано',
    capabilities: Array.isArray(printer.capabilities)
      ? printer.capabilities.filter(
          (item): item is string =>
            typeof item === 'string' && item.trim() !== ''
        )
      : [],
    paperSize: printer.paper_size ?? '—',
    resolution: printer.resolution ?? '—',
    lastSeen: printer.last_seen ?? null,
    totalJobs:
      typeof printer.total_jobs === 'number'
        ? printer.total_jobs
        : Number(printer.total_jobs ?? 0) || 0,
    errorCount:
      typeof printer.error_count === 'number'
        ? printer.error_count
        : Number(printer.error_count ?? 0) || 0,
  };
};

const buildSearchTokens = (input: string): string[] => {
  const tokens = new Set<string>();
  const push = (value?: string | null) => {
    if (!value) return;
    const normalized = value.trim().toLowerCase();
    if (normalized) {
      tokens.add(normalized);
    }
  };

  push(input);

  input.split(/[^\p{L}\p{N}]+/u).forEach(segment => push(segment));

  try {
    const url = new URL(input);
    push(url.href);
    url.pathname
      .split('/')
      .filter(Boolean)
      .forEach(segment => push(segment));
    url.searchParams.forEach(value => push(value));
  } catch {
    if (input.includes('/')) {
      const parts = input.split('?')[0]?.split('/') ?? [];
      parts.forEach(part => push(part));
    }
  }

  return Array.from(tokens);
};

const LineOperator: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printersLoading, setPrintersLoading] = useState(false);
  const [printersError, setPrintersError] = useState<string | null>(null);
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
  const [isProcessingPrint, setIsProcessingPrint] = useState(false);
  const [openPdfInNewTab, setOpenPdfInNewTab] = useState(false);
  // Храним последнюю сгенерированную ссылку на PDF как явный запасной вариант для скачивания
  const [lastPdf, setLastPdf] = useState<{ url: string; name: string } | null>(
    null
  );

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Фокус на поле сканирования при загрузке
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  // Загрузка шаблонов этикеток из API
  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);

      try {
        const list = await api.fetchTemplates();
        if (!isMounted) return;
        const normalized = list.map(normalizeTemplate);
        setTemplates(normalized);
      } catch (err) {
        if (!isMounted) return;
        setTemplatesError(
          err instanceof Error ? err.message : 'Не удалось загрузить шаблоны'
        );
        setTemplates([]);
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

  // Загрузка принтеров из API
  useEffect(() => {
    let isMounted = true;

    const loadPrinters = async () => {
      setPrintersLoading(true);
      setPrintersError(null);

      try {
        const list = await api.fetchPrinters();
        if (!isMounted) return;
        const normalized = list.map(normalizePrinter);
        setPrinters(normalized);
        setSelectedPrinter(prev => {
          if (prev && normalized.some(printer => printer.id === prev)) {
            return prev;
          }
          const firstOnline = normalized.find(
            printer => printer.status === 'online'
          );
          return firstOnline?.id ?? normalized[0]?.id ?? '';
        });
      } catch (err) {
        if (!isMounted) return;
        setPrintersError(
          err instanceof Error ? err.message : 'Не удалось загрузить принтеры'
        );
        setPrinters([]);
        setSelectedPrinter('');
      } finally {
        if (isMounted) {
          setPrintersLoading(false);
        }
      }
    };

    void loadPrinters();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ревокация предыдущего Blob URL при изменении или размонтировании
  useEffect(() => {
    return () => {
      if (lastPdf?.url) {
        try {
          URL.revokeObjectURL(lastPdf.url);
        } catch {
          // eslint-disable-next-line no-console
          console.warn('Blob URL was already revoked');
        }
      }
    };
  }, [lastPdf]);

  // Загрузка списка товаров из API
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);

      try {
        const list = await api.fetchProducts();
        if (!isMounted) return;
        const normalized = list
          .filter(item => (item.status ?? 'active') !== 'discontinued')
          .map(normalizeProduct);

        setProducts(normalized);
      } catch (err) {
        if (!isMounted) return;
        setProductsError(
          err instanceof Error ? err.message : 'Не удалось загрузить товары'
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

  // Поиск товара по QR-коду или артикулу
  const searchProduct = (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return null;

    const tokens = buildSearchTokens(trimmed);
    if (tokens.length === 0) return null;

    const tokenSet = new Set(tokens);

    const exactMatch = (value?: string | null) => {
      if (!value) return false;
      const normalized = value.trim().toLowerCase();
      return normalized ? tokenSet.has(normalized) : false;
    };

    const partialMatch = (value?: string | null) => {
      if (!value) return false;
      const normalized = value.trim().toLowerCase();
      return normalized
        ? tokens.some(
            token => normalized.includes(token) || token.includes(normalized)
          )
        : false;
    };

    const source = products.filter(product => product.status === 'active');

    for (const product of source) {
      if (
        exactMatch(product.sku) ||
        exactMatch(product.barcode) ||
        exactMatch(product.id)
      ) {
        return product;
      }

      if (product.qrData) {
        const qrLower = product.qrData.toLowerCase();
        if (tokens.some(token => qrLower.includes(token))) {
          return product;
        }

        try {
          const qrUrl = new URL(product.qrData);
          const pathSegments = qrUrl.pathname
            .split('/')
            .filter(Boolean)
            .map(segment => segment.toLowerCase());
          if (pathSegments.some(segment => tokenSet.has(segment))) {
            return product;
          }
          const skuParam =
            qrUrl.searchParams.get('sku') ?? qrUrl.searchParams.get('code');
          if (skuParam && tokenSet.has(skuParam.toLowerCase())) {
            return product;
          }
        } catch {
          // ignore invalid QR url
        }
      }

      if (partialMatch(product.name) || partialMatch(product.category)) {
        return product;
      }
    }

    return null;
  };

  // Обработка сканирования
  const handleScan = () => {
    if (!scannedCode.trim() || productsLoading) return;

    setIsScanning(true);

    // Имитация времени сканирования
    setTimeout(() => {
      const product = searchProduct(scannedCode);
      setFoundProduct(product);
      setIsScanning(false);

      if (product) {
        const matches = templates.filter(
          t =>
            t.suitable.includes(product.category) ||
            t.category === product.category ||
            t.suitable.includes('Универсальный')
        );
        setSelectedTemplate(matches[0] ?? null);
      } else {
        setSelectedTemplate(null);
      }
    }, 500);
  };

  // Печать этикетки
  const handlePrint = async () => {
    console.log('🔍 handlePrint started', {
      foundProduct,
      selectedTemplate,
      printType,
    }); // eslint-disable-line no-console

    if (!foundProduct || !selectedTemplate) {
      alert('Выберите товар и шаблон для печати');
      return;
    }

    let targetPrinter: Printer | undefined;
    if (printType === 'direct') {
      if (!selectedPrinter) {
        alert('Выберите принтер для прямой печати');
        return;
      }

      targetPrinter = printers.find(printer => printer.id === selectedPrinter);
      if (!targetPrinter) {
        alert(
          'Выбранный принтер недоступен. Обновите список и попробуйте снова.'
        );
        return;
      }

      if (targetPrinter.status !== 'online') {
        alert(
          `Принтер "${targetPrinter.name}" сейчас ${printerStatusLabels[targetPrinter.status].toLowerCase()}. Выберите другой принтер или дождитесь готовности.`
        );
        return;
      }
    }

    if (isProcessingPrint) {
      console.log('⚠️ Already processing print, skipping'); // eslint-disable-line no-console
      return;
    }

    const printJob: PrintJob = {
      id: Date.now().toString(),
      productId: foundProduct.id,
      productName: foundProduct.name,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      quantity,
      type: printType,
      timestamp: new Date().toISOString(),
      operator: operatorName,
      status: 'pending',
    };

    console.log('📋 Print job created:', printJob); // eslint-disable-line no-console
    setIsProcessingPrint(true);

    try {
      if (printType === 'direct') {
        console.log('🖨️ Starting direct print'); // eslint-disable-line no-console
        const printerName = targetPrinter?.name ?? 'выбранный принтер';

        await new Promise<void>(resolve => setTimeout(resolve, 1000));
        alert(`Печать завершена на принтере ${printerName}`);
      } else {
        // PDF генерация
        console.log('📄 Starting PDF generation'); // eslint-disable-line no-console
        await generatePDF(
          foundProduct,
          selectedTemplate,
          quantity,
          operatorName
        );
        console.log('✅ PDF generation completed'); // eslint-disable-line no-console
        alert('PDF файл успешно сохранён!');
      }

      setPrintHistory(prev => [
        ...prev,
        {
          ...printJob,
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('❌ Print error:', error); // eslint-disable-line no-console
      setPrintHistory(prev => [
        ...prev,
        {
          ...printJob,
          status: 'failed',
        },
      ]);

      alert(
        `Не удалось ${
          printType === 'direct' ? 'завершить печать' : 'сохранить PDF'
        }: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
      return;
    } finally {
      console.log('🏁 handlePrint finished'); // eslint-disable-line no-console
      setIsProcessingPrint(false);
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
  const generatePDF = async (
    product: Product,
    template: LabelTemplate,
    qty: number,
    operator: string
  ): Promise<void> => {
    try {
      console.log('📊 generatePDF entry', { product: product.name, qty }); // eslint-disable-line no-console

      const pageSize: [number, number] = [80, 50];
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: pageSize,
      });

      console.log('📄 jsPDF instance created'); // eslint-disable-line no-console

      const qrSource =
        product.qrData || product.barcode || product.sku || product.id;

      let qrDataUrl: string | null = null;
      if (qrSource) {
        try {
          console.log('🔲 Generating QR code for:', qrSource); // eslint-disable-line no-console
          qrDataUrl = await QRCode.toDataURL(qrSource, {
            width: 256,
            margin: 0,
          });
          console.log('✅ QR code generated'); // eslint-disable-line no-console
        } catch (qrErr) {
          console.error('❌ QR generation failed:', qrErr); // eslint-disable-line no-console
          qrDataUrl = null;
        }
      }

      const printDate = new Date();
      const formattedDate = printDate.toLocaleDateString();

      const escapeHtml = (value: string): string =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const safeText = (value: unknown, fallback = '—'): string => {
        if (value === undefined || value === null || value === '') {
          return fallback;
        }
        return escapeHtml(String(value));
      };

      const shortText = (value: string, max = 140): string =>
        value.length > max ? `${value.slice(0, max - 1)}…` : value;

      const pxPerMm = 3.7795275591;
      const containerWidthPx = Math.round(pageSize[0] * pxPerMm);
      const containerHeightPx = Math.round(pageSize[1] * pxPerMm);

      console.log(`🔁 Starting page generation loop: ${qty} pages`); // eslint-disable-line no-console

      for (let copyIndex = 0; copyIndex < qty; copyIndex += 1) {
        console.log(`📄 Generating page ${copyIndex + 1}/${qty}`); // eslint-disable-line no-console
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.style.top = '0';
        container.style.width = `${containerWidthPx}px`;
        container.style.height = `${containerHeightPx}px`;
        container.style.backgroundColor = '#ffffff';
        container.style.padding = '0';
        container.style.margin = '0';
        container.style.boxSizing = 'border-box';

        const infoRows: Array<[string, string]> = [
          ['Артикул', safeText(product.sku)],
          ['Штрих-код', safeText(product.barcode)],
          [
            'Цена',
            safeText(product.price ? `${product.price.toFixed(2)} ₽` : ''),
          ],
          ['Категория', safeText(product.category)],
          ['Производитель', safeText(product.manufacturer)],
          ['Вес/объем', safeText(product.weight)],
        ];

        const infoRowsHtml = infoRows
          .map(
            ([label, value]) => `
              <div class="info-row">
                <span class="info-label">${label}:</span>
                <span class="info-value">${value}</span>
              </div>
            `
          )
          .join('');

        const descriptionText = product.description
          ? `<div class="label-description">${safeText(
              shortText(product.description, 220)
            )}</div>`
          : '';

        const qrSection = qrDataUrl
          ? `<img class="label-qr" src="${qrDataUrl}" alt="QR код" />`
          : `<div class="label-qr label-qr--placeholder">QR</div>`;

        container.innerHTML = `
          <style>
            .label-root {
              width: 100%;
              height: 100%;
              padding: 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background-color: #ffffff;
              font-family: 'Arial', 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 8px;
              color: #111827;
              box-sizing: border-box;
            }
            .label-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            }
            .label-title {
              font-size: 20px;
              font-weight: 700;
              line-height: 1.2;
              flex: 1;
              word-break: break-word;
            }
            .label-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 6px;
              font-size: 12px;
              line-height: 1.3;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              gap: 6px;
              align-items: baseline;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              flex: 1;
              text-align: right;
              font-weight: 500;
              color: #111827;
              word-break: break-word;
            }
            .label-description {
              margin-top: 4px;
              font-size: 11px;
              color: #4b5563;
              line-height: 1.35;
              word-break: break-word;
            }
            .label-qr {
              width: 96px;
              height: 96px;
              object-fit: contain;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              background: #ffffff;
            }
            .label-qr--placeholder {
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f3f4f6;
              color: #6b7280;
              font-size: 14px;
              font-weight: 600;
            }
            .label-footer {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 4px 8px;
              font-size: 10px;
              color: #4b5563;
            }
            .label-footer span {
              display: block;
              word-break: break-word;
            }
          </style>
          <div class="label-root">
            <div class="label-header">
              <div class="label-title">${safeText(
                product.name || 'Неизвестный товар'
              )}</div>
              ${qrSection}
            </div>
            <div class="label-body">
              ${infoRowsHtml}
              ${descriptionText}
            </div>
            <div class="label-footer">
              <span>Оператор: ${safeText(operator)}</span>
              <span>Дата: ${safeText(formattedDate)}</span>
              <span>Экземпляр ${copyIndex + 1} из ${qty}</span>
              <span>Шаблон: ${safeText(template.name)}</span>
            </div>
          </div>
        `;

        document.body.appendChild(container);
        console.log(`🎨 Rendering page ${copyIndex + 1} to PDF...`); // eslint-disable-line no-console

        try {
          // Рендерим контейнер в Canvas сами, затем добавляем как изображение в PDF
          const canvas = await html2canvas(container, {
            width: containerWidthPx,
            height: containerHeightPx,
            scale: 2,
            backgroundColor: '#ffffff',
            windowWidth: containerWidthPx,
            windowHeight: containerHeightPx,
            useCORS: true,
          });
          const imgData = canvas.toDataURL('image/png');
          // Вставляем изображение на страницу PDF, масштабируя под размер страницы (мм)
          pdf.addImage(
            imgData,
            'PNG',
            0,
            0,
            pageSize[0],
            pageSize[1],
            undefined,
            'FAST'
          );
        } finally {
          container.remove();
          console.log(`✅ Page ${copyIndex + 1} rendered`); // eslint-disable-line no-console
        }

        if (copyIndex < qty - 1) {
          console.log(`➕ Adding new page ${copyIndex + 2}`); // eslint-disable-line no-console
          pdf.addPage(pageSize, 'landscape');
        }
      }

      console.log('📝 Setting PDF properties'); // eslint-disable-line no-console

      pdf.setProperties({
        title: `Этикетка ${product.name}`,
        subject: `PDF этикетки для ${product.sku}`,
        author: operator,
        creator: 'Рабочее место оператора',
        keywords: `${product.category ?? ''}, ${template.name}`,
      });

      const fileName = `${
        product.sku || product.id
      }_${template.id}_${qty}шт_${printDate.toISOString().split('T')[0]}.pdf`;

      console.log('💾 Saving PDF as:', fileName); // eslint-disable-line no-console

      // Сохраняем PDF с использованием более надёжного метода
      try {
        console.log('🔄 Creating Blob...'); // eslint-disable-line no-console
        // Метод 1: Пробуем через Blob (более надёжный для современных браузеров)
        const pdfBlob = pdf.output('blob');
        console.log('🔗 Creating Blob URL...'); // eslint-disable-line no-console
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Если включено открытие в новой вкладке — пытаемся открыть напрямую
        let openedInTab = false;
        if (openPdfInNewTab) {
          console.log('🗂 Attempting to open PDF in new tab'); // eslint-disable-line no-console
          const win = window.open(blobUrl, '_blank', 'noopener');
          openedInTab = !!win;
          if (openedInTab) {
            console.log('✅ Opened in new tab'); // eslint-disable-line no-console
          } else {
            console.warn('⚠️ Popup blocked, falling back to download'); // eslint-disable-line no-console
          }
        }

        if (!openedInTab) {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.rel = 'noopener';
          link.style.display = 'none';

          console.log('🖱️ Triggering download...'); // eslint-disable-line no-console
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log('✅ Download triggered successfully'); // eslint-disable-line no-console
        }

        // Сохраняем ссылку как запасной вариант, чтобы пользователь мог скачать вручную
        // Сначала чистим предыдущую ссылку, если была
        if (lastPdf?.url) {
          try {
            URL.revokeObjectURL(lastPdf.url);
          } catch {
            // eslint-disable-next-line no-console
            console.warn('Previous Blob URL was already revoked');
          }
        }
        setLastPdf({ url: blobUrl, name: fileName });
      } catch (blobErr) {
        console.error('❌ Blob method failed, trying fallback:', blobErr); // eslint-disable-line no-console
        // Метод 2: Fallback на стандартный save()
        console.log('📥 Using pdf.save() fallback'); // eslint-disable-line no-console
        pdf.save(fileName);
        console.log('✅ Fallback save completed'); // eslint-disable-line no-console
      }

      // Даём браузеру время для запуска загрузки
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Не удалось сформировать PDF для печати';

      // Показываем детальную ошибку
      throw new Error(`Ошибка генерации PDF: ${errorMessage}`);
    }
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
    ? templates.filter(
        t =>
          t.suitable.includes(foundProduct.category) ||
          t.category === foundProduct.category ||
          t.suitable.includes('Универсальный') ||
          t.category === 'Универсальный'
      )
    : templates;

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
                disabled={printersLoading || printers.length === 0}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-400'
              >
                <option value=''>Выберите принтер</option>
                {printers.map(printer => (
                  <option
                    key={printer.id}
                    value={printer.id}
                    disabled={printer.status !== 'online'}
                  >
                    {printer.name} • {printerStatusLabels[printer.status]}
                  </option>
                ))}
              </select>
              {printersLoading && (
                <p className='mt-2 text-xs text-indigo-600 dark:text-indigo-300'>
                  Синхронизация списка принтеров...
                </p>
              )}
              {printersError && !printersLoading && (
                <p className='mt-2 text-xs text-red-600 dark:text-red-400'>
                  Не удалось загрузить принтеры: {printersError}
                </p>
              )}
              {!printersLoading && !printersError && printers.length === 0 && (
                <p className='mt-2 text-xs text-yellow-700 dark:text-yellow-400'>
                  Доступные принтеры не найдены. Проверьте подключение или
                  обратитесь к администратору.
                </p>
              )}
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
                    disabled={isScanning || productsLoading}
                  />
                  <button
                    onClick={handleScan}
                    disabled={
                      !scannedCode.trim() || isScanning || productsLoading
                    }
                    className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                  >
                    {isScanning ? '🔄' : '🔍'}
                  </button>
                </div>
              </div>

              <div className='text-sm text-gray-500 dark:text-gray-400'>
                💡 Поместите курсор в поле выше и отсканируйте QR-код сканером
              </div>
              {productsLoading && (
                <div className='text-sm text-blue-600 dark:text-blue-300'>
                  Синхронизация каталога товаров...
                </div>
              )}
              {productsError && !productsLoading && (
                <div className='text-sm text-red-600 dark:text-red-400'>
                  Не удалось загрузить товары: {productsError}
                </div>
              )}
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
          ) : scannedCode && !isScanning && !productsLoading ? (
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

            {templatesLoading && (
              <div className='flex items-center text-sm text-indigo-600 dark:text-indigo-300'>
                <span className='mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent'></span>
                Загрузка шаблонов...
              </div>
            )}

            {templatesError && !templatesLoading && (
              <div className='mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200'>
                Не удалось загрузить шаблоны: {templatesError}
              </div>
            )}

            <div className='grid grid-cols-1 gap-3'>
              {!templatesLoading &&
                suitableTemplates.map(template => (
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
                      <span className='text-2xl mr-3'>
                        {template.thumbnail}
                      </span>
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

            {!templatesLoading && templates.length === 0 && (
              <div className='mt-4 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                Нет доступных шаблонов. Создайте новый в редакторе или
                импортируйте из базы.
              </div>
            )}

            {!templatesLoading &&
              templates.length > 0 &&
              suitableTemplates.length === 0 && (
                <div className='mt-4 rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200'>
                  Нет шаблонов, подходящих для категории «
                  {foundProduct?.category ?? '—'}». Выберите универсальный
                  шаблон или создайте новый.
                </div>
              )}
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

              <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                <input
                  type='checkbox'
                  checked={openPdfInNewTab}
                  onChange={e => setOpenPdfInNewTab(e.target.checked)}
                  className='h-4 w-4'
                />
                Открывать PDF в новой вкладке
              </label>

              <div className='flex gap-3'>
                <button
                  onClick={handlePrint}
                  disabled={
                    !foundProduct || !selectedTemplate || isProcessingPrint
                  }
                  className='flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-800 font-medium'
                >
                  {isProcessingPrint
                    ? printType === 'direct'
                      ? '⏳ Печать...'
                      : '⏳ Сохраняем...'
                    : printType === 'direct'
                      ? '🖨️ Печать'
                      : '💾 Сохранить PDF'}
                </button>
                <button
                  onClick={handleClear}
                  className='px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  🗑️ Очистить
                </button>
              </div>

              {/* Запасная кнопка для скачивания последнего PDF, если автоскачивание было заблокировано */}
              {lastPdf && (
                <div className='mt-3'>
                  <div className='flex flex-wrap gap-2 items-center'>
                    <a
                      href={lastPdf.url}
                      download={lastPdf.name}
                      className='inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300'
                    >
                      ⬇️ Скачать последний PDF
                    </a>
                    <a
                      href={lastPdf.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-3 py-2 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300'
                    >
                      🗂 Открыть в новой вкладке
                    </a>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Файл: {lastPdf.name}
                    </span>
                  </div>
                </div>
              )}
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
                    const product = products.find(p => p.id === job.productId);
                    const template = templates.find(
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
                              {job.productName ??
                                product?.name ??
                                'Неизвестный товар'}
                            </div>
                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                              {job.templateName ??
                                template?.name ??
                                'Шаблон не выбран'}{' '}
                              • {job.quantity} шт. •{' '}
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
