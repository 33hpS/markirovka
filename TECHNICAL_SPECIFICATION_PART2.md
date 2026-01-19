# ТЕХНИЧЕСКОЕ ЗАДАНИЕ (Часть 2)
# Система управления маркировкой продукции "Маркировка"

---

## 8. БИЗНЕС-ПРОЦЕССЫ

### 8.1. Процесс создания и печати этикетки

```
┌─────────────────────────────────────────────────────────────────┐
│                  ПРОЦЕСС: Создание и печать этикетки            │
└─────────────────────────────────────────────────────────────────┘

УЧАСТНИКИ:
- Менеджер (создает продукт и шаблон)
- Оператор (печатает этикетки)

┌──────────────┐
│   НАЧАЛО     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 1. Менеджер создает продукт          │
│    - Заполняет карточку продукта     │
│    - Загружает изображение           │
│    - Генерирует QR-код               │
│    - Сохраняет в БД                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 2. Менеджер создает шаблон этикетки  │
│    - Открывает дизайнер              │
│    - Добавляет элементы (текст, QR)  │
│    - Настраивает позиционирование    │
│    - Привязывает к данным продукта   │
│    - Предпросмотр                    │
│    - Сохраняет шаблон                │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 3. Оператор создает задание печати   │
│    - Выбирает продукт                │
│    - Выбирает шаблон                 │
│    - Указывает количество            │
│    - Выбирает принтер                │
│    - Добавляет в очередь             │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 4. Система генерирует этикетки       │
│    - Загружает данные продукта       │
│    - Загружает шаблон                │
│    - Заменяет placeholder'ы          │
│    - Генерирует QR-код               │
│    - Генерирует штрих-код            │
│    - Рендерит в bitmap               │
└──────┬───────────────────────────────┘
       │
       ↓
       ┌─────────────────────┐
       │ Принтер свободен?   │
       └────┬────────────┬───┘
            │ Да         │ Нет
            ↓            ↓
   ┌────────────────┐  ┌─────────────────────┐
   │ 5а. Печать     │  │ 5б. Очередь         │
   │    немедленно  │  │     ожидание        │
   └────┬───────────┘  └────┬────────────────┘
        │                   │
        │  ←────────────────┘
        ↓
┌──────────────────────────────────────┐
│ 6. Отправка на принтер               │
│    FOR i = 1 TO quantity:            │
│      - Отправка команды на принтер   │
│      - Ожидание подтверждения        │
│      - Обновление прогресса          │
└──────┬───────────────────────────────┘
       │
       ↓
       ┌─────────────────────┐
       │ Ошибка печати?      │
       └────┬────────────┬───┘
            │ Нет        │ Да
            ↓            ↓
   ┌────────────────┐  ┌─────────────────────┐
   │ 7а. Успешно    │  │ 7б. Обработка ошибки│
   │   - Статус:    │  │   - Уведомление     │
   │     completed  │  │   - Retry?          │
   │   - Счетчик    │  │   - Статус: failed  │
   │     материалов │  │                     │
   └────┬───────────┘  └─────┬───────────────┘
        │                    │
        ↓                    ↓
┌──────────────────────────────────────┐
│ 8. Логирование                       │
│    - История печати                  │
│    - Audit log                       │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────┐
│    КОНЕЦ     │
└──────────────┘
```

### 8.2. Процесс производства партии

