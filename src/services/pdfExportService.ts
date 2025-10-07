import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';

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

export class PDFExportService {
  /**
   * Экспортирует этикетку в PDF
   */
  static async exportLabelToPDF(
    elements: DesignElement[],
    product: Product
  ): Promise<void> {
    try {
      // Создаем временный контейнер для рендеринга
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '320px';
      tempContainer.style.height = '200px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.border = '1px solid #ccc';
      tempContainer.style.fontFamily = 'Arial, sans-serif';

      document.body.appendChild(tempContainer);

      // Рендерим этикетку
      await this.renderLabel(tempContainer, elements, product);

      // Ждем рендеринга
      await new Promise(resolve => setTimeout(resolve, 200));

      // Создаем canvas из элемента
      const canvas = await html2canvas(tempContainer, {
        width: 320,
        height: 200,
        scale: 2, // Увеличиваем разрешение
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      // Удаляем временный контейнер
      document.body.removeChild(tempContainer);

      // Создаем PDF (формат этикетки 80x50mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [80, 50],
      });

      // Добавляем изображение в PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 80, 50);

      // Добавляем метаданные
      pdf.setProperties({
        title: `Этикетка - ${product.name}`,
        subject: `Этикетка для продукта ${product.sku}`,
        author: 'Система маркировки',
        creator: 'Label Designer',
        keywords: `этикетка, ${product.category}, ${product.manufacturer}`,
      });

      // Сохраняем файл
      const filename = `Этикетка_${product.sku}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      throw new Error(
        `Не удалось экспортировать этикетку в PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }

  /**
   * Создает высококачественный PDF для печати
   */
  static async exportHighQualityPDF(
    elements: DesignElement[],
    product: Product
  ): Promise<void> {
    try {
      // Создаем PDF в высоком разрешении
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt', // Используем пункты для большей точности
        format: [226.77, 141.73], // 80x50mm в пунктах (1mm = 2.83465pt)
      });

      // Получаем данные элементов с привязкой к продукту
      const processedElements = this.processElements(elements, product);

      // Рендерим элементы напрямую в PDF
      await this.renderElementsToPDF(pdf, processedElements, product);

      // Добавляем метаданные
      pdf.setProperties({
        title: `Этикетка - ${product.name}`,
        subject: `Этикетка для продукта ${product.sku}`,
        author: 'Система маркировки',
        creator: 'Label Designer',
        keywords: `этикетка, ${product.category}, ${product.manufacturer}`,
      });

      // Сохраняем файл
      const filename = `Этикетка_HQ_${product.sku}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (error) {
      throw new Error(
        `Не удалось экспортировать этикетку в высококачественный PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }

  /**
   * Рендерит этикетку в HTML контейнер
   */
  private static async renderLabel(
    container: HTMLElement,
    elements: DesignElement[],
    product: Product
  ): Promise<void> {
    for (const element of elements) {
      const elementDiv = document.createElement('div');
      elementDiv.style.position = 'absolute';
      elementDiv.style.left = `${element.x}px`;
      elementDiv.style.top = `${element.y}px`;
      elementDiv.style.width = `${element.width}px`;
      elementDiv.style.height = `${element.height}px`;
      elementDiv.style.boxSizing = 'border-box';
      elementDiv.style.overflow = 'hidden';

      const content = this.getElementContent(element, product);

      switch (element.type) {
        case 'text':
          elementDiv.style.fontSize = `${element.fontSize ?? 12}px`;
          elementDiv.style.color = element.color ?? '#000000';
          elementDiv.style.display = 'flex';
          elementDiv.style.alignItems = 'center';
          elementDiv.style.fontFamily = 'Arial, sans-serif';
          elementDiv.style.fontWeight = '400';
          elementDiv.style.lineHeight = '1.2';
          elementDiv.style.whiteSpace = 'nowrap';
          elementDiv.textContent = content;
          break;

        case 'qr':
          try {
            // Генерируем QR-код как Data URL
            const qrDataUrl = await QRCode.toDataURL(content, {
              width: element.width,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });

            const qrImg = document.createElement('img');
            qrImg.src = qrDataUrl;
            qrImg.style.width = '100%';
            qrImg.style.height = '100%';
            qrImg.style.objectFit = 'contain';
            elementDiv.appendChild(qrImg);
          } catch {
            // Fallback если не удалось сгенерировать QR
            elementDiv.style.backgroundColor = '#f0f0f0';
            elementDiv.style.border = '1px solid #ccc';
            elementDiv.style.display = 'flex';
            elementDiv.style.alignItems = 'center';
            elementDiv.style.justifyContent = 'center';
            elementDiv.style.fontSize = '10px';
            elementDiv.style.color = '#666';
            elementDiv.textContent = 'QR';
          }
          break;

        case 'barcode':
          elementDiv.style.backgroundColor = '#ffffff';
          elementDiv.style.border = '1px solid #000';
          elementDiv.style.display = 'flex';
          elementDiv.style.alignItems = 'center';
          elementDiv.style.justifyContent = 'center';
          elementDiv.style.fontSize = '8px';
          elementDiv.style.fontFamily = 'monospace';
          elementDiv.style.letterSpacing = '1px';
          elementDiv.textContent = '|||||||||||';
          break;

        case 'image':
          elementDiv.style.backgroundColor = '#f8f8f8';
          elementDiv.style.border = '1px dashed #ccc';
          elementDiv.style.display = 'flex';
          elementDiv.style.alignItems = 'center';
          elementDiv.style.justifyContent = 'center';
          elementDiv.style.fontSize = '10px';
          elementDiv.style.color = '#666';
          elementDiv.textContent = '🖼️';
          break;
      }

      container.appendChild(elementDiv);
    }
  }

