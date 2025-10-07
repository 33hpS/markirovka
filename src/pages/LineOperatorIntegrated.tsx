import {
  Camera,
  Search,
  Package,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  ScanLine,
  Download,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { dataService } from '../services/dataService';
import type { Product, Template, PrintJob } from '../types/entities';

interface ScanResult {
  qrCode: string;
  product?: Product;
  timestamp: Date;
  success: boolean;
  error?: string;
}

const LineOperatorPage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [printQuantity, setPrintQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Статистика оператора
  const [stats, setStats] = useState({
    totalScanned: 0,
    successfulScans: 0,
    totalPrinted: 0,
    todayPrinted: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const updateStats = useCallback(() => {
    const today = new Date().toDateString();
    const todayJobs = printJobs.filter(
      job => new Date(job.created_at).toDateString() === today
    );

    setStats({
      totalScanned: scanResults.length,
      successfulScans: scanResults.filter(r => r.success).length,
      totalPrinted: printJobs.reduce((sum, job) => sum + job.quantity, 0),
      todayPrinted: todayJobs.reduce((sum, job) => sum + job.quantity, 0),
    });
  }, [scanResults, printJobs]);

  useEffect(() => {
    updateStats();
  }, [updateStats]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [templatesData, printJobsData] = await Promise.all([
        dataService.getTemplates(),
        dataService.getPrintJobs({ limit: 50 }),
      ]);
      setTemplates(templatesData);
      setPrintJobs(printJobsData);
    } catch {
      setError('Ошибка загрузки данных');
      // Fallback данные
      setTemplates([
        {
          id: '1',
          name: 'Стандартная этикетка',
          description: 'Базовый шаблон для товаров',
          width: 50,
          height: 30,
          elements: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError('Ошибка доступа к камере');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const searchProductByQR = async (qrCode: string): Promise<Product | null> => {
    try {
      const products = await dataService.searchProducts(qrCode);
      return products[0] ?? null;
    } catch {
      return null;
    }
  };

  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;

    const result: ScanResult = {
      qrCode: searchTerm,
      timestamp: new Date(),
      success: false,
    };

    try {
      const product = await searchProductByQR(searchTerm);
      if (product) {
        result.product = product;
        result.success = true;
        setSelectedProduct(product);
      } else {
        result.error = 'Товар не найден';
      }
    } catch {
      result.error = 'Ошибка поиска товара';
    }

    setScanResults(prev => [result, ...prev]);
    setSearchTerm('');
  };

  const simulateQRScan = () => {
    // Симуляция сканирования QR-кода для демонстрации
    const mockQRCodes = [
      'MILK-032-1L-2025',
      'BREAD-WHITE-500G-2025',
      'APPLE-RED-1KG-2025',
      'WATER-SPRING-1.5L-2025',
    ];

    const randomQR =
      mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    if (!randomQR) {
      return;
    }

    handleQRCodeDetected(randomQR);
  };

  const handleQRCodeDetected = async (qrCode: string) => {
    const result: ScanResult = {
      qrCode,
      timestamp: new Date(),
      success: false,
    };

    try {
      const product = await searchProductByQR(qrCode);
      if (product) {
        result.product = product;
        result.success = true;
        setSelectedProduct(product);

        // Остановить камеру после успешного сканирования
        stopCamera();
      } else {
        result.error = 'Товар не найден в системе';
      }
    } catch {
      result.error = 'Ошибка обработки QR-кода';
    }

    setScanResults(prev => [result, ...prev]);
  };

  const handlePrint = async (type: 'direct' | 'pdf') => {
    if (!selectedProduct || !selectedTemplate) {
      setError('Выберите товар и шаблон для печати');
      return;
    }

    try {
      // Создание задания печати
      const printJobData = {
        productId: selectedProduct.id,
        templateId: selectedTemplate,
        quantity: printQuantity,
        type,
        operator: 'Текущий оператор', // В реальном приложении получать из контекста аутентификации
        status: 'completed' as const,
      };

      const newPrintJob = await dataService.createPrintJob(printJobData);
      setPrintJobs(prev => [newPrintJob, ...prev]);

      // Симуляция печати
      if (type === 'direct') {
        alert(`Отправлено ${printQuantity} этикеток на печать`);
      } else {
        alert(`PDF с ${printQuantity} этикетками готов к скачиванию`);
      }

      // Сброс выбора
      setSelectedProduct(null);
      setSelectedTemplate('');
      setPrintQuantity(1);
      setError(null);
    } catch {
      setError('Ошибка печати этикеток');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge
            variant='default'
            className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          >
            Выполнено
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          >
            Ожидание
          </Badge>
        );
      case 'failed':
        return <Badge variant='destructive'>Ошибка</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg text-gray-600 dark:text-gray-400'>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Оператор линии
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Сканирование QR-кодов и печать этикеток
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button
            onClick={isScanning ? stopCamera : startCamera}
            variant={isScanning ? 'destructive' : 'default'}
          >
            <Camera className='w-4 h-4 mr-2' />
            {isScanning ? 'Остановить' : 'Запустить камеру'}
          </Button>
          <Button
            onClick={simulateQRScan}
            variant='outline'
            className='dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          >
            <ScanLine className='w-4 h-4 mr-2' />
            Симуляция сканирования
          </Button>
        </div>
      </div>

      {error && (
        <Alert className='mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/50'>
          <AlertTriangle className='h-4 w-4 text-red-600 dark:text-red-400' />
          <AlertDescription className='text-red-700 dark:text-red-300'>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Статистика */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center'>
              <ScanLine className='w-4 h-4 mr-2' />
              Всего сканирований
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {stats.totalScanned}
            </div>
          </CardContent>
        </Card>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center'>
              <CheckCircle className='w-4 h-4 mr-2' />
              Успешных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {stats.successfulScans}
            </div>
          </CardContent>
        </Card>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center'>
              <Printer className='w-4 h-4 mr-2' />
              Напечатано сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {stats.todayPrinted}
            </div>
          </CardContent>
        </Card>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center'>
              <BarChart3 className='w-4 h-4 mr-2' />
              Всего напечатано
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {stats.totalPrinted}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Сканер */}
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader>
            <CardTitle className='dark:text-white'>QR-сканер</CardTitle>
            <CardDescription className='dark:text-gray-400'>
              Наведите камеру на QR-код товара
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {isScanning ? (
              <div className='relative'>
                <video
                  ref={videoRef}
                  className='w-full h-64 bg-black rounded-lg'
                  autoPlay
                  playsInline
                  aria-label='Предпросмотр камеры'
                >
                  {/* Captions are not applicable for live camera preview */}
                  <track kind='captions' src='' label='' default />
                </video>
                <canvas ref={canvasRef} className='hidden' />
                <div className='absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg opacity-50 pointer-events-none'>
                  <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-blue-500 rounded'></div>
                </div>
              </div>
            ) : (
              <div className='w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
                <div className='text-center'>
                  <Camera className='w-16 h-16 mx-auto text-gray-400 mb-4' />
                  <p className='text-gray-500 dark:text-gray-400'>
                    Камера не активна
                  </p>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <div className='flex space-x-2'>
                <Input
                  placeholder='Или введите QR-код вручную'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleManualSearch()}
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
                <Button
                  onClick={handleManualSearch}
                  variant='outline'
                  className='dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                >
                  <Search className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Информация о товаре и печать */}
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader>
            <CardTitle className='dark:text-white'>Товар для печати</CardTitle>
            <CardDescription className='dark:text-gray-400'>
              Выберите шаблон и количество этикеток
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {selectedProduct ? (
              <div className='p-4 border rounded-lg dark:border-gray-600'>
                <div className='flex items-start space-x-3'>
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className='w-16 h-16 rounded object-cover'
                    />
                  ) : (
                    <div className='w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center'>
                      <Package className='w-8 h-8 text-gray-400' />
                    </div>
                  )}
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                      {selectedProduct.name}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Артикул: {selectedProduct.sku}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      QR: {selectedProduct.qr_data}
                    </p>
                    <Badge
                      variant='outline'
                      className='mt-1 dark:border-gray-600 dark:text-gray-300'
                    >
                      {selectedProduct.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className='p-8 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'>
                <Package className='w-12 h-12 mx-auto mb-2' />
                <p>Отсканируйте QR-код товара</p>
              </div>
            )}

            <div className='space-y-3'>
              <div>
                <label
                  htmlFor='template-select'
                  className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block'
                >
                  Шаблон этикетки
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger
                    id='template-select'
                    className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                  >
                    <SelectValue placeholder='Выберите шаблон' />
                  </SelectTrigger>
                  <SelectContent className='dark:bg-gray-700 dark:border-gray-600'>
                    {templates.map(template => (
                      <SelectItem
                        key={template.id}
                        value={template.id}
                        className='dark:text-white dark:hover:bg-gray-600'
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor='qty-input'
                  className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block'
                >
                  Количество этикеток
                </label>
                <Input
                  id='qty-input'
                  type='number'
                  min='1'
                  max='100'
                  value={printQuantity}
                  onChange={e =>
                    setPrintQuantity(parseInt(e.target.value) || 1)
                  }
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>

              <div className='flex space-x-2 pt-2'>
                <Button
                  onClick={() => handlePrint('direct')}
                  disabled={!selectedProduct || !selectedTemplate}
                  className='flex-1'
                >
                  <Printer className='w-4 h-4 mr-2' />
                  Печать
                </Button>
                <Button
                  onClick={() => handlePrint('pdf')}
                  disabled={!selectedProduct || !selectedTemplate}
                  variant='outline'
                  className='flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                >
                  <Download className='w-4 h-4 mr-2' />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* История сканирований */}
      <Card className='mt-6 dark:bg-gray-800 dark:border-gray-700'>
        <CardHeader>
          <CardTitle className='dark:text-white'>
            История сканирований
          </CardTitle>
          <CardDescription className='dark:text-gray-400'>
            Последние отсканированные QR-коды
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='dark:border-gray-700'>
                  <TableHead className='dark:text-gray-300'>Время</TableHead>
                  <TableHead className='dark:text-gray-300'>QR-код</TableHead>
                  <TableHead className='dark:text-gray-300'>Товар</TableHead>
                  <TableHead className='dark:text-gray-300'>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanResults.slice(0, 10).map((result, index) => (
                  <TableRow key={index} className='dark:border-gray-700'>
                    <TableCell className='dark:text-gray-300'>
                      {result.timestamp.toLocaleTimeString()}
                    </TableCell>
                    <TableCell className='font-mono text-sm dark:text-gray-300'>
                      {result.qrCode}
                    </TableCell>
                    <TableCell className='dark:text-gray-300'>
                      {result.product ? (
                        <div>
                          <div className='font-medium'>
                            {result.product.name}
                          </div>
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {result.product.sku}
                          </div>
                        </div>
                      ) : (
                        <span className='text-gray-500 dark:text-gray-400'>
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.success ? (
                        <Badge
                          variant='default'
                          className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        >
                          <CheckCircle className='w-3 h-3 mr-1' />
                          Успешно
                        </Badge>
                      ) : (
                        <Badge variant='destructive'>
                          <XCircle className='w-3 h-3 mr-1' />
                          Ошибка
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* История печати */}
      <Card className='mt-6 dark:bg-gray-800 dark:border-gray-700'>
        <CardHeader>
          <CardTitle className='dark:text-white'>История печати</CardTitle>
          <CardDescription className='dark:text-gray-400'>
            Последние задания печати
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='dark:border-gray-700'>
                  <TableHead className='dark:text-gray-300'>Время</TableHead>
                  <TableHead className='dark:text-gray-300'>Товар</TableHead>
                  <TableHead className='dark:text-gray-300'>Шаблон</TableHead>
                  <TableHead className='dark:text-gray-300'>
                    Количество
                  </TableHead>
                  <TableHead className='dark:text-gray-300'>Тип</TableHead>
                  <TableHead className='dark:text-gray-300'>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {printJobs.slice(0, 10).map(job => (
                  <TableRow key={job.id} className='dark:border-gray-700'>
                    <TableCell className='dark:text-gray-300'>
                      {new Date(job.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className='dark:text-gray-300'>
                      <div className='font-medium'>
                        {job.productName ?? 'Неизвестный товар'}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        ID: {job.product_id}
                      </div>
                    </TableCell>
                    <TableCell className='dark:text-gray-300'>
                      {job.templateName ?? 'Неизвестный шаблон'}
                    </TableCell>
                    <TableCell className='dark:text-gray-300'>
                      {job.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className='dark:border-gray-600 dark:text-gray-300'
                      >
                        {job.type === 'direct' ? 'Принтер' : 'PDF'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LineOperatorPage;
