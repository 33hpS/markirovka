# ТЕХНИЧЕСКОЕ ЗАДАНИЕ (Часть 3 - ФИНАЛЬНАЯ)
# Система управления маркировкой продукции "Маркировка"

---

## 11. ПРЕДЛОЖЕНИЯ ПО УЛУЧШЕНИЮ

### 11.1. Улучшения текущей системы

#### Проблема 1: Отсутствие версионирования шаблонов

**Текущее состояние:**
- Шаблоны перезаписываются при изменении
- Нет истории изменений
- Невозможно откатиться к предыдущей версии

**Решение:**
```sql
-- Добавить поля для версионирования
ALTER TABLE templates ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE templates ADD COLUMN parent_id UUID REFERENCES templates(id);
ALTER TABLE templates ADD COLUMN is_active BOOLEAN DEFAULT true;

-- При создании новой версии:
1. Деактивировать текущую версию (is_active = false)
2. Создать новую запись с version = old_version + 1
3. Сохранить parent_id = old_template_id
```

**Преимущества:**
- ✅ История всех изменений
- ✅ Возможность отката
- ✅ Сравнение версий
- ✅ Аудит изменений

#### Проблема 2: Нет интеграции с весами

**Текущее состояние:**
- Вес вводится вручную
- Возможны ошибки

**Решение:**
- Интеграция с электронными весами по RS-232/USB
- Автоматическое считывание веса при размещении продукта
- Валидация допустимого диапазона веса

```csharp
// Services/ScaleService.cs
public class ScaleService : IScaleService
{
    public async Task<decimal> ReadWeightAsync()
    {
        // Чтение веса с весов через COM порт
        using var serialPort = new SerialPort("COM3", 9600);
        serialPort.Open();

        var data = serialPort.ReadLine();
        serialPort.Close();

        // Парсинг данных (формат зависит от модели весов)
        // Пример: "W: 1.234 kg"
        var weight = ParseWeight(data);

        return weight;
    }
}
```

#### Проблема 3: Отсутствует планировщик партий

**Текущее состояние:**
- Партии создаются вручную
- Нет автоматического планирования
- Нет учета загрузки линий

**Решение:**
- Календарь производства
- Автоматическое распределение партий по линиям
- Оптимизация загрузки
- Предупреждения о конфликтах

```
Алгоритм планирования:
1. Получить список заказов
2. Для каждого заказа:
   - Рассчитать требуемое время производства
   - Найти свободную линию
   - Проверить наличие материалов
   - Назначить смену и оператора
3. Оптимизировать расписание (минимизация простоев)
4. Создать партии
```

#### Проблема 4: Нет мобильного приложения для контролера качества

**Решение:**
- Отдельное мобильное приложение (Android/iOS)
- Сканирование партии
- Чек-лист проверки
- Фотофиксация дефектов
- Голосовые заметки
- Оффлайн режим

### 11.2. Новые функции

#### Функция 1: Интеграция с 1С

**Описание:**
Синхронизация продуктов и остатков с 1С:Предприятие

**Реализация:**
- Экспорт/импорт через XML/JSON
- REST API для интеграции
- Периодическая синхронизация (каждые 15 минут)

```csharp
// Services/Integration/OneCService.cs
public class OneCService
{
    public async Task SyncProductsAsync()
    {
        // Получение данных из 1С через HTTP
        var httpClient = new HttpClient();
        var response = await httpClient.GetAsync("http://1c-server/products/export");
        var json = await response.Content.ReadAsStringAsync();

        var products1C = JsonSerializer.Deserialize<List<Product1C>>(json);

        // Синхронизация с нашей БД
        foreach (var product1C in products1C)
        {
            var existingProduct = await _supabaseService
                .GetProductBySkuAsync(product1C.Sku);

            if (existingProduct != null)
            {
                // Обновление остатков
                existingProduct.Stock = product1C.Stock;
                existingProduct.Price = product1C.Price;
                await _supabaseService.UpdateProductAsync(
                    existingProduct.Id,
                    existingProduct
                );
            }
            else
            {
                // Создание нового продукта
                var newProduct = MapFrom1C(product1C);
                await _supabaseService.CreateProductAsync(newProduct);
            }
        }
    }
}
```

