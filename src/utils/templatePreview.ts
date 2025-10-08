/**
 * Утилита для генерации изображений предпросмотра шаблонов этикеток
 * Использует HTML5 Canvas для рендеринга элементов шаблона
 */

interface DesignElement {
  id: string;
  type: 'text' | 'qr' | 'image' | 'barcode';
  content: string;
  dataBinding?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  rotation?: number;
}

interface LabelTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  version?: string;
  elements: DesignElement[];
  suitableFor?: string[];
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Генерирует миниатюру предпросмотра для шаблона этикетки
 * @param template - Шаблон этикетки с элементами дизайна
 * @param width - Ширина изображения предпросмотра (по умолчанию 300)
 * @param height - Высота изображения предпросмотра (по умолчанию 200)
 * @returns Promise с base64 data URL изображения (JPEG с качеством 0.8)
 */
export async function generatePreview(
  template: LabelTemplate,
  width: number = 300,
  height: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Создаем canvas элемент
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Не удалось получить контекст canvas'));
        return;
      }

      // Заливаем белым фоном
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Добавляем легкую рамку
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

      // Если элементов нет, рисуем заглушку
      if (!template.elements || template.elements.length === 0) {
        drawEmptyState(ctx, width, height, template.category);
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // Рендерим каждый элемент
      template.elements.forEach(element => {
        renderElement(ctx, element, width, height);
      });

      // Добавляем водяной знак с названием категории в правом нижнем углу
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(template.category, width - 15, height - 15);
      ctx.restore();

      // Возвращаем base64 data URL в формате JPEG с качеством 0.8 для лучшей детализации
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Рендерит пустое состояние когда нет элементов
 */
function drawEmptyState(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  category: string
) {
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Пустой шаблон', width / 2, height / 2 - 10);

  ctx.font = '12px sans-serif';
  ctx.fillText(category, width / 2, height / 2 + 10);
}

/**
 * Рендерит отдельный элемент шаблона на canvas
 */
function renderElement(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  // Масштабируем координаты для превью
  // Предполагаем, что оригинальный размер шаблона 400x300
  const scaleX = canvasWidth / 400;
  const scaleY = canvasHeight / 300;

  const x = element.x * scaleX;
  const y = element.y * scaleY;
  const w = element.width * scaleX;
  const h = element.height * scaleY;

  // Применяем поворот если есть
  if (element.rotation) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  switch (element.type) {
    case 'text':
      renderText(ctx, element, x, y, w, h);
      break;
    case 'qr':
      renderQRPlaceholder(ctx, x, y, w, h);
      break;
    case 'barcode':
      renderBarcodePlaceholder(ctx, x, y, w, h);
      break;
    case 'image':
      renderImagePlaceholder(ctx, x, y, w, h);
      break;
    default:
      // Рендерим как прямоугольник по умолчанию
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
  }

  ctx.restore();
}

/**
 * Рендерит текстовый элемент
 */
function renderText(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Фон текста
  if (element.backgroundColor) {
    ctx.fillStyle = element.backgroundColor;
    ctx.fillRect(x, y, w, h);
  }

  // Текст с улучшенным сглаживанием
  const fontSize = element.fontSize ?? 16; // Не уменьшаем для лучшей читаемости
  const fontWeight = element.fontWeight ?? 'normal';
  ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
  ctx.fillStyle = element.color ?? '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Включаем сглаживание текста
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Обрезаем текст если слишком длинный
  let displayText = element.content ?? element.dataBinding ?? 'Текст';
  const maxWidth = w - 8;
  let textWidth = ctx.measureText(displayText).width;

  if (textWidth > maxWidth) {
    while (textWidth > maxWidth && displayText.length > 3) {
      displayText = displayText.slice(0, -1);
      textWidth = ctx.measureText(`${displayText}...`).width;
    }
    displayText = `${displayText}...`;
  }

  // Вертикальное центрирование
  const textHeight = fontSize;
  const textY = y + (h - textHeight) / 2;

  ctx.fillText(displayText, x + 4, textY);
}

/**
 * Рендерит заглушку для QR-кода
 */
function renderQRPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  // Черная рамка
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Упрощенный паттерн QR-кода
  const cellSize = Math.min(w, h) / 12; // Увеличили детализацию
  ctx.fillStyle = '#000000';

  // Рисуем три угловых маркера QR
  // Верхний левый
  ctx.fillRect(x + cellSize, y + cellSize, cellSize * 3, cellSize * 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize, cellSize);
  ctx.fillStyle = '#000000';

  // Верхний правый
  ctx.fillRect(x + w - cellSize * 4, y + cellSize, cellSize * 3, cellSize * 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + w - cellSize * 3, y + cellSize * 2, cellSize, cellSize);
  ctx.fillStyle = '#000000';

  // Нижний левый
  ctx.fillRect(x + cellSize, y + h - cellSize * 4, cellSize * 3, cellSize * 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + cellSize * 2, y + h - cellSize * 3, cellSize, cellSize);

  // Добавляем случайные точки для имитации данных
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 25; i++) {
    // Увеличили количество точек
    const px = x + Math.random() * (w - cellSize * 2) + cellSize;
    const py = y + Math.random() * (h - cellSize * 2) + cellSize;
    ctx.fillRect(px, py, cellSize * 0.7, cellSize * 0.7);
  }
}

/**
 * Рендерит заглушку для штрих-кода
 */
function renderBarcodePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  // Черные полосы разной ширины
  ctx.fillStyle = '#000000';
  const numBars = 35; // Увеличили количество полос
  const barSpacing = w / numBars;

  for (let i = 0; i < numBars; i++) {
    const barWidth = barSpacing * (Math.random() * 0.6 + 0.4);
    const barX = x + i * barSpacing;
    const barHeight = h - 24;
    ctx.fillRect(barX, y + 2, barWidth, barHeight);
  }

  // Текст номера под штрих-кодом
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1234567890123', x + w / 2, y + h - 8);
}

/**
 * Рендерит заглушку для изображения
 */
function renderImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Серый фон
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(x, y, w, h);

  // Рамка
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Иконка изображения
  const iconSize = Math.min(w, h) * 0.4;
  const iconX = x + (w - iconSize) / 2;
  const iconY = y + (h - iconSize) / 2;

  // Простая иконка горы с солнцем
  ctx.fillStyle = '#9ca3af';

  // Солнце (круг)
  ctx.beginPath();
  ctx.arc(
    iconX + iconSize * 0.7,
    iconY + iconSize * 0.3,
    iconSize * 0.15,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Гора (треугольник)
  ctx.beginPath();
  ctx.moveTo(iconX, iconY + iconSize);
  ctx.lineTo(iconX + iconSize * 0.5, iconY + iconSize * 0.4);
  ctx.lineTo(iconX + iconSize, iconY + iconSize);
  ctx.closePath();
  ctx.fill();
}

/**
 * Генерирует миниатюру для нескольких шаблонов одновременно
 * Полезно для пакетной обработки
 */
export async function generatePreviews(
  templates: LabelTemplate[],
  width: number = 400,
  height: number = 300
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const template of templates) {
    try {
      const preview = await generatePreview(template, width, height);
      results.set(template.id, preview);
    } catch (error) {
      // Пропускаем шаблоны с ошибками и продолжаем обработку остальных
      // В production можно логировать через систему мониторинга
      void error;
    }
  }

  return results;
}
