export type Language = 'ru' | 'ky' | 'en';

export interface Translations {
  // Navigation
  home: string;
  labels: string;
  designer: string;
  printing: string;
  production: string;
  users: string;
  reports: string;
  docs: string;
  settings: string;

  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  search: string;
  loading: string;
  error: string;
  success: string;
  language: string;
  theme: string;

  // Designer
  designerTitle: string;
  tools: string;
  addText: string;
  addQR: string;
  addBarcode: string;
  addImage: string;
  saveTemplate: string;
  printLabel: string;
  elementProperties: string;
  content: string;
  dataBinding: string;
  fontSize: string;
  color: string;
  position: string;
  deleteElement: string;
  newTemplate: string;
  createNewTemplate: string;
  templateCreationHint: string;

  // Labels
  templatesLibrary: string;
  searchTemplates: string;
  allCategories: string;

  // Products
  productName: string;
  sku: string;
  price: string;
  category: string;
  manufacturer: string;
  weight: string;
  expiryDate: string;
  batchNumber: string;

  // Themes
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;
}

export const translations: Record<Language, Translations> = {
  ru: {
    // Navigation
    home: 'Главная',
    labels: 'Этикетки',
    designer: 'Дизайнер',
    printing: 'Печать',
    production: 'Производство',
    users: 'Пользователи',
    reports: 'Отчеты',
    docs: 'Документация',
    settings: 'Настройки',

    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    create: 'Создать',
    search: 'Поиск',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    language: 'Язык',
    theme: 'Тема',

    // Designer
    designerTitle: 'Дизайнер этикеток',
    tools: 'Инструменты',
    addText: 'Добавить текст',
    addQR: 'Добавить QR-код',
    addBarcode: 'Добавить штрих-код',
    addImage: 'Добавить изображение',
    saveTemplate: 'Сохранить шаблон',
    printLabel: 'Печать этикетки',
    elementProperties: 'Свойства элемента',
    content: 'Содержимое',
    dataBinding: 'Привязка к данным продукта',
    fontSize: 'Размер шрифта',
    color: 'Цвет',
    position: 'Позиция',
    deleteElement: 'Удалить элемент',
    newTemplate: 'Новый шаблон',
    createNewTemplate: 'Создать шаблон',
    templateCreationHint:
      'Создание нового шаблона - начните с добавления элементов',

    // Labels
    templatesLibrary: 'Библиотека шаблонов',
    searchTemplates: 'Поиск шаблонов',
    allCategories: 'Все категории',

    // Products
    productName: 'Название продукта',
    sku: 'Артикул',
    price: 'Цена',
    category: 'Категория',
    manufacturer: 'Производитель',
    weight: 'Вес',
    expiryDate: 'Срок годности',
    batchNumber: 'Номер партии',

    // Themes
    lightTheme: 'Светлая тема',
    darkTheme: 'Темная тема',
    systemTheme: 'Системная тема',
  },

  ky: {
    // Navigation
    home: 'Башкы бет',
    labels: 'Белгилер',
    designer: 'Дизайнер',
    printing: 'Басуу',
    production: 'Өндүрүш',
    users: 'Колдонуучулар',
    reports: 'Отчеттор',
    docs: 'Документация',
    settings: 'Жөндөөлөр',

    // Common
    save: 'Сактоо',
    cancel: 'Жокко чыгаруу',
    delete: 'Өчүрүү',
    edit: 'Өзгөртүү',
    create: 'Түзүү',
    search: 'Издөө',
    loading: 'Жүктөлүүдө...',
    error: 'Ката',
    success: 'Ийгиликтүү',
    language: 'Тил',
    theme: 'Тема',

    // Designer
    designerTitle: 'Белги дизайнери',
    tools: 'Куралдар',
    addText: 'Текст кошуу',
    addQR: 'QR-код кошуу',
    addBarcode: 'Штрих-код кошуу',
    addImage: 'Сүрөт кошуу',
    saveTemplate: 'Калыпты сактоо',
    printLabel: 'Белгини басуу',
    elementProperties: 'Элементтин касиеттери',
    content: 'Мазмуну',
    dataBinding: 'Продукт маалыматтарына байланыштыруу',
    fontSize: 'Арип өлчөмү',
    color: 'Түс',
    position: 'Позиция',
    deleteElement: 'Элементти өчүрүү',
    newTemplate: 'Жаңы калып',
    createNewTemplate: 'Калып түзүү',
    templateCreationHint: 'Жаңы калып түзүү - элементтерди кошуудан баштаңыз',

    // Labels
    templatesLibrary: 'Калыптар китепканасы',
    searchTemplates: 'Калыптарды издөө',
    allCategories: 'Бардык категориялар',

    // Products
    productName: 'Продукттун аталышы',
    sku: 'Артикул',
    price: 'Баасы',
    category: 'Категория',
    manufacturer: 'Өндүрүүчү',
    weight: 'Салмагы',
    expiryDate: 'Жарактуулук мөөнөтү',
    batchNumber: 'Партия номери',

    // Themes
    lightTheme: 'Жарык тема',
    darkTheme: 'Караңгы тема',
    systemTheme: 'Система темасы',
  },

  en: {
    // Navigation
    home: 'Home',
    labels: 'Labels',
    designer: 'Designer',
    printing: 'Printing',
    production: 'Production',
    users: 'Users',
    reports: 'Reports',
    docs: 'Documentation',
    settings: 'Settings',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    language: 'Language',
    theme: 'Theme',

    // Designer
    designerTitle: 'Label Designer',
    tools: 'Tools',
    addText: 'Add Text',
    addQR: 'Add QR Code',
    addBarcode: 'Add Barcode',
    addImage: 'Add Image',
    saveTemplate: 'Save Template',
    printLabel: 'Print Label',
    elementProperties: 'Element Properties',
    content: 'Content',
    dataBinding: 'Data Binding to Product',
    fontSize: 'Font Size',
    color: 'Color',
    position: 'Position',
    deleteElement: 'Delete Element',
    newTemplate: 'New Template',
    createNewTemplate: 'Create Template',
    templateCreationHint: 'Creating new template - start by adding elements',

    // Labels
    templatesLibrary: 'Templates Library',
    searchTemplates: 'Search Templates',
    allCategories: 'All Categories',

    // Products
    productName: 'Product Name',
    sku: 'SKU',
    price: 'Price',
    category: 'Category',
    manufacturer: 'Manufacturer',
    weight: 'Weight',
    expiryDate: 'Expiry Date',
    batchNumber: 'Batch Number',

    // Themes
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    systemTheme: 'System Theme',
  },
};