#### Функция 2: AI для контроля качества

**Описание:**
Автоматическое распознавание дефектов на фотографиях

**Реализация:**
- Обучение модели ML на фотографиях брака
- Интеграция TensorFlow Lite для мобильных устройств
- Автоматическая классификация дефектов

```csharp
// Services/AI/DefectDetectionService.cs
public class DefectDetectionService
{
    private readonly Interpreter _interpreter;

    public async Task<DefectAnalysis> AnalyzeImageAsync(byte[] imageData)
    {
        // Предобработка изображения
        var processedImage = PreprocessImage(imageData);

        // Запуск ML модели
        var output = _interpreter.Run(processedImage);

        // Парсинг результата
        var analysis = new DefectAnalysis
        {
            HasDefect = output.Confidence > 0.7,
            DefectType = output.Class,
            Confidence = output.Confidence,
            BoundingBoxes = output.Boxes
        };

        return analysis;
    }
}
```

#### Функция 3: Dashboard для руководителя

**Описание:**
Сводная панель с ключевыми метриками производства

**Метрики:**
- Производительность линий (шт/час)
- Процент брака
- Выполнение плана
- Загрузка оборудования
- Остатки на складе
- Критические уведомления

**Визуализация:**
- Графики в реальном времени
- Тепловые карты загрузки
- Тренды за период
- Прогнозирование

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD РУКОВОДИТЕЛЯ                    19.01.2026 15:30 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    2,450   │  │    1.2%    │  │    94%     │            │
│  │ Произведено│  │    Брак    │  │  Выполнено │            │
│  │ сегодня    │  │            │  │  плана     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                               │
│  ПРОИЗВОДИТЕЛЬНОСТЬ ПО ЛИНИЯМ                                │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Линия 1  [████████████████████▒▒▒] 85% (680 шт/ч)  │     │
│  │ Линия 2  [███████████████████████▒] 92% (740 шт/ч)  │     │
│  │ Линия 3  [████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒] 35% (280 шт/ч)  │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ГРАФИК ПРОИЗВОДСТВА ЗА НЕДЕЛЮ                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │   3000│           ╭╮                                 │     │
│  │       │          ╭╯╰╮                                │     │
│  │   2000│      ╭──╯   ╰─╮                             │     │
│  │       │   ╭─╯         ╰──╮                          │     │
│  │   1000│╭─╯                ╰──╮                       │     │
│  │       └───────────────────────────────────────      │     │
│  │       Пн  Вт  Ср  Чт  Пт  Сб  Вс                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  КРИТИЧЕСКИЕ УВЕДОМЛЕНИЯ                     [3 новых]       │
│  🔴 Линия 3: превышен процент брака (5.2%)                   │
│  🟠 Этикетка А4: низкий остаток (45 шт)                      │
│  🟡 Принтер Zebra ZD421: заканчивается бумага               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Функция 4: Голосовое управление

**Описание:**
Голосовые команды для операторов (hands-free работа)

**Команды:**
- "Начать партию 12345"
- "Зафиксировать брак 5 штук"
- "Напечатать этикетку 10 штук"
- "Завершить партию"

**Реализация:**
```csharp
// Services/VoiceCommandService.cs
using Microsoft.CognitiveServices.Speech;

public class VoiceCommandService
{
    private readonly SpeechRecognizer _recognizer;

    public async Task<string> RecognizeCommandAsync()
    {
        var result = await _recognizer.RecognizeOnceAsync();

        if (result.Reason == ResultReason.RecognizedSpeech)
        {
            return ParseCommand(result.Text);
        }

        return null;
    }

    private string ParseCommand(string text)
    {
        // NLP обработка команды
        if (text.Contains("начать партию"))
        {
            var batchNumber = ExtractBatchNumber(text);
            return $"START_BATCH:{batchNumber}";
        }
        else if (text.Contains("брак"))
        {
            var quantity = ExtractQuantity(text);
            return $"DEFECT:{quantity}";
        }
        // и т.д.

        return "UNKNOWN";
    }
}
```

### 11.3. Оптимизации производительности

#### Оптимизация 1: Кеширование данных

