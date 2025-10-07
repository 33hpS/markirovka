import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Barcode,
  QrCode,
  Upload,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '../components/ui/alert';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Textarea } from '../components/ui/textarea';
import { dataService } from '../services/dataService';
import type { Product } from '../types/entities';

type ProductWithBathExtras = Product &
  Partial<{
    material: string;
    moisture_resistance: string;
    installation_type: 'подвесная' | 'напольная';
    width_mm: number;
    height_mm: number;
    depth_mm: number;
    finish: string;
    color: string;
    hardware: string;
    soft_close: boolean;
    drawer_count: number;
    sink_type: 'накладная' | 'врезная' | 'столешница';
    mirror_lighting: boolean;
    ip_rating: string;
    warranty_months: number;
    collection: string;
  }>;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    manufacturer: '',
    weight: '',
    dimensions: '',
    expirationDays: '',
    // Доп. поля для мебели ванной
    material: '',
    moisture_resistance: '',
    installation_type: '',
    width_mm: '',
    height_mm: '',
    depth_mm: '',
    finish: '',
    color: '',
    hardware: '',
    soft_close: false,
    drawer_count: '',
    sink_type: '',
    mirror_lighting: false,
    ip_rating: '',
    warranty_months: '',
    collection: '',
  });

  const categories = [
    'Мебель для ванной',
    'Тумбы под раковину',
    'Зеркала и шкафы',
    'Пеналы',
    'Столешницы',
    'Молочные продукты',
    'Мясо и птица',
    'Хлебобулочные изделия',
    'Овощи и фрукты',
    'Напитки',
    'Кондитерские изделия',
    'Консервы',
    'Заморозка',
    'Бытовая химия',
    'Прочее',
  ];

  // Загрузка продуктов при монтировании компонента
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getProducts();
      setProducts(data);
    } catch {
      setError('Ошибка загрузки товаров. Используются тестовые данные.');
      // Fallback к тестовым данным
      setProducts([
        {
          id: '1',
          name: 'Молоко 3.2%',
          sku: 'MILK-032-1L',
          category: 'Молочные продукты',
          description: 'Пастеризованное молоко 3.2% жирности',
          price: 89.99,
          barcode: '4607023123456',
          qr_data: 'MILK-032-1L-2025',
          manufacturer: 'Молочный завод №1',
          weight: '1000г',
          dimensions: '10x6x20см',
          expiration_days: 5,
          status: 'active' as const,
          stock: 100,
          min_stock: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.category) {
      setError('Заполните обязательные поля: название, артикул и категория');
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        description: newProduct.description ?? null,
        price: newProduct.price ? parseFloat(newProduct.price) : null,
        manufacturer: newProduct.manufacturer ?? null,
        weight: newProduct.weight ?? null,
        dimensions: newProduct.dimensions ?? null,
        expirationDays: newProduct.expirationDays
          ? parseInt(newProduct.expirationDays)
          : null,
      };

      const createdProduct = await dataService.createProduct(productData);
      setProducts(prev => [createdProduct, ...prev]);
      setIsAddDialogOpen(false);
      resetForm();
      setError(null);
    } catch {
      setError('Ошибка создания товара');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const updatedData = {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        description: newProduct.description ?? null,
        price: newProduct.price ? parseFloat(newProduct.price) : null,
        manufacturer: newProduct.manufacturer ?? null,
        weight: newProduct.weight ?? null,
        dimensions: newProduct.dimensions ?? null,
        expirationDays: newProduct.expirationDays
          ? parseInt(newProduct.expirationDays)
          : null,
      };

      const updatedProduct = await dataService.updateProduct(
        editingProduct.id,
        updatedData
      );
      setProducts(prev =>
        prev.map(p => (p.id === editingProduct.id ? updatedProduct : p))
      );
      setEditingProduct(null);
      resetForm();
      setError(null);
    } catch {
      setError('Ошибка обновления товара');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      await dataService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setError(null);
    } catch {
      setError('Ошибка удаления товара');
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    try {
      const imageUrl = await dataService.uploadProductImage(productId, file);
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, imageUrl } : p))
      );
      setError(null);
    } catch {
      setError('Ошибка загрузки изображения');
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      sku: '',
      category: '',
      description: '',
      price: '',
      manufacturer: '',
      weight: '',
      dimensions: '',
      expirationDays: '',
      material: '',
      moisture_resistance: '',
      installation_type: '',
      width_mm: '',
      height_mm: '',
      depth_mm: '',
      finish: '',
      color: '',
      hardware: '',
      soft_close: false,
      drawer_count: '',
      sink_type: '',
      mirror_lighting: false,
      ip_rating: '',
      warranty_months: '',
      collection: '',
    });
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    const p = product as ProductWithBathExtras;
    setNewProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description ?? '',
      price: product.price?.toString() ?? '',
      manufacturer: product.manufacturer ?? '',
      weight: product.weight ?? '',
      dimensions: product.dimensions ?? '',
      expirationDays: product.expiration_days?.toString() ?? '',
      material: p.material ?? '',
      moisture_resistance: p.moisture_resistance ?? '',
      installation_type: p.installation_type ?? '',
      width_mm: p.width_mm?.toString() ?? '',
      height_mm: p.height_mm?.toString() ?? '',
      depth_mm: p.depth_mm?.toString() ?? '',
      finish: p.finish ?? '',
      color: p.color ?? '',
      hardware: p.hardware ?? '',
      soft_close: !!p.soft_close,
      drawer_count: p.drawer_count?.toString() ?? '',
      sink_type: p.sink_type ?? '',
      mirror_lighting: !!p.mirror_lighting,
      ip_rating: p.ip_rating ?? '',
      warranty_months: p.warranty_months?.toString() ?? '',
      collection: p.collection ?? '',
    });
  };

  const filteredProducts = products.filter(product => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      !!product.barcode?.includes(searchTerm) ||
      !!product.qr_data?.includes(searchTerm);
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-lg text-gray-600 dark:text-gray-400'>
            Загрузка товаров...
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
            Товары
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Управление каталогом товаров и штрих-кодами
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className='w-4 h-4 mr-2' />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent className='dark:bg-gray-800 max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='dark:text-white'>Новый товар</DialogTitle>
              <DialogDescription className='dark:text-gray-400'>
                Создание нового товара с автоматической генерацией штрих-кода
              </DialogDescription>
            </DialogHeader>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='name' className='dark:text-white'>
                  Название *
                </Label>
                <Input
                  id='name'
                  value={newProduct.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='Название товара'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='sku' className='dark:text-white'>
                  Артикул *
                </Label>
                <Input
                  id='sku'
                  value={newProduct.sku}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder='SKU-001'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='category' className='dark:text-white'>
                  Категория *
                </Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value: string) =>
                    setNewProduct(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className='dark:bg-gray-700 dark:text-white dark:border-gray-600'>
                    <SelectValue placeholder='Выберите категорию' />
                  </SelectTrigger>
                  <SelectContent className='dark:bg-gray-700 dark:border-gray-600'>
                    {categories.map(category => (
                      <SelectItem
                        key={category}
                        value={category}
                        className='dark:text-white dark:hover:bg-gray-600'
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='price' className='dark:text-white'>
                  Цена (₽)
                </Label>
                <Input
                  id='price'
                  type='number'
                  step='0.01'
                  value={newProduct.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({ ...prev, price: e.target.value }))
                  }
                  placeholder='0.00'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='manufacturer' className='dark:text-white'>
                  Производитель
                </Label>
                <Input
                  id='manufacturer'
                  value={newProduct.manufacturer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({
                      ...prev,
                      manufacturer: e.target.value,
                    }))
                  }
                  placeholder='Название производителя'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='weight' className='dark:text-white'>
                  Вес
                </Label>
                <Input
                  id='weight'
                  value={newProduct.weight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({ ...prev, weight: e.target.value }))
                  }
                  placeholder='1000г'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='dimensions' className='dark:text-white'>
                  Размеры
                </Label>
                <Input
                  id='dimensions'
                  value={newProduct.dimensions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({
                      ...prev,
                      dimensions: e.target.value,
                    }))
                  }
                  placeholder='10x6x20см'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div>
                <Label htmlFor='expirationDays' className='dark:text-white'>
                  Срок годности (дни)
                </Label>
                <Input
                  id='expirationDays'
                  type='number'
                  value={newProduct.expirationDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProduct(prev => ({
                      ...prev,
                      expirationDays: e.target.value,
                    }))
                  }
                  placeholder='30'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
              <div className='col-span-2'>
                <Label htmlFor='description' className='dark:text-white'>
                  Описание
                </Label>
                <Textarea
                  id='description'
                  value={newProduct.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewProduct(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder='Описание товара...'
                  className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
                className='dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
              >
                Отмена
              </Button>
              <Button onClick={handleCreateProduct}>Создать товар</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className='mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/50'>
          <AlertCircle className='h-4 w-4 text-orange-600 dark:text-orange-400' />
          <AlertDescription className='text-orange-700 dark:text-orange-300'>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className='mb-6 flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Поиск по названию, артикулу или штрих-коду...'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className='pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-700'
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-full sm:w-48 dark:bg-gray-800 dark:text-white dark:border-gray-700'>
            <SelectValue placeholder='Все категории' />
          </SelectTrigger>
          <SelectContent className='dark:bg-gray-800 dark:border-gray-700'>
            <SelectItem
              value='all'
              className='dark:text-white dark:hover:bg-gray-700'
            >
              Все категории
            </SelectItem>
            {categories.map(category => (
              <SelectItem
                key={category}
                value={category}
                className='dark:text-white dark:hover:bg-gray-700'
              >
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8'>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              Всего товаров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {products.length}
            </div>
          </CardContent>
        </Card>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              Категории
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {new Set(products.map(p => p.category)).size}
            </div>
          </CardContent>
        </Card>
        <Card className='dark:bg-gray-800 dark:border-gray-700'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600 dark:text-gray-400'>
              С изображениями
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {products.filter(p => p.image_url).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='dark:bg-gray-800 dark:border-gray-700'>
        <CardHeader>
          <CardTitle className='dark:text-white'>Список товаров</CardTitle>
          <CardDescription className='dark:text-gray-400'>
            Найдено {filteredProducts.length} товаров
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='dark:border-gray-700'>
                  <TableHead className='dark:text-gray-300'>Товар</TableHead>
                  <TableHead className='dark:text-gray-300'>
                    Категория
                  </TableHead>
                  <TableHead className='dark:text-gray-300'>Артикул</TableHead>
                  <TableHead className='dark:text-gray-300'>
                    Штрих-код
                  </TableHead>
                  <TableHead className='dark:text-gray-300'>QR-код</TableHead>
                  <TableHead className='dark:text-gray-300'>Цена</TableHead>
                  <TableHead className='dark:text-gray-300'>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id} className='dark:border-gray-700'>
                    <TableCell className='font-medium'>
                      <div className='flex items-center space-x-3'>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className='w-10 h-10 rounded object-cover'
                          />
                        ) : (
                          <div className='w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center'>
                            <Package className='w-5 h-5 text-gray-400' />
                          </div>
                        )}
                        <div>
                          <div className='font-medium text-gray-900 dark:text-white'>
                            {product.name}
                          </div>
                          {product.manufacturer && (
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                              {product.manufacturer}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className='dark:border-gray-600 dark:text-gray-300'
                      >
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-mono text-sm dark:text-gray-300'>
                      {product.sku}
                    </TableCell>
                    <TableCell className='font-mono text-sm dark:text-gray-300'>
                      <div className='flex items-center space-x-2'>
                        <Barcode className='w-4 h-4' />
                        <span>{product.barcode}</span>
                      </div>
                    </TableCell>
                    <TableCell className='font-mono text-sm dark:text-gray-300'>
                      <div className='flex items-center space-x-2'>
                        <QrCode className='w-4 h-4' />
                        <span>{product.qr_data}</span>
                      </div>
                    </TableCell>
                    <TableCell className='dark:text-gray-300'>
                      {product.price ? `${product.price.toFixed(2)} ₽` : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='dark:hover:bg-gray-700'
                          >
                            <MoreHorizontal className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='dark:bg-gray-800 dark:border-gray-700'
                        >
                          <DropdownMenuItem
                            onClick={() => startEdit(product)}
                            className='dark:text-white dark:hover:bg-gray-700'
                          >
                            <Edit className='w-4 h-4 mr-2' />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = e => {
                                const file = (e.target as HTMLInputElement)
                                  .files?.[0];
                                if (file) handleImageUpload(product.id, file);
                              };
                              input.click();
                            }}
                            className='dark:text-white dark:hover:bg-gray-700'
                          >
                            <Upload className='w-4 h-4 mr-2' />
                            Загрузить фото
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProduct(product.id)}
                            className='text-red-600 dark:text-red-400 dark:hover:bg-gray-700'
                          >
                            <Trash2 className='w-4 h-4 mr-2' />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог редактирования */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => setEditingProduct(null)}
      >
        <DialogContent className='dark:bg-gray-800 max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='dark:text-white'>
              Редактирование товара
            </DialogTitle>
            <DialogDescription className='dark:text-gray-400'>
              Изменение информации о товаре
            </DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='edit-name' className='dark:text-white'>
                Название *
              </Label>
              <Input
                id='edit-name'
                value={newProduct.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({ ...prev, name: e.target.value }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-sku' className='dark:text-white'>
                Артикул *
              </Label>
              <Input
                id='edit-sku'
                value={newProduct.sku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({ ...prev, sku: e.target.value }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-category' className='dark:text-white'>
                Категория *
              </Label>
              <Select
                value={newProduct.category}
                onValueChange={(value: string) =>
                  setNewProduct(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className='dark:bg-gray-700 dark:text-white dark:border-gray-600'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='dark:bg-gray-700 dark:border-gray-600'>
                  {categories.map(category => (
                    <SelectItem
                      key={category}
                      value={category}
                      className='dark:text-white dark:hover:bg-gray-600'
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='edit-price' className='dark:text-white'>
                Цена (₽)
              </Label>
              <Input
                id='edit-price'
                type='number'
                step='0.01'
                value={newProduct.price}
                onChange={e =>
                  setNewProduct(prev => ({ ...prev, price: e.target.value }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-manufacturer' className='dark:text-white'>
                Производитель
              </Label>
              <Input
                id='edit-manufacturer'
                value={newProduct.manufacturer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({
                    ...prev,
                    manufacturer: e.target.value,
                  }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-weight' className='dark:text-white'>
                Вес
              </Label>
              <Input
                id='edit-weight'
                value={newProduct.weight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({ ...prev, weight: e.target.value }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-dimensions' className='dark:text-white'>
                Размеры
              </Label>
              <Input
                id='edit-dimensions'
                value={newProduct.dimensions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({
                    ...prev,
                    dimensions: e.target.value,
                  }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div>
              <Label htmlFor='edit-expirationDays' className='dark:text-white'>
                Срок годности (дни)
              </Label>
              <Input
                id='edit-expirationDays'
                type='number'
                value={newProduct.expirationDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewProduct(prev => ({
                    ...prev,
                    expirationDays: e.target.value,
                  }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
            <div className='col-span-2'>
              <Label htmlFor='edit-description' className='dark:text-white'>
                Описание
              </Label>
              <Textarea
                id='edit-description'
                value={newProduct.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewProduct(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className='dark:bg-gray-700 dark:text-white dark:border-gray-600'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditingProduct(null)}
              className='dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            >
              Отмена
            </Button>
            <Button onClick={handleUpdateProduct}>Сохранить изменения</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