```
┌─────────────────────────────────────────────────────────────────┐
│              ПРОЦЕСС: Производство партии продукции             │
└─────────────────────────────────────────────────────────────────┘

УЧАСТНИКИ:
- Менеджер (планирование)
- Оператор линии (выполнение)
- Контролер качества (проверка)

┌──────────────┐
│   НАЧАЛО     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 1. ПЛАНИРОВАНИЕ                      │
│    Менеджер создает партию:          │
│    - Выбирает продукт                │
│    - Указывает количество            │
│    - Выбирает линию                  │
│    - Назначает оператора             │
│    - Планирует дату/смену            │
│                                      │
│    Статус: planning                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 2. ПОДГОТОВКА                        │
│    Система проверяет:                │
│    ✓ Наличие материалов              │
│    ✓ Наличие шаблона этикетки        │
│    ✓ Свободна ли линия               │
│    ✓ Готов ли принтер                │
│                                      │
│    Уведомление оператору             │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 3. ЗАПУСК ПРОИЗВОДСТВА               │
│    Оператор:                         │
│    - Получает уведомление            │
│    - Открывает партию                │
│    - Нажимает "Начать производство"  │
│                                      │
│    Система:                          │
│    - Статус: production              │
│    - actual_start = NOW()            │
│    - Запускает таймер                │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 4. ПРОИЗВОДСТВО (цикл)               │
│    REPEAT пока produced < planned:   │
│                                      │
│      Оператор:                       │
│      - Производит продукцию          │
│      - Сканирует готовую единицу     │
│      ИЛИ                             │
│      - Вводит количество вручную     │
│                                      │
│      Система:                        │
│      - produced += quantity          │
│      - progress = produced/planned   │
│      - Обновление UI                 │
│                                      │
│      Если брак:                      │
│      - Фиксация количества брака     │
│      - Указание причины              │
│      - defect_count += quantity      │
│      - Проверка % брака              │
│                                      │
│      Если брак > 5%:                 │
│      - Уведомление менеджеру         │
│      - Возможная остановка           │
│                                      │
│    END REPEAT                        │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 5. ЗАВЕРШЕНИЕ ПРОИЗВОДСТВА           │
│    Когда produced >= planned:        │
│    - Статус: quality-check           │
│    - actual_end = NOW()              │
│    - Уведомление контролеру качества│
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 6. КОНТРОЛЬ КАЧЕСТВА                 │
│    Контролер:                        │
│    - Проверяет образцы партии        │
│    - Проверяет документацию          │
│    - Принимает решение               │
└──────┬───────────────────────────────┘
       │
       ↓
       ┌─────────────────────┐
       │ Партия принята?     │
       └────┬────────────┬───┘
            │ Да         │ Нет
            ↓            ↓
┌────────────────────┐  ┌─────────────────────────┐
│ 7а. ПРИНЯТА        │  │ 7б. ОТКЛОНЕНА           │
│   - Статус:        │  │   - Статус: rejected    │
│     completed      │  │   - rejection_reason    │
│   - qc_passed=true │  │   - qc_passed=false     │
│   - Обновление     │  │   - Уведомление:        │
│     остатков:      │  │     - Оператору         │
│     stock +=       │  │     - Менеджеру         │
│     produced       │  │   - Возможность повтора │
└────┬───────────────┘  └─────┬───────────────────┘
     │                         │
     ↓                         ↓
┌──────────────────────────────────────┐
│ 8. ПЕЧАТЬ ЭТИКЕТОК (если принята)    │
│    Автоматическое создание задания:  │
│    - product_id = batch.product      │
│    - quantity = batch.produced       │
│    - batch_id = batch.id             │
│    - Добавление в очередь печати     │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 9. ЛОГИРОВАНИЕ                       │
│    - История партии                  │
│    - Audit log всех изменений        │
│    - Статистика по производству      │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────┐
│    КОНЕЦ     │
└──────────────┘

МЕТРИКИ:
- Время производства = actual_end - actual_start
- Производительность = produced / время
- Процент брака = (defect_count / produced) * 100
- Выполнение плана = (produced / planned) * 100
```

### 8.3. Процесс работы оператора линии

```
┌─────────────────────────────────────────────────────────────────┐
│           ПРОЦЕСС: Рабочий день оператора линии                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   НАЧАЛО     │
│  (Вход)      │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 1. АВТОРИЗАЦИЯ                       │
│    - Оператор вводит логин/пароль    │
│    - Система проверяет роль=worker   │
│    - Переход на LineOperatorPage     │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 2. ПРОСМОТР ЗАДАНИЙ                  │
│    Оператор видит:                   │
│    - Активные партии для его линии   │
│    - Статус каждой партии            │
│    - Плановое количество             │
│    - Текущий прогресс                │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 3. ВЫБОР ПАРТИИ                      │
│    Оператор:                         │
│    - Выбирает партию из списка       │
│    - Нажимает "Начать работу"        │
│                                      │
│    Если партия впервые:              │
│    - actual_start = NOW()            │
│    - status = production             │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 4. РАБОТА С ПАРТИЕЙ (основной цикл)  │
│                                      │
│    ┌─────────────────────────────┐   │
│    │ 4.1 Производство единицы    │   │
│    │     продукции               │   │
│    └──────────┬──────────────────┘   │
│               ↓                      │
│    ┌─────────────────────────────┐   │
│    │ 4.2 Сканирование QR/штрих-  │   │
│    │     кода для подтверждения  │   │
│    │     Варианты:               │   │
│    │     • USB сканер            │   │
│    │     • Камера устройства     │   │
│    │     • Ручной ввод           │   │
│    └──────────┬──────────────────┘   │
│               ↓                      │
│    ┌─────────────────────────────┐   │
│    │ 4.3 Система проверяет:      │   │
│    │     • Продукт совпадает?    │   │
│    │     • Продукт из партии?    │   │
│    └──────────┬──────────────────┘   │
│               ↓                      │
│          ┌─────────┐                 │
│          │ Верно?  │                 │
│          └──┬───┬──┘                 │
│             │Да │Нет                 │
│             ↓   ↓                    │
│    ┌───────────┐ ┌──────────────┐   │
│    │4.4 Принять│ │4.5 Ошибка    │   │
│    │produced++ │ │   Уведомление│   │
│    │progress++ │ │   Повтор     │   │
│    └───────────┘ └──────────────┘   │
│                                      │
│    ┌─────────────────────────────┐   │
│    │ 4.6 Обнаружен брак?         │   │
│    │     [Кнопка "Брак"]         │   │
│    └──────────┬──────────────────┘   │
│               ↓                      │
│    ┌─────────────────────────────┐   │
│    │ 4.7 Фиксация брака:         │   │
│    │     • Количество            │   │
│    │     • Причина (из списка)   │   │
│    │     • Фото (опционально)    │   │
│    │     defect_count++          │   │
│    └──────────┬──────────────────┘   │
│               ↓                      │
│    ┌─────────────────────────────┐   │
│    │ 4.8 Быстрая печать этикетки │   │
│    │     [Кнопка "Печать"]       │   │
│    │     • Ближайший принтер     │   │
│    │     • Стандартный шаблон    │   │
│    └─────────────────────────────┘   │
│                                      │
│    REPEAT цикл пока не завершено     │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 5. ЗАВЕРШЕНИЕ ПАРТИИ                 │
│    Когда produced >= planned:        │
│    - Кнопка "Передать на контроль"   │
│    - Оператор добавляет примечания   │
│    - status = quality-check          │
│    - Уведомление контролеру          │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 6. ПЕРЕКЛЮЧЕНИЕ НА СЛЕДУЮЩУЮ ПАРТИЮ  │
│    - Возврат к списку заданий        │
│    - Выбор новой партии              │
│    ИЛИ                               │
│    - Выход (окончание смены)         │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────┐
│    КОНЕЦ     │
│   (Выход)    │
└──────────────┘

ОСОБЕННОСТИ ИНТЕРФЕЙСА:
- Крупные кнопки (легко нажимать)
- Минимум текста
- Визуальные индикаторы (цвета, иконки)
- Звуковые сигналы (успех/ошибка)
- Работа одной рукой (вторая держит сканер)
```