```csharp
// Используем MemoryCache для часто запрашиваемых данных
public class CachedSupabaseService : ISupabaseService
{
    private readonly IMemoryCache _cache;
    private readonly SupabaseService _innerService;

    public async Task<List<Product>> GetProductsAsync()
    {
        var cacheKey = "products_all";

        if (_cache.TryGetValue(cacheKey, out List<Product> products))
        {
            return products;
        }

        products = await _innerService.GetProductsAsync();

        _cache.Set(cacheKey, products, TimeSpan.FromMinutes(5));

        return products;
    }
}
```

#### Оптимизация 2: Пагинация больших списков

```csharp
// Загрузка данных порциями
public async Task<PagedResult<Product>> GetProductsPagedAsync(
    int page = 1,
    int pageSize = 50)
{
    var offset = (page - 1) * pageSize;

    var response = await _client
        .From<Product>()
        .Select("*")
        .Range(offset, offset + pageSize - 1)
        .Get();

    var total = await GetProductsCountAsync();

    return new PagedResult<Product>
    {
        Items = response.Models,
        Page = page,
        PageSize = pageSize,
        TotalCount = total,
        TotalPages = (int)Math.Ceiling(total / (double)pageSize)
    };
}
```

#### Оптимизация 3: Виртуализация списков в UI

```xml
<!-- CollectionView с виртуализацией -->
<CollectionView ItemsSource="{Binding Products}"
                RemainingItemsThreshold="10"
                RemainingItemsThresholdReachedCommand="{Binding LoadMoreCommand}">
    <!-- Загрузка дополнительных элементов при прокрутке -->
</CollectionView>
```

---

## 12. ПЛАН РЕАЛИЗАЦИИ ОТ А ДО Я

### 12.1. Этапы разработки

```
┌─────────────────────────────────────────────────────────────┐
│                   ПЛАН РЕАЛИЗАЦИИ (8 недель)                │
└─────────────────────────────────────────────────────────────┘

ЭТАП 1: ПОДГОТОВКА И НАСТРОЙКА (Неделя 1)
ЭТАП 2: БАЗА ДАННЫХ И МОДЕЛИ (Неделя 2)
ЭТАП 3: СЕРВИСЫ И БИЗНЕС-ЛОГИКА (Недели 3-4)
ЭТАП 4: UI И VIEWMODELS (Недели 5-6)
ЭТАП 5: ИНТЕГРАЦИИ (Неделя 7)
ЭТАП 6: ТЕСТИРОВАНИЕ И ДЕПЛОЙ (Неделя 8)
```

### 12.2. ЭТАП 1: Подготовка и настройка (Неделя 1)

#### День 1: Создание проекта

**Задачи:**
- [ ] Установить Visual Studio 2022/2026
- [ ] Установить .NET 9 SDK
- [ ] Создать новый .NET MAUI проект
- [ ] Настроить Git репозиторий
- [ ] Создать структуру папок

**Команды:**
```bash
# Создание проекта
dotnet new maui -n Markirovka

# Инициализация Git
git init
git add .
git commit -m "Initial commit: Create .NET MAUI project"
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

**Структура проекта:**
```
Markirovka/
├── Models/
├── ViewModels/
├── Views/
├── Services/
├── Controls/
├── Converters/
├── Validators/
├── Resources/
├── Platforms/
├── Helpers/
└── Tests/
```

#### День 2: Установка NuGet пакетов

**Команды:**
```powershell
# В Package Manager Console

# MVVM
Install-Package CommunityToolkit.Mvvm -Version 8.2.2

# MAUI Community Toolkit
Install-Package CommunityToolkit.Maui -Version 7.0.0

# Supabase
Install-Package supabase-csharp -Version 0.18.0
Install-Package Supabase.Realtime -Version 6.0.4

# QR/Barcode
Install-Package QRCoder -Version 1.5.1
Install-Package ZXing.Net.Maui -Version 0.4.0

# PDF
Install-Package QuestPDF -Version 2024.1.0

# Excel
Install-Package ClosedXML -Version 0.102.0

# SQLite (для кеша)
Install-Package sqlite-net-pcl -Version 1.8.116

# Validation
Install-Package FluentValidation -Version 11.9.0

