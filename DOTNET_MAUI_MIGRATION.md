# Миграция проекта Markirovka на .NET MAUI

## 📋 Оглавление
1. [Обзор проекта](#обзор-проекта)
2. [Создание проекта в Visual Studio](#создание-проекта-в-visual-studio)
3. [Архитектура .NET MAUI приложения](#архитектура-net-maui-приложения)
4. [План миграции](#план-миграции)
5. [Структура проекта](#структура-проекта)
6. [Пошаговая инструкция](#пошаговая-инструкция)
7. [Сравнение технологий](#сравнение-технологий)

---

## 🎯 Обзор проекта

### Текущая функциональность (React)

**Модули:**
1. **Products** - управление продуктами (CRUD)
2. **Designer** - редактор этикеток (canvas-based)
3. **Printing** - управление печатью этикеток
4. **LineOperator** - интерфейс оператора производственной линии
5. **Reports** - отчеты и аналитика
6. **Users** - управление пользователями и ролями
7. **SystemStatus** - мониторинг системы

**База данных:**
- **Supabase** (PostgreSQL)
  - Таблицы: products, templates, print_jobs, users
  - Realtime subscriptions
  - Auth (JWT токены)

**Основные сущности:**

```typescript
// Products
interface DatabaseProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  manufacturer: string;
  barcode: string;
  qr_data: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  min_stock: number;
}

// Templates
interface DatabaseTemplate {
  id: string;
  name: string;
  category: string;
  elements: JSON; // Дизайн этикетки
  is_active: boolean;
}

// Print Jobs
interface DatabasePrintJob {
  id: string;
  product_id: string;
  template_id: string;
  quantity: number;
  operator: string;
  status: 'pending' | 'completed' | 'failed';
}

// Users
interface DatabaseUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'worker';
  status: 'active' | 'blocked' | 'pending';
  permissions: string[];
}
```

**Интеграции:**
- Web HID/USB API (сканеры штрих-кодов, принтеры)
- PDF генерация (jsPDF + html2canvas)
- QR код генерация (qrcode)
- Cloudflare R2 (хранение файлов)

---

## 🏗️ Создание проекта в Visual Studio

### Шаг 1: Создание нового проекта

1. Откройте **Visual Studio 2022/2026**
2. Нажмите **Create a new project**
3. В поиске введите: **.NET MAUI App**
4. Выберите **.NET MAUI App** (не Blazor!)
5. Нажмите **Next**

### Шаг 2: Настройка проекта

```
Project name: Markirovka
Location: C:\Projects\Markirovka  (или /home/user/markirovka-maui)
Solution name: Markirovka
Framework: .NET 9.0 (или .NET 8.0 LTS)
```

6. Нажмите **Create**

### Шаг 3: Структура созданного проекта

Visual Studio создаст такую структуру:

```
Markirovka/
├── Platforms/              # Платформо-специфичный код
│   ├── Android/
│   │   ├── MainActivity.cs
│   │   └── AndroidManifest.xml
│   ├── iOS/
│   │   └── Info.plist
│   ├── Windows/
│   │   └── Package.appxmanifest
│   └── MacCatalyst/
├── Resources/              # Ресурсы приложения
│   ├── AppIcon/           # Иконки приложения
│   ├── Fonts/             # Шрифты
│   ├── Images/            # Изображения
│   └── Splash/            # Splash screen
├── App.xaml               # Глобальные стили и ресурсы
├── App.xaml.cs            # Точка входа приложения
├── AppShell.xaml          # Навигация и меню
├── AppShell.xaml.cs
├── MainPage.xaml          # Стартовая страница
├── MainPage.xaml.cs
└── MauiProgram.cs         # DI контейнер и конфигурация
```

---

## 🏛️ Архитектура .NET MAUI приложения

### Архитектурный паттерн: MVVM (Model-View-ViewModel)

```
┌─────────────────────────────────────────┐
│              View (XAML)                │
│  - MainPage.xaml                        │
│  - ProductsPage.xaml                    │
│  - DesignerPage.xaml                    │
└──────────────┬──────────────────────────┘
               │ Data Binding
               ↓
┌──────────────────────────────────────────┐
│         ViewModel (C#)                   │
│  - MainViewModel.cs                      │
│  - ProductsViewModel.cs                  │
│  - DesignerViewModel.cs                  │
│  (Логика презентации, команды)           │
└──────────────┬───────────────────────────┘
               │ Calls
               ↓
┌──────────────────────────────────────────┐
│          Services (C#)                   │
│  - ProductService.cs                     │
│  - PrintService.cs                       │
│  - SupabaseService.cs                    │
│  (Бизнес-логика, API вызовы)             │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│          Models (C#)                     │
│  - Product.cs                            │
│  - PrintJob.cs                           │
│  - User.cs                               │
│  (Модели данных)                         │
└──────────────────────────────────────────┘
```

### Ключевые компоненты .NET MAUI

1. **XAML** - разметка UI (аналог React JSX)
2. **Data Binding** - связывание UI с данными
3. **Commands** - обработка действий пользователя
4. **Dependency Injection** - IoC контейнер
5. **Shell Navigation** - маршрутизация

---

## 📊 План миграции

### Этап 1: Настройка инфраструктуры (1 неделя)

- [ ] Создать проект .NET MAUI
- [ ] Настроить подключение к Supabase
- [ ] Создать базовые модели данных
- [ ] Настроить навигацию (AppShell)
- [ ] Интегрировать NuGet пакеты:
  - `Supabase-csharp` (PostgreSQL клиент)
  - `CommunityToolkit.Mvvm` (MVVM helpers)
  - `CommunityToolkit.Maui` (UI компоненты)
  - `QRCoder` (генерация QR кодов)
  - `ZXing.Net.Maui` (сканирование QR/штрих-кодов)

### Этап 2: Модели и сервисы (1 неделя)

- [ ] Создать модели данных (Product, Template, PrintJob, User)
- [ ] Реализовать SupabaseService (CRUD операции)
- [ ] Реализовать QRService (генерация QR)
- [ ] Реализовать PrintService (печать PDF)
- [ ] Реализовать AuthService (аутентификация)

### Этап 3: UI и ViewModel (2-3 недели)

- [ ] Страница Login + LoginViewModel
- [ ] Страница Products + ProductsViewModel
- [ ] Страница Designer + DesignerViewModel
- [ ] Страница Printing + PrintingViewModel
- [ ] Страница LineOperator + LineOperatorViewModel
- [ ] Страница Reports + ReportsViewModel
- [ ] Страница Users + UsersViewModel
- [ ] Страница SystemStatus + SystemStatusViewModel

### Этап 4: Интеграции (1 неделя)

- [ ] USB/Bluetooth принтеры (через platform-specific API)
- [ ] Камера для сканирования QR (ZXing.Net.Maui)
- [ ] PDF экспорт (PdfSharp или QuestPDF)
- [ ] Realtime обновления (Supabase Realtime)

### Этап 5: Тестирование и деплой (1 неделя)

- [ ] Unit тесты (xUnit)
- [ ] UI тесты (Appium или ручное тестирование)
- [ ] Сборка для Android (APK/AAB)
- [ ] Сборка для Windows (MSIX)
- [ ] Сборка для iOS (IPA)
- [ ] Сборка для macOS (APP)

**Общее время: 6-7 недель**

---

## 📁 Структура проекта (финальная)

```
Markirovka/
│
├── Models/                          # Модели данных
│   ├── Product.cs
│   ├── Template.cs
│   ├── PrintJob.cs
│   ├── User.cs
│   └── Database/
│       └── DatabaseModels.cs
│
├── ViewModels/                      # ViewModel (логика презентации)
│   ├── Base/
│   │   └── BaseViewModel.cs
│   ├── LoginViewModel.cs
│   ├── ProductsViewModel.cs
│   ├── DesignerViewModel.cs
│   ├── PrintingViewModel.cs
│   ├── LineOperatorViewModel.cs
│   ├── ReportsViewModel.cs
│   ├── UsersViewModel.cs
│   └── SystemStatusViewModel.cs
│
├── Views/                           # UI страницы (XAML)
│   ├── LoginPage.xaml
│   ├── ProductsPage.xaml
│   ├── DesignerPage.xaml
│   ├── PrintingPage.xaml
│   ├── LineOperatorPage.xaml
│   ├── ReportsPage.xaml
│   ├── UsersPage.xaml
│   └── SystemStatusPage.xaml
│
├── Services/                        # Бизнес-логика и API
│   ├── ISupabaseService.cs         # Интерфейс
│   ├── SupabaseService.cs          # Реализация
│   ├── IPrintService.cs
│   ├── PrintService.cs
│   ├── IQRService.cs
│   ├── QRService.cs
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IRealtimeService.cs
│   └── RealtimeService.cs
│
├── Controls/                        # Кастомные UI компоненты
│   ├── ProductCard.xaml
│   ├── TemplateCard.xaml
│   └── LabelDesigner.xaml
│
├── Converters/                      # Value Converters для XAML
│   ├── BoolToColorConverter.cs
│   ├── StatusToTextConverter.cs
│   └── DateTimeConverter.cs
│
├── Resources/
│   ├── Styles/
│   │   ├── Colors.xaml             # Цветовая палитра
│   │   └── Styles.xaml             # Глобальные стили
│   ├── Images/
│   └── Fonts/
│
├── Platforms/                       # Платформо-специфичный код
│   ├── Android/
│   │   ├── Services/
│   │   │   └── PrinterService.cs   # Android печать
│   │   └── MainActivity.cs
│   ├── iOS/
│   │   └── Services/
│   │       └── PrinterService.cs   # iOS печать
│   └── Windows/
│       └── Services/
│           └── PrinterService.cs   # Windows печать
│
├── Helpers/                         # Утилиты
│   ├── Constants.cs
│   ├── Settings.cs                 # Preferences API
│   └── Extensions.cs
│
├── App.xaml                         # Глобальные стили
├── App.xaml.cs                      # Точка входа
├── AppShell.xaml                    # Навигация
├── AppShell.xaml.cs
└── MauiProgram.cs                   # DI контейнер
```

---

## 🔧 Пошаговая инструкция

### 1. Установка NuGet пакетов

После создания проекта установите необходимые пакеты:

```bash
# В Package Manager Console (Tools > NuGet Package Manager > Package Manager Console)

# MVVM Toolkit
Install-Package CommunityToolkit.Mvvm

# MAUI Community Toolkit (дополнительные UI компоненты)
Install-Package CommunityToolkit.Maui

# Supabase клиент
Install-Package supabase-csharp
Install-Package Supabase.Realtime

# QR код генерация
Install-Package QRCoder

# Сканирование QR/штрих-кодов
Install-Package ZXing.Net.Maui

# PDF генерация
Install-Package QuestPDF

# JSON сериализация
Install-Package Newtonsoft.Json
```

### 2. Настройка MauiProgram.cs

Регистрируйте сервисы в DI контейнере:

```csharp
using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui;

namespace Markirovka;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit() // Community Toolkit
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Регистрация сервисов
        builder.Services.AddSingleton<ISupabaseService, SupabaseService>();
        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddSingleton<IPrintService, PrintService>();
        builder.Services.AddSingleton<IQRService, QRService>();
        builder.Services.AddSingleton<IRealtimeService, RealtimeService>();

        // Регистрация ViewModels
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<ProductsViewModel>();
        builder.Services.AddTransient<DesignerViewModel>();
        builder.Services.AddTransient<PrintingViewModel>();
        builder.Services.AddTransient<LineOperatorViewModel>();
        builder.Services.AddTransient<ReportsViewModel>();
        builder.Services.AddTransient<UsersViewModel>();
        builder.Services.AddTransient<SystemStatusViewModel>();

        // Регистрация Views
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<ProductsPage>();
        builder.Services.AddTransient<DesignerPage>();
        builder.Services.AddTransient<PrintingPage>();
        builder.Services.AddTransient<LineOperatorPage>();
        builder.Services.AddTransient<ReportsPage>();
        builder.Services.AddTransient<UsersPage>();
        builder.Services.AddTransient<SystemStatusPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
```

### 3. Создание модели Product

**Models/Product.cs:**

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Markirovka.Models;

public class Product : INotifyPropertyChanged
{
    private string _id;
    private string _name;
    private string _sku;
    private decimal _price;
    private string _category;
    private string _description;
    private string _manufacturer;
    private string _weight;
    private string _barcode;
    private string _qrData;
    private ProductStatus _status;
    private int _stock;
    private int _minStock;
    private DateTime _createdAt;
    private DateTime _updatedAt;
    private string _imageUrl;

    public string Id
    {
        get => _id;
        set => SetProperty(ref _id, value);
    }

    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    public string Sku
    {
        get => _sku;
        set => SetProperty(ref _sku, value);
    }

    public decimal Price
    {
        get => _price;
        set => SetProperty(ref _price, value);
    }

    public string Category
    {
        get => _category;
        set => SetProperty(ref _category, value);
    }

    public string Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string Manufacturer
    {
        get => _manufacturer;
        set => SetProperty(ref _manufacturer, value);
    }

    public string Weight
    {
        get => _weight;
        set => SetProperty(ref _weight, value);
    }

    public string Barcode
    {
        get => _barcode;
        set => SetProperty(ref _barcode, value);
    }

    public string QrData
    {
        get => _qrData;
        set => SetProperty(ref _qrData, value);
    }

    public ProductStatus Status
    {
        get => _status;
        set => SetProperty(ref _status, value);
    }

    public int Stock
    {
        get => _stock;
        set => SetProperty(ref _stock, value);
    }

    public int MinStock
    {
        get => _minStock;
        set => SetProperty(ref _minStock, value);
    }

    public DateTime CreatedAt
    {
        get => _createdAt;
        set => SetProperty(ref _createdAt, value);
    }

    public DateTime UpdatedAt
    {
        get => _updatedAt;
        set => SetProperty(ref _updatedAt, value);
    }

    public string ImageUrl
    {
        get => _imageUrl;
        set => SetProperty(ref _imageUrl, value);
    }

    // INotifyPropertyChanged implementation
    public event PropertyChangedEventHandler PropertyChanged;

    protected bool SetProperty<T>(ref T storage, T value, [CallerMemberName] string propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(storage, value))
            return false;

        storage = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

public enum ProductStatus
{
    Active,
    Inactive,
    Discontinued
}
```

### 4. Создание SupabaseService

**Services/ISupabaseService.cs:**

```csharp
using Markirovka.Models;

namespace Markirovka.Services;

public interface ISupabaseService
{
    Task<List<Product>> GetProductsAsync();
    Task<Product> GetProductByIdAsync(string id);
    Task<Product> GetProductBySkuAsync(string sku);
    Task<List<Product>> SearchProductsAsync(string query);
    Task<Product> CreateProductAsync(Product product);
    Task<Product> UpdateProductAsync(string id, Product product);
    Task DeleteProductAsync(string id);
}
```

**Services/SupabaseService.cs:**

```csharp
using Supabase;
using Markirovka.Models;

namespace Markirovka.Services;

public class SupabaseService : ISupabaseService
{
    private readonly Supabase.Client _client;

    public SupabaseService()
    {
        var url = "YOUR_SUPABASE_URL"; // Из настроек
        var key = "YOUR_SUPABASE_ANON_KEY";

        _client = new Supabase.Client(url, key);
    }

    public async Task<List<Product>> GetProductsAsync()
    {
        var response = await _client
            .From<DatabaseProduct>()
            .Select("*")
            .Order("created_at", Supabase.Postgrest.Constants.Ordering.Descending)
            .Get();

        return response.Models.Select(MapToProduct).ToList();
    }

    public async Task<Product> GetProductByIdAsync(string id)
    {
        var response = await _client
            .From<DatabaseProduct>()
            .Where(p => p.Id == id)
            .Single();

        return MapToProduct(response);
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        var dbProduct = MapToDatabaseProduct(product);
        var response = await _client
            .From<DatabaseProduct>()
            .Insert(dbProduct);

        return MapToProduct(response.Model);
    }

    public async Task<Product> UpdateProductAsync(string id, Product product)
    {
        var dbProduct = MapToDatabaseProduct(product);
        dbProduct.UpdatedAt = DateTime.UtcNow;

        var response = await _client
            .From<DatabaseProduct>()
            .Where(p => p.Id == id)
            .Update(dbProduct);

        return MapToProduct(response.Model);
    }

    public async Task DeleteProductAsync(string id)
    {
        await _client
            .From<DatabaseProduct>()
            .Where(p => p.Id == id)
            .Delete();
    }

    // Маппинг
    private Product MapToProduct(DatabaseProduct dbProduct)
    {
        return new Product
        {
            Id = dbProduct.Id,
            Name = dbProduct.Name,
            Sku = dbProduct.Sku,
            Price = dbProduct.Price,
            Category = dbProduct.Category,
            Description = dbProduct.Description,
            Manufacturer = dbProduct.Manufacturer,
            Weight = dbProduct.Weight,
            Barcode = dbProduct.Barcode,
            QrData = dbProduct.QrData,
            Status = Enum.Parse<ProductStatus>(dbProduct.Status, true),
            Stock = dbProduct.Stock,
            MinStock = dbProduct.MinStock,
            CreatedAt = dbProduct.CreatedAt,
            UpdatedAt = dbProduct.UpdatedAt,
            ImageUrl = dbProduct.ImageUrl
        };
    }

    private DatabaseProduct MapToDatabaseProduct(Product product)
    {
        return new DatabaseProduct
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            Price = product.Price,
            Category = product.Category,
            Description = product.Description,
            Manufacturer = product.Manufacturer,
            Weight = product.Weight,
            Barcode = product.Barcode,
            QrData = product.QrData,
            Status = product.Status.ToString().ToLower(),
            Stock = product.Stock,
            MinStock = product.MinStock,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            ImageUrl = product.ImageUrl
        };
    }
}

// Database модель (соответствует Supabase таблице)
[Supabase.Postgrest.Attributes.Table("products")]
public class DatabaseProduct : Supabase.Postgrest.Models.BaseModel
{
    [Supabase.Postgrest.Attributes.PrimaryKey("id")]
    public string Id { get; set; }

    [Supabase.Postgrest.Attributes.Column("name")]
    public string Name { get; set; }

    [Supabase.Postgrest.Attributes.Column("sku")]
    public string Sku { get; set; }

    [Supabase.Postgrest.Attributes.Column("price")]
    public decimal Price { get; set; }

    [Supabase.Postgrest.Attributes.Column("category")]
    public string Category { get; set; }

    [Supabase.Postgrest.Attributes.Column("description")]
    public string Description { get; set; }

    [Supabase.Postgrest.Attributes.Column("manufacturer")]
    public string Manufacturer { get; set; }

    [Supabase.Postgrest.Attributes.Column("weight")]
    public string Weight { get; set; }

    [Supabase.Postgrest.Attributes.Column("barcode")]
    public string Barcode { get; set; }

    [Supabase.Postgrest.Attributes.Column("qr_data")]
    public string QrData { get; set; }

    [Supabase.Postgrest.Attributes.Column("status")]
    public string Status { get; set; }

    [Supabase.Postgrest.Attributes.Column("stock")]
    public int Stock { get; set; }

    [Supabase.Postgrest.Attributes.Column("min_stock")]
    public int MinStock { get; set; }

    [Supabase.Postgrest.Attributes.Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Supabase.Postgrest.Attributes.Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Supabase.Postgrest.Attributes.Column("image_url")]
    public string ImageUrl { get; set; }
}
```

### 5. Создание ProductsViewModel

**ViewModels/ProductsViewModel.cs:**

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using Markirovka.Models;
using Markirovka.Services;

namespace Markirovka.ViewModels;

public partial class ProductsViewModel : ObservableObject
{
    private readonly ISupabaseService _supabaseService;

    [ObservableProperty]
    private ObservableCollection<Product> _products;

    [ObservableProperty]
    private Product _selectedProduct;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _searchText;

    public ProductsViewModel(ISupabaseService supabaseService)
    {
        _supabaseService = supabaseService;
        Products = new ObservableCollection<Product>();
    }

    [RelayCommand]
    private async Task LoadProductsAsync()
    {
        try
        {
            IsLoading = true;
            var products = await _supabaseService.GetProductsAsync();

            Products.Clear();
            foreach (var product in products)
            {
                Products.Add(product);
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Ошибка",
                $"Не удалось загрузить продукты: {ex.Message}", "OK");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SearchProductsAsync()
    {
        if (string.IsNullOrWhiteSpace(SearchText))
        {
            await LoadProductsAsync();
            return;
        }

        try
        {
            IsLoading = true;
            var products = await _supabaseService.SearchProductsAsync(SearchText);

            Products.Clear();
            foreach (var product in products)
            {
                Products.Add(product);
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Ошибка",
                $"Ошибка поиска: {ex.Message}", "OK");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AddProductAsync()
    {
        await Shell.Current.GoToAsync("ProductEditPage");
    }

    [RelayCommand]
    private async Task EditProductAsync(Product product)
    {
        if (product == null) return;

        await Shell.Current.GoToAsync($"ProductEditPage?id={product.Id}");
    }

    [RelayCommand]
    private async Task DeleteProductAsync(Product product)
    {
        if (product == null) return;

        bool confirm = await Shell.Current.DisplayAlert(
            "Подтверждение",
            $"Удалить продукт '{product.Name}'?",
            "Да", "Нет");

        if (!confirm) return;

        try
        {
            await _supabaseService.DeleteProductAsync(product.Id);
            Products.Remove(product);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Ошибка",
                $"Не удалось удалить продукт: {ex.Message}", "OK");
        }
    }
}
```

### 6. Создание ProductsPage (XAML)

**Views/ProductsPage.xaml:**

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:viewmodels="clr-namespace:Markirovka.ViewModels"
             xmlns:models="clr-namespace:Markirovka.Models"
             x:Class="Markirovka.Views.ProductsPage"
             x:DataType="viewmodels:ProductsViewModel"
             Title="Продукты">

    <Grid RowDefinitions="Auto,*,Auto" Padding="16">

        <!-- Панель поиска -->
        <HorizontalStackLayout Grid.Row="0" Spacing="8" Margin="0,0,0,16">
            <SearchBar x:Name="searchBar"
                       Placeholder="Поиск продуктов..."
                       Text="{Binding SearchText}"
                       SearchCommand="{Binding SearchProductsCommand}"
                       HorizontalOptions="FillAndExpand" />

            <Button Text="Добавить"
                    Command="{Binding AddProductCommand}"
                    BackgroundColor="{StaticResource Primary}"
                    TextColor="White" />
        </HorizontalStackLayout>

        <!-- Список продуктов -->
        <CollectionView Grid.Row="1"
                        ItemsSource="{Binding Products}"
                        SelectionMode="Single"
                        SelectedItem="{Binding SelectedProduct}">
            <CollectionView.ItemTemplate>
                <DataTemplate x:DataType="models:Product">
                    <SwipeView>
                        <!-- Swipe actions -->
                        <SwipeView.RightItems>
                            <SwipeItems>
                                <SwipeItem Text="Удалить"
                                           BackgroundColor="Red"
                                           Command="{Binding Source={RelativeSource AncestorType={x:Type viewmodels:ProductsViewModel}}, Path=DeleteProductCommand}"
                                           CommandParameter="{Binding .}" />
                            </SwipeItems>
                        </SwipeView.RightItems>

                        <!-- Карточка продукта -->
                        <Frame Margin="0,4" Padding="12" CornerRadius="8">
                            <Frame.GestureRecognizers>
                                <TapGestureRecognizer
                                    Command="{Binding Source={RelativeSource AncestorType={x:Type viewmodels:ProductsViewModel}}, Path=EditProductCommand}"
                                    CommandParameter="{Binding .}" />
                            </Frame.GestureRecognizers>

                            <Grid ColumnDefinitions="60,*,Auto" ColumnSpacing="12">

                                <!-- Изображение -->
                                <Image Grid.Column="0"
                                       Source="{Binding ImageUrl}"
                                       Aspect="AspectFill"
                                       HeightRequest="60"
                                       WidthRequest="60"
                                       VerticalOptions="Center">
                                    <Image.Clip>
                                        <RoundRectangleGeometry CornerRadius="8" Rect="0,0,60,60" />
                                    </Image.Clip>
                                </Image>

                                <!-- Информация -->
                                <VerticalStackLayout Grid.Column="1" Spacing="4" VerticalOptions="Center">
                                    <Label Text="{Binding Name}"
                                           FontSize="16"
                                           FontAttributes="Bold" />
                                    <Label Text="{Binding Sku}"
                                           FontSize="12"
                                           TextColor="Gray" />
                                    <Label Text="{Binding Category}"
                                           FontSize="12"
                                           TextColor="Gray" />
                                </VerticalStackLayout>

                                <!-- Цена и статус -->
                                <VerticalStackLayout Grid.Column="2" Spacing="4" VerticalOptions="Center">
                                    <Label Text="{Binding Price, StringFormat='{0:C}'}"
                                           FontSize="16"
                                           FontAttributes="Bold"
                                           HorizontalOptions="End" />
                                    <Label Text="{Binding Status}"
                                           FontSize="12"
                                           HorizontalOptions="End" />
                                    <Label Text="{Binding Stock, StringFormat='Остаток: {0}'}"
                                           FontSize="12"
                                           TextColor="Gray"
                                           HorizontalOptions="End" />
                                </VerticalStackLayout>
                            </Grid>
                        </Frame>
                    </SwipeView>
                </DataTemplate>
            </CollectionView.ItemTemplate>

            <CollectionView.EmptyView>
                <VerticalStackLayout HorizontalOptions="Center" VerticalOptions="Center">
                    <Label Text="Нет продуктов"
                           FontSize="18"
                           TextColor="Gray"
                           HorizontalTextAlignment="Center" />
                    <Label Text="Добавьте первый продукт"
                           FontSize="14"
                           TextColor="Gray"
                           HorizontalTextAlignment="Center"
                           Margin="0,8,0,0" />
                </VerticalStackLayout>
            </CollectionView.EmptyView>
        </CollectionView>

        <!-- Индикатор загрузки -->
        <ActivityIndicator Grid.Row="1"
                           IsRunning="{Binding IsLoading}"
                           IsVisible="{Binding IsLoading}"
                           Color="{StaticResource Primary}"
                           VerticalOptions="Center"
                           HorizontalOptions="Center" />

        <!-- Статусная панель -->
        <HorizontalStackLayout Grid.Row="2" Margin="0,16,0,0">
            <Label Text="{Binding Products.Count, StringFormat='Всего продуктов: {0}'}"
                   FontSize="14"
                   TextColor="Gray" />
        </HorizontalStackLayout>
    </Grid>

</ContentPage>
```

**Views/ProductsPage.xaml.cs:**

```csharp
using Markirovka.ViewModels;

namespace Markirovka.Views;

public partial class ProductsPage : ContentPage
{
    private readonly ProductsViewModel _viewModel;

    public ProductsPage(ProductsViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadProductsCommand.ExecuteAsync(null);
    }
}
```

### 7. Настройка навигации в AppShell

**AppShell.xaml:**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<Shell
    x:Class="Markirovka.AppShell"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    xmlns:views="clr-namespace:Markirovka.Views"
    Shell.FlyoutBehavior="Flyout">

    <!-- Flyout Header -->
    <Shell.FlyoutHeader>
        <Grid HeightRequest="200" BackgroundColor="{StaticResource Primary}">
            <VerticalStackLayout Padding="20" VerticalOptions="Center">
                <Label Text="Маркировка"
                       FontSize="24"
                       FontAttributes="Bold"
                       TextColor="White" />
                <Label Text="Система управления этикетками"
                       FontSize="14"
                       TextColor="White"
                       Opacity="0.8" />
            </VerticalStackLayout>
        </Grid>
    </Shell.FlyoutHeader>

    <!-- Главное меню -->
    <FlyoutItem Title="Продукты" Icon="box.png">
        <ShellContent Route="products" ContentTemplate="{DataTemplate views:ProductsPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Дизайнер" Icon="design.png">
        <ShellContent Route="designer" ContentTemplate="{DataTemplate views:DesignerPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Печать" Icon="printer.png">
        <ShellContent Route="printing" ContentTemplate="{DataTemplate views:PrintingPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Оператор линии" Icon="worker.png">
        <ShellContent Route="lineoperator" ContentTemplate="{DataTemplate views:LineOperatorPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Отчеты" Icon="chart.png">
        <ShellContent Route="reports" ContentTemplate="{DataTemplate views:ReportsPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Пользователи" Icon="users.png">
        <ShellContent Route="users" ContentTemplate="{DataTemplate views:UsersPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Статус системы" Icon="settings.png">
        <ShellContent Route="systemstatus" ContentTemplate="{DataTemplate views:SystemStatusPage}" />
    </FlyoutItem>

</Shell>
```

---

## 📊 Сравнение технологий

### React (текущее) vs .NET MAUI

| Аспект | React + TypeScript | .NET MAUI + C# |
|--------|-------------------|----------------|
| **Язык** | TypeScript/JavaScript | C# |
| **UI** | JSX + Tailwind CSS | XAML + Styles |
| **State Management** | Zustand, Context | MVVM, Data Binding |
| **Navigation** | React Router | Shell Navigation |
| **API Calls** | fetch/axios | HttpClient |
| **Database** | Supabase JS SDK | Supabase C# SDK |
| **Dependency Injection** | Manual | Built-in DI |
| **Платформы** | Web (+ Electron/Tauri для desktop) | Windows, macOS, iOS, Android, Linux |
| **Размер приложения** | ~120 МБ (Electron) | ~40-60 МБ (MAUI) |
| **Производительность** | Хорошая (Web), Средняя (Electron) | Отличная (нативная) |
| **Доступ к устройствам** | Ограниченный (Web API) | Полный (Platform API) |
| **Обновления** | Автоматически (Web) | Store или ручная установка |
| **Оффлайн режим** | Требует PWA | Встроенная поддержка |

### Преимущества .NET MAUI для вашего проекта

✅ **Нативная производительность** - быстрая отрисовка UI
✅ **Полный доступ к устройствам** - USB принтеры, камера, файловая система
✅ **Единый код для всех платформ** - Windows, macOS, iOS, Android
✅ **Отличная работа оффлайн** - локальная база данных (SQLite)
✅ **Удобная разработка в Visual Studio** - мощная IDE с дебаггером
✅ **Типобезопасность** - C# со строгой типизацией
✅ **MVVM паттерн** - четкое разделение логики и UI

### Недостатки .NET MAUI

⚠️ **Нужно изучить C# и XAML** - если нет опыта
⚠️ **Нет веб-версии** - только нативные приложения
⚠️ **Больше бойлерплейта** - MVVM требует больше кода
⚠️ **Сложнее обновления** - через магазины приложений

---

## 🚀 Следующие шаги

### Чтобы начать разработку:

1. **Создайте проект** в Visual Studio (см. инструкцию выше)
2. **Установите NuGet пакеты** (см. список)
3. **Создайте базовые модели** (Product, Template, PrintJob, User)
4. **Реализуйте SupabaseService** для работы с БД
5. **Создайте ProductsPage** как первую страницу
6. **Протестируйте на Android эмуляторе** или Windows

### Полезные ресурсы:

- 📚 [Microsoft Learn - .NET MAUI](https://learn.microsoft.com/en-us/dotnet/maui/)
- 📚 [MVVM Community Toolkit](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/)
- 📚 [Supabase C# SDK](https://supabase.com/docs/reference/csharp/introduction)
- 📚 [.NET MAUI Samples](https://github.com/dotnet/maui-samples)

### Контрольные точки:

- [ ] Неделя 1: Создан проект, настроена навигация, подключена БД
- [ ] Неделя 2: Реализованы модели и сервисы
- [ ] Неделя 3: Созданы страницы Products, Login
- [ ] Неделя 4: Созданы страницы Designer, Printing
- [ ] Неделя 5: Созданы страницы LineOperator, Reports, Users
- [ ] Неделя 6: Интеграции (USB, QR, PDF)
- [ ] Неделя 7: Тестирование и деплой

---

## 💡 Рекомендации

1. **Начните с Products страницы** - это самая простая функциональность
2. **Используйте MVVM Toolkit** - упрощает MVVM паттерн
3. **Тестируйте на Windows сначала** - быстрее разработка
4. **Добавляйте платформы постепенно** - сначала Windows, потом Android
5. **Используйте SQLite для оффлайн** - кеширование данных

---

**Готовы начать? Создавайте проект в Visual Studio и следуйте инструкциям! 🎉**