### 8.4. Процесс контроля низких остатков

```
┌─────────────────────────────────────────────────────────────────┐
│           ПРОЦЕСС: Контроль и уведомление о низких остатках     │
└─────────────────────────────────────────────────────────────────┘

ТРИГГЕР:
- Изменение stock продукта
- Ежедневная проверка (cron job)

┌──────────────┐
│   ТРИГГЕР    │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 1. ПРОВЕРКА УСЛОВИЯ                  │
│    FOR each product IN products:     │
│      IF stock < min_stock:           │
│        → Низкий остаток              │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 2. СОЗДАНИЕ УВЕДОМЛЕНИЯ              │
│    INSERT INTO notifications:        │
│      type: 'low_stock'               │
│      title: 'Низкий остаток'         │
│      message: '{product.name}:       │
│                остаток {stock} шт,   │
│                минимум {min_stock}'  │
│      priority: 'high'                │
│      recipients: [managers, admins]  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 3. ОТПРАВКА УВЕДОМЛЕНИЙ              │
│    - In-app уведомление              │
│    - Email (опционально)             │
│    - Push (на мобильные устройства)  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 4. ПОЛУЧЕНИЕ МЕНЕДЖЕРОМ              │
│    Менеджер видит:                   │
│    - Значок уведомления (красный)    │
│    - Количество непрочитанных        │
│    - Открывает список уведомлений    │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ 5. ДЕЙСТВИЯ МЕНЕДЖЕРА                │
│    Опции:                            │
│    а) Создать партию производства    │
│    б) Заказать у поставщика          │
│    в) Изменить min_stock             │
│    г) Отметить как прочитанное       │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────┐
│    КОНЕЦ     │
└──────────────┘
```

---

## 9. ИНТЕГРАЦИИ

### 9.1. Интеграция с принтерами

#### Поддерживаемые модели

| Производитель | Модели | Протокол | Интерфейс |
|--------------|---------|----------|-----------|
| **Zebra** | ZD410, ZD420, ZD421, ZD620 | ZPL II, EPL2 | USB, Ethernet, Bluetooth |
| **Datamax** | M-4206, M-4210, M-4308 | DPL, DMX | USB, Ethernet |
| **TSC** | TTP-244 Pro, TTP-345, TE-200 | TSPL, TSPL2 | USB, Ethernet |
| **АТОЛ** | BP21, BP41 | ESC/POS | USB, Ethernet |

#### Архитектура интеграции