# HTTP
Install-Package Refit -Version 7.0.0

# Logging
Install-Package Serilog -Version 3.1.1
Install-Package Serilog.Sinks.File -Version 5.0.0
```

#### День 3: Настройка MauiProgram.cs

```csharp
using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui;
using Markirovka.Services;
using Markirovka.ViewModels;
using Markirovka.Views;

namespace Markirovka;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // === SERVICES ===

        // Database
        builder.Services.AddSingleton<ISupabaseService, SupabaseService>();
        builder.Services.AddSingleton<ICacheService, CacheService>();

        // Auth
        builder.Services.AddSingleton<IAuthService, AuthService>();

        // Business Logic
        builder.Services.AddSingleton<IPrintService, PrintService>();
        builder.Services.AddSingleton<IQRService, QRService>();
        builder.Services.AddSingleton<IBarcodeService, BarcodeService>();
        builder.Services.AddSingleton<ILabelDesignerService, LabelDesignerService>();
        builder.Services.AddSingleton<IPdfExportService, PdfExportService>();
        builder.Services.AddSingleton<IExcelExportService, ExcelExportService>();
        builder.Services.AddSingleton<IRealtimeService, RealtimeService>();
        builder.Services.AddSingleton<INotificationService, NotificationService>();
        builder.Services.AddSingleton<IAuditService, AuditService>();

        // Platform-specific
#if WINDOWS
        builder.Services.AddSingleton<IPrinterManager, Platforms.Windows.PrinterManager>();
#elif ANDROID
        builder.Services.AddSingleton<IPrinterManager, Platforms.Android.PrinterManager>();
#elif IOS
        builder.Services.AddSingleton<IPrinterManager, Platforms.iOS.PrinterManager>();
#endif

        // === VIEWMODELS ===

        // Auth
        builder.Services.AddTransient<LoginViewModel>();

        // Products
        builder.Services.AddTransient<ProductsViewModel>();
        builder.Services.AddTransient<ProductDetailViewModel>();
        builder.Services.AddTransient<ProductEditViewModel>();

        // Designer
        builder.Services.AddTransient<DesignerViewModel>();
        builder.Services.AddTransient<TemplateListViewModel>();

        // Production
        builder.Services.AddTransient<ProductionViewModel>();
        builder.Services.AddTransient<BatchDetailViewModel>();
        builder.Services.AddTransient<BatchEditViewModel>();

        // Printing
        builder.Services.AddTransient<PrintingViewModel>();
        builder.Services.AddTransient<PrintQueueViewModel>();

        // LineOperator
        builder.Services.AddTransient<LineOperatorViewModel>();

        // Reports
        builder.Services.AddTransient<ReportsViewModel>();

        // Users
        builder.Services.AddTransient<UsersViewModel>();
        builder.Services.AddTransient<UserEditViewModel>();

        // System
        builder.Services.AddTransient<SystemStatusViewModel>();

        // === VIEWS ===

        // Auth
        builder.Services.AddTransient<LoginPage>();

        // Products
        builder.Services.AddTransient<ProductsPage>();
        builder.Services.AddTransient<ProductDetailPage>();
        builder.Services.AddTransient<ProductEditPage>();

        // Designer
        builder.Services.AddTransient<DesignerPage>();
        builder.Services.AddTransient<TemplateListPage>();

        // Production
        builder.Services.AddTransient<ProductionPage>();
        builder.Services.AddTransient<BatchDetailPage>();
        builder.Services.AddTransient<BatchEditPage>();

        // Printing
        builder.Services.AddTransient<PrintingPage>();
        builder.Services.AddTransient<PrintQueuePage>();

        // LineOperator
        builder.Services.AddTransient<LineOperatorPage>();

        // Reports
        builder.Services.AddTransient<ReportsPage>();

        // Users
        builder.Services.AddTransient<UsersPage>();
        builder.Services.AddTransient<UserEditPage>();

        // System
        builder.Services.AddTransient<SystemStatusPage>();

        // === LOGGING ===
#if DEBUG
        builder.Logging.AddDebug();