  /**
   * Рендерит элементы напрямую в PDF
   */
  private static async renderElementsToPDF(
    pdf: jsPDF,
    elements: DesignElement[],
    product: Product
  ): Promise<void> {
    const processedElements = this.processElements(elements, product);

    for (const element of processedElements) {
      const x = element.x * 0.75; // Конвертируем пиксели в пункты (1px ≈ 0.75pt)
      const y = element.y * 0.75;

      switch (element.type) {
        case 'text': {
          pdf.setFontSize((element.fontSize ?? 12) * 0.75);
          pdf.setTextColor(element.color ?? '#000000');
          // Исправляем позиционирование текста - используем baseline
          const textY = y + (element.fontSize ?? 12) * 0.75 * 0.8;
          pdf.text(element.content, x, textY);
          break;
        }

        case 'qr':
          try {
            // Генерируем QR-код для PDF
            const qrSize = Math.min(element.width, element.height) * 0.75;
            const qrDataUrl = await QRCode.toDataURL(element.content, {
              width: qrSize * 4, // Увеличиваем разрешение для лучшего качества
              margin: 0,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });

            pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
          } catch {
            // Fallback для QR кода
            pdf.setFillColor(240, 240, 240);
            pdf.rect(x, y, element.width * 0.75, element.height * 0.75, 'F');
            pdf.setFontSize(6);
            pdf.setTextColor('#666666');
            pdf.text('QR', x + element.width * 0.3, y + element.height * 0.5);
          }
          break;

        case 'barcode':
          // Простая заглушка для штрих-кода
          pdf.setFillColor(255, 255, 255);
          pdf.rect(x, y, element.width * 0.75, element.height * 0.75, 'F');
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, y, element.width * 0.75, element.height * 0.75, 'S');
          pdf.setFontSize(6);
          pdf.setTextColor('#000000');
          pdf.text('|||||||||||', x + 2, y + element.height * 0.4);
          break;

        case 'image':
          // Простая заглушка для изображения
          pdf.setFillColor(248, 248, 248);
          pdf.rect(x, y, element.width * 0.75, element.height * 0.75, 'F');
          pdf.setDrawColor(204, 204, 204);
          pdf.rect(x, y, element.width * 0.75, element.height * 0.75, 'S');
          pdf.setFontSize(8);
          pdf.setTextColor('#666666');
          pdf.text('IMG', x + element.width * 0.3, y + element.height * 0.5);
          break;
      }
    }
  }

  /**
   * Обрабатывает элементы с привязкой к данным продукта
   */
  private static processElements(
    elements: DesignElement[],
    product: Product
  ): DesignElement[] {
    return elements.map(element => ({
      ...element,
      content: this.getElementContent(element, product),
    }));
  }

  /**
   * Получает актуальное содержимое элемента с учетом привязки к данным
   */
  private static getElementContent(
    element: DesignElement,
    product: Product
  ): string {
    if (element.dataBinding && product) {
      const value = product[element.dataBinding as keyof Product];
      if (element.dataBinding === 'price') {
        return `${value} ₽`;
      }
      return value?.toString() || element.content;
    }
    return element.content;
  }

  /**
   * Создает превью этикетки в виде изображения
   */
  static async createPreviewImage(
    elements: DesignElement[],
    product: Product
  ): Promise<string> {
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '320px';
      tempContainer.style.height = '200px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.border = '1px solid #ccc';

      document.body.appendChild(tempContainer);

      await this.renderLabel(tempContainer, elements, product);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(tempContainer, {
        width: 320,
        height: 200,
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(tempContainer);

      return canvas.toDataURL('image/png');
    } catch (error) {
      throw new Error(
        `Не удалось создать превью этикетки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }
}