```
┌─────────────────────────────────────────────────────────────┐
│                    .NET MAUI Application                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           IPrintService (Interface)                │    │
│  │  - Task PrintLabelAsync(...)                       │    │
│  │  - Task<List<Printer>> GetPrintersAsync()          │    │
│  │  - Task<PrinterStatus> GetStatusAsync(id)          │    │
│  └─────────────────┬──────────────────────────────────┘    │
│                    │                                         │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Platform-Specific Implementation            │    │
│  └─────────┬──────────┬──────────┬────────────┬───────┘    │
└────────────┼──────────┼──────────┼────────────┼────────────┘
             │          │          │            │
    ┌────────┴─┐   ┌───┴────┐  ┌──┴───────┐  ┌─┴─────────┐
    │ Windows  │   │ macOS  │  │ Android  │  │    iOS    │
    └────┬─────┘   └───┬────┘  └──┬───────┘  └─┬─────────┘
         │             │           │            │
         ↓             ↓           ↓            ↓
    ┌─────────┐   ┌────────┐  ┌────────┐  ┌──────────┐
    │Win32 API│   │ CUPS   │  │USB Host│  │AirPrint  │
    │  USB    │   │ macOS  │  │ API    │  │ iOS Print│
    └─────────┘   └────────┘  └────────┘  └──────────┘
         │             │           │            │
         ↓             ↓           ↓            ↓
    ┌──────────────────────────────────────────────────┐
    │               Physical Printers                   │
    │  [Zebra] [Datamax] [TSC] [АТОЛ] ...              │
    └──────────────────────────────────────────────────┘
```

#### Пример кода (Windows)

```csharp
// Platforms/Windows/Services/PrinterService.cs
using System.Drawing;
using System.Drawing.Printing;

public class WindowsPrinterService : IPrintService
{
    public async Task<List<Printer>> GetPrintersAsync()
    {
        var printers = new List<Printer>();

        foreach (string printerName in PrinterSettings.InstalledPrinters)
        {
            var settings = new PrinterSettings { PrinterName = printerName };

            printers.Add(new Printer
            {
                Name = printerName,
                Status = settings.IsValid ? PrinterStatus.Online : PrinterStatus.Offline,
                ConnectionType = "USB", // Упрощенно
                SupportedFormats = new[] { "ZPL", "EPL", "ESC/POS" }
            });
        }

        return printers;
    }

    public async Task<bool> PrintLabelAsync(PrintJob job, byte[] labelData)
    {
        try
        {
            var printDocument = new PrintDocument
            {
                PrinterSettings = new PrinterSettings
                {
                    PrinterName = job.PrinterName
                }
            };

            printDocument.PrintPage += (sender, e) =>
            {
                // Отрисовка этикетки из bitmap
                using var ms = new MemoryStream(labelData);
                var image = Image.FromStream(ms);
                e.Graphics.DrawImage(image, 0, 0);
            };

            printDocument.Print();
            return true;
        }
        catch (Exception ex)
        {
            Log.Error($"Print error: {ex.Message}");
            return false;
        }
    }

    // Отправка ZPL команд напрямую
    public async Task<bool> PrintZplAsync(string printerName, string zplCommands)
    {
        try
        {
            // Открытие COM порта или сокета
            using var client = new TcpClient(printerIp, 9100); // Для сетевых принтеров
            using var stream = client.GetStream();

            var bytes = Encoding.UTF8.GetBytes(zplCommands);
            await stream.WriteAsync(bytes, 0, bytes.Length);

            return true;
        }
        catch
        {
            return false;
        }
    }
}
```

#### ZPL команды (пример для Zebra)

```zpl
^XA                        // Начало этикетки
^FO50,50                   // Позиция (x=50, y=50)
^A0N,40,40                 // Шрифт размер 40x40
^FDНазвание продукта^FS    // Текст
^FO50,100
^BCN,100,Y,N,N             // Штрих-код Code128, высота 100
^FD1234567890^FS           // Данные штрих-кода
^FO200,50
^BQN,2,5                   // QR код
^FDQA,http://example.com^FS // Данные QR
^XZ                        // Конец этикетки
```

### 9.2. Интеграция со сканерами

#### Типы сканеров

1. **USB HID сканеры**
   - Работают как клавиатура
   - Не требуют драйверов
   - Автоматический ввод данных

2. **Bluetooth сканеры**
   - Беспроводные
   - Подключение через Bluetooth API

3. **Камера устройства**
   - Использование ZXing.Net.Maui
   - Сканирование через камеру смартфона/планшета

#### Пример кода (Android)

```csharp
// Platforms/Android/Services/ScannerService.cs
using ZXing.Net.Maui;

public class AndroidScannerService : IScannerService
{
    private CameraBarcodeReaderView _cameraView;

    public async Task<string> ScanBarcodeAsync()
    {
        var tcs = new TaskCompletionSource<string>();

        _cameraView = new CameraBarcodeReaderView
        {
            IsDetecting = true
        };

        _cameraView.BarcodesDetected += (sender, e) =>
        {
            if (e.Results?.Length > 0)
            {
                var barcode = e.Results[0].Value;
                tcs.SetResult(barcode);
            }
        };

        return await tcs.Task;
    }

    public async Task<List<Scanner>> GetConnectedScannersAsync()
    {
        // Поиск Bluetooth устройств
        var bluetoothAdapter = BluetoothAdapter.DefaultAdapter;
        var pairedDevices = bluetoothAdapter.BondedDevices;

        var scanners = new List<Scanner>();

        foreach (var device in pairedDevices)
        {
            if (device.Name.Contains("Scanner") || device.Name.Contains("Barcode"))
            {
                scanners.Add(new Scanner
                {
                    Id = device.Address,
                    Name = device.Name,
                    Type = ScannerType.Bluetooth,
                    IsConnected = device.BondState == Bond.Bonded
                });
            }
        }

        return scanners;
    }
}
```