#endif
        builder.Logging.AddSerilog();

        return builder.Build();
    }
}
```

#### День 4-5: Настройка Supabase и БД

**Supabase Setup:**
1. Создать проект на supabase.com
2. Скопировать URL и anon key
3. Создать таблицы (используя SQL из раздела 7)
4. Настроить RLS политики
5. Включить Realtime

**Конфигурация:**
```csharp
// Helpers/Constants.cs
public static class Constants
{
    public const string SupabaseUrl = "https://xxxxx.supabase.co";
    public const string SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    // Или использовать appsettings.json
    public static string GetSupabaseUrl() =>
        Configuration["Supabase:Url"];
}
```

**Создание SQL скриптов:**
```sql
-- database/schema.sql
-- Запустить в Supabase SQL Editor

-- 1. Создание таблиц (см. раздел 7)
-- 2. Создание индексов
-- 3. Создание триггеров
-- 4. Создание RLS политик
-- 5. Вставка тестовых данных
```

---

### 12.3. ЭТАП 2: База данных и модели (Неделя 2)

#### День 1-2: Создание моделей

**Models/Product.cs** (уже показан ранее)

**Models/Template.cs:**
```csharp
public class Template : BaseModel
{
    private string _name;
    private string _category;
    private int _width;
    private int _height;
    private ObservableCollection<LabelElement> _elements;
    private string _thumbnail;
    private int _version;
    private bool _isActive;

    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    public string Category
    {
        get => _category;
        set => SetProperty(ref _category, value);
    }

    public int Width
    {
        get => _width;
        set => SetProperty(ref _width, value);
    }

    public int Height
    {
        get => _height;
        set => SetProperty(ref _height, value);
    }

    public ObservableCollection<LabelElement> Elements
    {
        get => _elements;
        set => SetProperty(ref _elements, value);
    }

    public string Thumbnail
    {
        get => _thumbnail;
        set => SetProperty(ref _thumbnail, value);
    }

    public int Version
    {
        get => _version;
        set => SetProperty(ref _version, value);
    }

    public bool IsActive
    {
        get => _isActive;
        set => SetProperty(ref _isActive, value);
    }
}
```

**Models/Batch.cs:**
```csharp
public class Batch : BaseModel
{
    private string _batchNumber;
    private Guid _productId;
    private string _productName;
    private int _plannedQuantity;
    private int _producedQuantity;
    private int _defectCount;
    private BatchStatus _status;
    private string _productionLine;
    private DateTime _plannedStart;
    private DateTime? _actualStart;
    private DateTime? _actualEnd;
    private Guid _operatorId;
    private string _operatorName;

    public string BatchNumber
    {
        get => _batchNumber;
        set => SetProperty(ref _batchNumber, value);
    }

    public Guid ProductId
    {
        get => _productId;
        set => SetProperty(ref _productId, value);
    }

    public string ProductName
    {
        get => _productName;
        set => SetProperty(ref _productName, value);
    }

    public int PlannedQuantity
    {
        get => _plannedQuantity;
        set => SetProperty(ref _plannedQuantity, value);
    }

    public int ProducedQuantity
    {
        get => _producedQuantity;
        set
        {
            SetProperty(ref _producedQuantity, value);
            OnPropertyChanged(nameof(Progress));
        }
    }

    public int DefectCount
    {
        get => _defectCount;
        set
        {
            SetProperty(ref _defectCount, value);
            OnPropertyChanged(nameof(DefectRate));
        }
    }

    public BatchStatus Status
    {
        get => _status;
        set => SetProperty(ref _status, value);
    }

    public string ProductionLine
    {
        get => _productionLine;
        set => SetProperty(ref _productionLine, value);
    }

    public DateTime PlannedStart
    {
        get => _plannedStart;
        set => SetProperty(ref _plannedStart, value);
    }

    public DateTime? ActualStart
    {
        get => _actualStart;
        set => SetProperty(ref _actualStart, value);
    }

    public DateTime? ActualEnd
    {
        get => _actualEnd;
        set => SetProperty(ref _actualEnd, value);
    }

    public Guid OperatorId
    {
        get => _operatorId;
        set => SetProperty(ref _operatorId, value);
    }

    public string OperatorName
    {
        get => _operatorName;
        set => SetProperty(ref _operatorName, value);
    }