### 9.3. Интеграция с Supabase

#### Настройка клиента

```csharp
// Services/Database/SupabaseService.cs
using Supabase;

public class SupabaseService : ISupabaseService
{
    private readonly Supabase.Client _client;

    public SupabaseService()
    {
        var url = "https://your-project.supabase.co";
        var key = "your-anon-key";

        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = true,
            // Локальное хранилище для оффлайн режима
            SessionHandler = new MauiSessionHandler()
        };

        _client = new Supabase.Client(url, key, options);
        await _client.InitializeAsync();
    }

    // CRUD операции
    public async Task<List<Product>> GetProductsAsync()
    {
        var response = await _client
            .From<DatabaseProduct>()
            .Select("*")
            .Order("created_at", Postgrest.Constants.Ordering.Descending)
            .Get();

        return response.Models.Select(MapToProduct).ToList();
    }

    // Realtime подписки
    public void SubscribeToProductChanges(Action<Product> onInsert, Action<Product> onUpdate)
    {
        _client.Realtime
            .Channel("products")
            .On<DatabaseProduct>(ChannelEventType.Insert, (sender, product) =>
            {
                onInsert(MapToProduct(product.Model));
            })
            .On<DatabaseProduct>(ChannelEventType.Update, (sender, product) =>
            {
                onUpdate(MapToProduct(product.Model));
            })
            .Subscribe();
    }
}
```

#### Оффлайн поддержка

```csharp
// Services/Cache/CacheService.cs
using SQLite;

public class CacheService : ICacheService
{
    private readonly SQLiteAsyncConnection _database;

    public CacheService()
    {
        var dbPath = Path.Combine(
            FileSystem.AppDataDirectory,
            "markirovka.db3"
        );

        _database = new SQLiteAsyncConnection(dbPath);
        await _database.CreateTableAsync<Product>();
        await _database.CreateTableAsync<Template>();
    }

    // Кеширование продуктов
    public async Task CacheProductsAsync(List<Product> products)
    {
        await _database.DeleteAllAsync<Product>();
        await _database.InsertAllAsync(products);
    }

    public async Task<List<Product>> GetCachedProductsAsync()
    {
        return await _database.Table<Product>().ToListAsync();
    }

    // Синхронизация при восстановлении связи
    public async Task SyncAsync()
    {
        if (!IsOnline())
            return;

        // Получение данных с сервера
        var serverProducts = await _supabaseService.GetProductsAsync();

        // Получение локальных изменений
        var localChanges = await _database
            .Table<Product>()
            .Where(p => p.IsDirty)
            .ToListAsync();

        // Отправка локальных изменений на сервер
        foreach (var product in localChanges)
        {
            await _supabaseService.UpdateProductAsync(product.Id, product);
            product.IsDirty = false;
            await _database.UpdateAsync(product);
        }

        // Обновление кеша
        await CacheProductsAsync(serverProducts);
    }
}
```

### 9.4. Экспорт в PDF

```csharp
// Services/Export/PdfExportService.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;

public class PdfExportService : IPdfExportService
{
    public async Task<byte[]> ExportLabelsToPdfAsync(
        List<Product> products,
        Template template)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(10);

                page.Content().Column(column =>
                {
                    // Сетка этикеток (3x8 на A4)
                    for (int row = 0; row < 8; row++)
                    {
                        column.Item().Row(r =>
                        {
                            for (int col = 0; col < 3; col++)
                            {
                                int index = row * 3 + col;
                                if (index < products.Count)
                                {
                                    r.RelativeItem().Border(1)
                                        .Padding(5)
                                        .Component(new LabelComponent(
                                            products[index],
                                            template
                                        ));
                                }
                            }
                        });
                    }
                });
            });
        });

        return document.GeneratePdf();
    }

    // Компонент этикетки
    private class LabelComponent : IComponent
    {
        private readonly Product _product;
        private readonly Template _template;

        public LabelComponent(Product product, Template template)
        {
            _product = product;
            _template = template;
        }

        public void Compose(IContainer container)
        {
            container.Column(column =>
            {
                foreach (var element in _template.Elements)
                {
                    switch (element.Type)
                    {
                        case "text":
                            column.Item().Text(ReplaceTokens(element.Text))
                                .FontSize(element.FontSize)
                                .Bold(element.IsBold);
                            break;

                        case "barcode":
                            column.Item().Image(GenerateBarcode(element.Data));
                            break;

                        case "qr":
                            column.Item().Image(GenerateQRCode(element.Data));
                            break;
                    }
                }
            });
        }

        private string ReplaceTokens(string text)
        {
            return text
                .Replace("{name}", _product.Name)
                .Replace("{sku}", _product.Sku)
                .Replace("{price}", _product.Price.ToString("C"));
        }
    }
}
```