    // Вычисляемые свойства
    public double Progress =>
        PlannedQuantity > 0
            ? (double)ProducedQuantity / PlannedQuantity * 100
            : 0;

    public double DefectRate =>
        ProducedQuantity > 0
            ? (double)DefectCount / ProducedQuantity * 100
            : 0;
}

public enum BatchStatus
{
    Planning,
    Production,
    QualityCheck,
    Completed,
    Rejected
}
```

#### День 3-4: Создание сервисов БД

**Services/Database/SupabaseService.cs** (основные методы):

```csharp
public class SupabaseService : ISupabaseService
{
    private readonly Supabase.Client _client;

    public SupabaseService()
    {
        // Инициализация (см. ранее)
    }

    // ========== PRODUCTS ==========

    public async Task<List<Product>> GetProductsAsync() { }
    public async Task<Product> GetProductByIdAsync(Guid id) { }
    public async Task<Product> CreateProductAsync(Product product) { }
    public async Task<Product> UpdateProductAsync(Guid id, Product product) { }
    public async Task DeleteProductAsync(Guid id) { }

    // ========== TEMPLATES ==========

    public async Task<List<Template>> GetTemplatesAsync() { }
    public async Task<Template> GetTemplateByIdAsync(Guid id) { }
    public async Task<Template> CreateTemplateAsync(Template template) { }
    public async Task<Template> UpdateTemplateAsync(Guid id, Template template) { }

    // ========== BATCHES ==========

    public async Task<List<Batch>> GetBatchesAsync(
        BatchStatus? status = null,
        DateTime? startDate = null,
        DateTime? endDate = null) { }
    public async Task<Batch> GetBatchByIdAsync(Guid id) { }
    public async Task<Batch> CreateBatchAsync(Batch batch) { }
    public async Task<Batch> UpdateBatchAsync(Guid id, Batch batch) { }

    // ========== PRINT JOBS ==========

    public async Task<List<PrintJob>> GetPrintJobsAsync(
        PrintJobStatus? status = null) { }
    public async Task<PrintJob> CreatePrintJobAsync(PrintJob job) { }
    public async Task<PrintJob> UpdatePrintJobAsync(Guid id, PrintJob job) { }

    // ========== USERS ==========

    public async Task<List<User>> GetUsersAsync() { }
    public async Task<User> GetUserByIdAsync(Guid id) { }
    public async Task<User> UpdateUserAsync(Guid id, User user) { }
}
```

#### День 5: Тестирование БД сервисов

**Tests/Unit/Services/SupabaseServiceTests.cs:**
```csharp
using Xunit;

public class SupabaseServiceTests
{
    private readonly SupabaseService _service;

    public SupabaseServiceTests()
    {
        _service = new SupabaseService();
    }

    [Fact]
    public async Task GetProducts_ReturnsListOfProducts()
    {
        // Act
        var products = await _service.GetProductsAsync();

        // Assert
        Assert.NotNull(products);
        Assert.IsType<List<Product>>(products);
    }

    [Fact]
    public async Task CreateProduct_ValidData_ReturnsCreatedProduct()
    {
        // Arrange
        var product = new Product
        {
            Name = "Test Product",
            Sku = "TST-001",
            Category = "Test",
            Price = 100
        };

        // Act
        var created = await _service.CreateProductAsync(product);

        // Assert
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Test Product", created.Name);

        // Cleanup
        await _service.DeleteProductAsync(created.Id);
    }
}
```

---

### 12.4. ЭТАП 3: Сервисы и бизнес-логика (Недели 3-4)

#### Неделя 3, День 1-2: AuthService

```csharp
// Services/Auth/AuthService.cs
// (см. раздел 10.1)
```

**Тестирование:**
```bash
dotnet test --filter "FullyQualifiedName~AuthServiceTests"
```

#### Неделя 3, День 3-4: PrintService

```csharp
// Services/Printing/PrintService.cs
public class PrintService : IPrintService
{
    private readonly ISupabaseService _supabaseService;
    private readonly IPrinterManager _printerManager;
    private readonly IQRService _qrService;
    private readonly IBarcodeService _barcodeService;

    public async Task<PrintJob> CreatePrintJobAsync(
        Guid productId,
        Guid templateId,
        int quantity,
        Guid printerId)
    {
        // 1. Загрузка данных
        var product = await _supabaseService.GetProductByIdAsync(productId);
        var template = await _supabaseService.GetTemplateByIdAsync(templateId);
        var printer = await _printerManager.GetPrinterByIdAsync(printerId);

        // 2. Валидация
        if (!printer.IsOnline)
            throw new Exception("Printer is offline");

        // 3. Создание задания
        var job = new PrintJob
        {
            ProductId = productId,
            TemplateId = templateId,
            Quantity = quantity,
            PrinterId = printerId,
            Status = PrintJobStatus.Pending,
            Priority = PrintPriority.Normal
        };

        var created = await _supabaseService.CreatePrintJobAsync(job);

        // 4. Запуск печати (если принтер свободен)
        if (await _printerManager.IsPrinterIdleAsync(printerId))
        {
            _ = Task.Run(() => PrintAsync(created.Id));
        }

        return created;
    }

    private async Task PrintAsync(Guid jobId)
    {
        var job = await _supabaseService.GetPrintJobByIdAsync(jobId);
        var product = await _supabaseService.GetProductByIdAsync(job.ProductId);
        var template = await _supabaseService.GetTemplateByIdAsync(job.TemplateId);

        try
        {
            // Обновление статуса
            job.Status = PrintJobStatus.Printing;
            job.StartedAt = DateTime.UtcNow;
            await _supabaseService.UpdatePrintJobAsync(job.Id, job);

            // Генерация этикеток
            for (int i = 0; i < job.Quantity; i++)
            {
                var labelData = await GenerateLabelAsync(product, template);

                var success = await _printerManager.PrintAsync(
                    job.PrinterId,
                    labelData
                );

                if (!success)
                    throw new Exception("Print failed");

                // Обновление прогресса
                job.PrintedQuantity = i + 1;
                await _supabaseService.UpdatePrintJobAsync(job.Id, job);
            }

            // Завершение
            job.Status = PrintJobStatus.Completed;
            job.CompletedAt = DateTime.UtcNow;
            await _supabaseService.UpdatePrintJobAsync(job.Id, job);
        }
        catch (Exception ex)
        {
            job.Status = PrintJobStatus.Failed;
            job.ErrorMessage = ex.Message;
            await _supabaseService.UpdatePrintJobAsync(job.Id, job);
        }
    }