### 9.5. Экспорт отчетов в Excel

```csharp
// Services/Export/ExcelExportService.cs
using ClosedXML.Excel;

public class ExcelExportService : IExcelExportService
{
    public async Task<byte[]> ExportProductsToExcelAsync(List<Product> products)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Продукты");

        // Заголовки
        worksheet.Cell(1, 1).Value = "Артикул";
        worksheet.Cell(1, 2).Value = "Название";
        worksheet.Cell(1, 3).Value = "Категория";
        worksheet.Cell(1, 4).Value = "Цена";
        worksheet.Cell(1, 5).Value = "Остаток";
        worksheet.Cell(1, 6).Value = "Статус";

        // Стили заголовка
        var headerRange = worksheet.Range(1, 1, 1, 6);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Данные
        for (int i = 0; i < products.Count; i++)
        {
            var product = products[i];
            int row = i + 2;

            worksheet.Cell(row, 1).Value = product.Sku;
            worksheet.Cell(row, 2).Value = product.Name;
            worksheet.Cell(row, 3).Value = product.Category;
            worksheet.Cell(row, 4).Value = product.Price;
            worksheet.Cell(row, 5).Value = product.Stock;
            worksheet.Cell(row, 6).Value = product.Status.ToString();
        }

        // Автоширина колонок
        worksheet.Columns().AdjustToContents();

        // Конвертация в byte[]
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportProductionReportToExcelAsync(
        DateTime startDate,
        DateTime endDate)
    {
        var batches = await _supabaseService.GetBatchesAsync(startDate, endDate);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Отчет по производству");

        // Заголовок отчета
        worksheet.Cell(1, 1).Value = "Отчет по производству";
        worksheet.Cell(1, 1).Style.Font.FontSize = 16;
        worksheet.Cell(1, 1).Style.Font.Bold = true;

        worksheet.Cell(2, 1).Value = $"Период: {startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy}";

        // Таблица
        int currentRow = 4;
        worksheet.Cell(currentRow, 1).Value = "Номер партии";
        worksheet.Cell(currentRow, 2).Value = "Продукт";
        worksheet.Cell(currentRow, 3).Value = "Плановое кол-во";
        worksheet.Cell(currentRow, 4).Value = "Произведено";
        worksheet.Cell(currentRow, 5).Value = "Брак";
        worksheet.Cell(currentRow, 6).Value = "% брака";
        worksheet.Cell(currentRow, 7).Value = "Статус";
        worksheet.Cell(currentRow, 8).Value = "Оператор";

        var headerRange = worksheet.Range(currentRow, 1, currentRow, 8);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;

        currentRow++;

        foreach (var batch in batches)
        {
            worksheet.Cell(currentRow, 1).Value = batch.BatchNumber;
            worksheet.Cell(currentRow, 2).Value = batch.ProductName;
            worksheet.Cell(currentRow, 3).Value = batch.PlannedQuantity;
            worksheet.Cell(currentRow, 4).Value = batch.ProducedQuantity;
            worksheet.Cell(currentRow, 5).Value = batch.DefectCount;
            worksheet.Cell(currentRow, 6).Value =
                batch.ProducedQuantity > 0
                    ? (batch.DefectCount / (double)batch.ProducedQuantity * 100).ToString("F2") + "%"
                    : "0%";
            worksheet.Cell(currentRow, 7).Value = batch.Status;
            worksheet.Cell(currentRow, 8).Value = batch.OperatorName;

            currentRow++;
        }

        // Итоги
        currentRow++;
        worksheet.Cell(currentRow, 1).Value = "ИТОГО:";
        worksheet.Cell(currentRow, 1).Style.Font.Bold = true;
        worksheet.Cell(currentRow, 3).Value = batches.Sum(b => b.PlannedQuantity);
        worksheet.Cell(currentRow, 4).Value = batches.Sum(b => b.ProducedQuantity);
        worksheet.Cell(currentRow, 5).Value = batches.Sum(b => b.DefectCount);

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
```

---

## 10. БЕЗОПАСНОСТЬ

### 10.1. Аутентификация и авторизация

#### Аутентификация

**Использование Supabase Auth:**