    private async Task<byte[]> GenerateLabelAsync(
        Product product,
        Template template)
    {
        // Создание bitmap
        var bitmap = new SKBitmap(template.Width, template.Height);
        var canvas = new SKCanvas(bitmap);

        // Рендеринг элементов
        foreach (var element in template.Elements)
        {
            switch (element.Type)
            {
                case "text":
                    DrawText(canvas, element, product);
                    break;
                case "qr":
                    DrawQRCode(canvas, element, product);
                    break;
                case "barcode":
                    DrawBarcode(canvas, element, product);
                    break;
            }
        }

        // Конвертация в PNG
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }
}
```

#### Неделя 3, День 5 - Неделя 4: Остальные сервисы

- QRService (генерация QR кодов)
- BarcodeService (генерация штрих-кодов)
- LabelDesignerService (работа с шаблонами)
- PdfExportService (экспорт в PDF)
- ExcelExportService (экспорт в Excel)
- NotificationService (уведомления)
- AuditService (аудит)

---

### 12.5. ЭТАП 4: UI и ViewModels (Недели 5-6)

#### Неделя 5: Основные страницы

**День 1-2: LoginPage + LoginViewModel**

```csharp
// ViewModels/Auth/LoginViewModel.cs
public partial class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;

    [ObservableProperty]
    private string _email;

    [ObservableProperty]
    private string _password;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _rememberMe;

    public LoginViewModel(IAuthService authService)
    {
        _authService = authService;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            await Shell.Current.DisplayAlert("Ошибка", "Заполните все поля", "OK");
            return;
        }

        try
        {
            IsLoading = true;

            var user = await _authService.LoginAsync(Email, Password);

            if (user != null)
            {
                // Переход на главную страницу
                await Shell.Current.GoToAsync("//main");
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Ошибка", ex.Message, "OK");
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

**Views/Auth/LoginPage.xaml** (уже показан ранее в разделе 6.1)

**День 3: ProductsPage + ProductsViewModel** (уже показаны ранее)

**День 4: DesignerPage (базовая версия)**

**День 5: ProductionPage + ProductionViewModel**

#### Неделя 6: Остальные страницы

- PrintingPage
- LineOperatorPage
- ReportsPage
- UsersPage
- SystemStatusPage

---

### 12.6. ЭТАП 5: Интеграции (Неделя 7)

**День 1-2: Интеграция с принтерами** (см. раздел 9.1)

**День 3: Интеграция со сканерами** (см. раздел 9.2)

**День 4: Realtime обновления**

**День 5: Оффлайн режим и синхронизация**

---

### 12.7. ЭТАП 6: Тестирование и деплой (Неделя 8)

#### День 1-3: Тестирование

**Unit тесты:**
```bash
dotnet test Tests/Unit --collect:"XPlat Code Coverage"
```

**Integration тесты:**
```bash
dotnet test Tests/Integration
```

**UI тесты (ручное тестирование):**
- Проверка всех сценариев
- Тестирование на всех платформах

#### День 4-5: Сборка для платформ

**Windows:**
```bash
dotnet publish -f net9.0-windows10.0.19041.0 -c Release
```

**Android:**
```bash
dotnet publish -f net9.0-android -c Release
```

**iOS:**
```bash
dotnet publish -f net9.0-ios -c Release
```

**macOS:**
```bash
dotnet publish -f net9.0-maccatalyst -c Release
```

---

## 13. ТЕСТИРОВАНИЕ

### 13.1. Unit тесты (покрытие > 70%)

**Что тестируем:**
- ViewModels (все команды и свойства)
- Services (все публичные методы)
- Validators (все правила валидации)
- Converters (все конвертации)
- Helpers (все утилиты)

**Пример:**
```csharp
public class ProductsViewModelTests
{
    [Fact]
    public async Task LoadProducts_Success_ProductsNotEmpty()
    {
        // Arrange
        var mockService = new Mock<ISupabaseService>();
        mockService.Setup(s => s.GetProductsAsync())
            .ReturnsAsync(new List<Product> { new Product { Name = "Test" } });

        var vm = new ProductsViewModel(mockService.Object);

        // Act
        await vm.LoadProductsCommand.ExecuteAsync(null);

        // Assert
        Assert.NotEmpty(vm.Products);
    }
}
```

### 13.2. Integration тесты

**Что тестируем:**
- Подключение к Supabase
- CRUD операции
- Realtime подписки

### 13.3. UI тесты

**Ручное тестирование:**
- Все сценарии использования
- Все платформы (Windows, Android, iOS, macOS)

---

## 14. РАЗВЕРТЫВАНИЕ

### 14.1. Windows (MSIX)

```bash
dotnet publish -c Release -f net9.0-windows10.0.19041.0 -p:RuntimeIdentifierOverride=win10-x64 -p:WindowsPackageType=MSIX -p:WindowsAppSDKSelfContained=true
```

### 14.2. Android (APK/AAB)

```bash
dotnet publish -c Release -f net9.0-android -p:AndroidPackageFormat=aab
```

### 14.3. iOS (IPA)

Требуется macOS с Xcode

### 14.4. Распространение

- Windows: Microsoft Store
- Android: Google Play
- iOS: App Store
- Корпоративное: прямая установка

---

## 15. ИТОГО

**Результат:**
- Полнофункциональная система управления маркировкой
- Работает на Windows, macOS, Android, iOS
- Поддержка принтеров, сканеров
- Realtime обновления
- Оффлайн режим
- Отчеты и аналитика

**Метрики:**
- 8 недель разработки
- 15+ модулей
- 50+ экранов
- 100+ unit тестов
- Покрытие кода > 70%

**Команда:**
- 1 Senior .NET разработчик (fulltime)
- 1 UI/UX дизайнер (parttime)
- 1 QA инженер (parttime)

**Бюджет:** (оценка зависит от региона и ставок)

---

**КОНЕЦ ТЕХНИЧЕСКОГО ЗАДАНИЯ**