```csharp
// Services/Auth/AuthService.cs
public class AuthService : IAuthService
{
    private readonly Supabase.Client _client;

    public async Task<User> LoginAsync(string email, string password)
    {
        try
        {
            // Вход через Supabase Auth
            var session = await _client.Auth.SignIn(email, password);

            if (session?.User == null)
                throw new Exception("Invalid credentials");

            // Загрузка профиля пользователя
            var user = await _supabaseService.GetUserByIdAsync(session.User.Id);

            // Проверка статуса
            if (user.Status == UserStatus.Blocked)
                throw new Exception("Account is blocked");

            if (user.Status == UserStatus.Pending)
                throw new Exception("Account is pending approval");

            // Сохранение токена в Secure Storage
            await SecureStorage.SetAsync("access_token", session.AccessToken);
            await SecureStorage.SetAsync("refresh_token", session.RefreshToken);

            // Логирование входа
            await _auditService.LogAsync(new AuditLog
            {
                UserId = user.Id,
                Action = "login",
                EntityType = "auth",
                IpAddress = await GetIpAddressAsync()
            });

            // Обновление last_login
            await _supabaseService.UpdateUserLastLoginAsync(user.Id);

            return user;
        }
        catch (Exception ex)
        {
            throw new AuthenticationException($"Login failed: {ex.Message}");
        }
    }

    public async Task<bool> LogoutAsync()
    {
        await _client.Auth.SignOut();
        SecureStorage.Remove("access_token");
        SecureStorage.Remove("refresh_token");
        return true;
    }

    public async Task<User> GetCurrentUserAsync()
    {
        var token = await SecureStorage.GetAsync("access_token");
        if (string.IsNullOrEmpty(token))
            return null;

        var session = _client.Auth.CurrentSession;
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            // Попытка обновить токен
            var refreshToken = await SecureStorage.GetAsync("refresh_token");
            if (!string.IsNullOrEmpty(refreshToken))
            {
                await _client.Auth.SetSession(token, refreshToken);
            }
            else
            {
                return null;
            }
        }

        return await _supabaseService.GetUserByIdAsync(session.User.Id);
    }
}
```

#### Авторизация (RBAC - Role-Based Access Control)

```csharp
// Helpers/Permissions.cs
public static class Permissions
{
    public static Dictionary<string, List<string>> RolePermissions = new()
    {
        ["admin"] = new List<string>
        {
            "products.create",
            "products.read",
            "products.update",
            "products.delete",
            "templates.create",
            "templates.read",
            "templates.update",
            "templates.delete",
            "batches.create",
            "batches.read",
            "batches.update",
            "batches.delete",
            "print_jobs.create",
            "print_jobs.read",
            "print_jobs.cancel",
            "users.create",
            "users.read",
            "users.update",
            "users.delete",
            "reports.read",
            "system.configure",
            "audit_log.read"
        },
        ["manager"] = new List<string>
        {
            "products.create",
            "products.read",
            "products.update",
            "templates.create",
            "templates.read",
            "templates.update",
            "batches.create",
            "batches.read",
            "batches.update",
            "print_jobs.create",
            "print_jobs.read",
            "users.read",
            "reports.read"
        },
        ["worker"] = new List<string>
        {
            "products.read",
            "templates.read",
            "batches.read",
            "batches.update", // Только свои
            "print_jobs.create",
            "print_jobs.read" // Только свои
        }
    };

    public static bool HasPermission(User user, string permission)
    {
        if (user == null)
            return false;

        // Admin имеет все права
        if (user.Role == UserRole.Admin)
            return true;

        // Проверка в списке прав роли
        if (RolePermissions.ContainsKey(user.Role.ToString().ToLower()))
        {
            return RolePermissions[user.Role.ToString().ToLower()]
                .Contains(permission);
        }

        // Проверка кастомных прав пользователя
        return user.Permissions?.Contains(permission) == true;
    }
}

// Attribute для проверки прав
[AttributeUsage(AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }

    public RequirePermissionAttribute(string permission)
    {
        Permission = permission;
    }
}

// Использование
public class ProductsViewModel
{
    [RequirePermission("products.create")]
    public async Task CreateProductAsync(Product product)
    {
        // Проверка прав выполняется автоматически
        await _supabaseService.CreateProductAsync(product);
    }
}
```

### 10.2. Шифрование данных

#### Шифрование чувствительных полей

```csharp
// Helpers/EncryptionHelper.cs
using System.Security.Cryptography;

public static class EncryptionHelper
{
    private static readonly byte[] Key = Convert.FromBase64String(
        SecureStorage.GetAsync("encryption_key").Result ?? GenerateKey()
    );

    public static string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        using var aes = Aes.Create();
        aes.Key = Key;
        aes.GenerateIV();

        var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

        using var msEncrypt = new MemoryStream();
        using var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
        using (var swEncrypt = new StreamWriter(csEncrypt))
        {
            swEncrypt.Write(plainText);
        }

        var encrypted = msEncrypt.ToArray();
        var result = new byte[aes.IV.Length + encrypted.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(encrypted, 0, result, aes.IV.Length, encrypted.Length);

        return Convert.ToBase64String(result);
    }

    public static string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return cipherText;

        var fullCipher = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        var iv = new byte[aes.IV.Length];
        var cipher = new byte[fullCipher.Length - iv.Length];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        aes.Key = Key;
        aes.IV = iv;

        var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

        using var msDecrypt = new MemoryStream(cipher);
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var srDecrypt = new StreamReader(csDecrypt);

        return srDecrypt.ReadToEnd();
    }

    private static string GenerateKey()
    {
        using var aes = Aes.Create();
        aes.GenerateKey();
        var key = Convert.ToBase64String(aes.Key);
        SecureStorage.SetAsync("encryption_key", key).Wait();
        return key;
    }
}

// Использование для чувствительных данных
public class Product
{
    private string _qrData;

    public string QrData
    {
        get => EncryptionHelper.Decrypt(_qrData);
        set => _qrData = EncryptionHelper.Encrypt(value);
    }
}
```

### 10.3. Защита от атак

#### SQL Injection

**Защита:** Использование параметризованных запросов в Supabase SDK (встроенная защита)

```csharp
// ✅ БЕЗОПАСНО - параметризованный запрос
var product = await _client
    .From<Product>()
    .Where(p => p.Sku == userInput) // SDK автоматически экранирует
    .Single();

// ❌ НЕБЕЗОПАСНО - не делайте так
var query = $"SELECT * FROM products WHERE sku = '{userInput}'";
```

#### XSS (Cross-Site Scripting)

**Защита:** Валидация и санитизация ввода

```csharp
// Helpers/InputValidator.cs
public static class InputValidator
{
    public static string SanitizeHtml(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        // Удаление HTML тегов
        return System.Text.RegularExpressions.Regex
            .Replace(input, @"<[^>]+>", string.Empty);
    }

    public static string SanitizeSql(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        // Экранирование специальных символов
        return input
            .Replace("'", "''")
            .Replace("--", "")
            .Replace(";", "");
    }

    public static bool IsValidEmail(string email)
    {
        var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        return regex.IsMatch(email);
    }

    public static bool IsValidSku(string sku)
    {
        // Формат: XXX-####
        var regex = new Regex(@"^[A-Z]{3}-\d{4}$");
        return regex.IsMatch(sku);
    }
}
```

#### Rate Limiting

```csharp
// Services/RateLimitService.cs
public class RateLimitService
{
    private readonly Dictionary<string, List<DateTime>> _requests = new();
    private readonly int _maxRequests = 100; // Максимум запросов
    private readonly TimeSpan _timeWindow = TimeSpan.FromMinutes(1); // За 1 минуту

    public bool IsAllowed(string userId)
    {
        var now = DateTime.UtcNow;

        if (!_requests.ContainsKey(userId))
        {
            _requests[userId] = new List<DateTime>();
        }

        // Удаление старых запросов
        _requests[userId].RemoveAll(dt => now - dt > _timeWindow);

        // Проверка лимита
        if (_requests[userId].Count >= _maxRequests)
        {
            return false; // Превышен лимит
        }

        // Добавление нового запроса
        _requests[userId].Add(now);
        return true;
    }
}
```

### 10.4. Аудит действий

```csharp
// Services/AuditService.cs
public class AuditService : IAuditService
{
    public async Task LogAsync(AuditLog log)
    {
        // Автоматическое добавление метаданных
        log.IpAddress = await GetIpAddressAsync();
        log.UserAgent = GetUserAgent();
        log.CreatedAt = DateTime.UtcNow;

        await _client.From<AuditLog>().Insert(log);
    }

    public async Task<List<AuditLog>> GetUserActivityAsync(
        Guid userId,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        var query = _client
            .From<AuditLog>()
            .Where(a => a.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(a => a.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.CreatedAt <= endDate.Value);

        var response = await query
            .Order("created_at", Postgrest.Constants.Ordering.Descending)
            .Get();

        return response.Models;
    }

    public async Task<List<AuditLog>> GetEntityHistoryAsync(
        string entityType,
        Guid entityId)
    {
        var response = await _client
            .From<AuditLog>()
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .Order("created_at", Postgrest.Constants.Ordering.Descending)
            .Get();

        return response.Models;
    }

    // Отслеживание критических действий
    public async Task LogCriticalActionAsync(
        Guid userId,
        string action,
        string details)
    {
        await LogAsync(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = "system",
            NewValues = new { details }
        });

        // Дополнительно: отправка уведомления администраторам
        await _notificationService.NotifyAdminsAsync(
            $"Critical action: {action} by user {userId}",
            NotificationPriority.Critical
        );
    }
}
```

---

**(Продолжение следует во второй части...)**
