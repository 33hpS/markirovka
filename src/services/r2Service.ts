import { r2Config } from '../config/config';

// Типы для R2 операций
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  url: string;
}

class R2Service {
  private readonly endpoint: string | undefined;
  private readonly bucketName: string | undefined;
  private readonly isConfigured: boolean;

  constructor() {
    this.endpoint = r2Config.endpoint;
    this.bucketName = r2Config.bucketName;
    this.isConfigured = Boolean(
      r2Config.isConfigured && this.endpoint && this.bucketName
    );
  }

  // Загрузка файла
  async uploadFile(
    file: File | Blob,
    key: string,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      if (!this.isConfigured || !this.endpoint || !this.bucketName) {
        throw new Error(
          'Cloudflare R2 is not configured. Provide VITE_R2_* environment variables.'
        );
      }
      const fileName = key.startsWith('/') ? key.slice(1) : key;
      const url = `${this.endpoint}/${this.bucketName}/${fileName}`;

      // В браузере используем простой PUT запрос с CORS
      // В продакшене нужно настроить proper S3 SDK или использовать signed URLs
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', fileName);

      // Для демонстрации - используем fetch с базовой авторизацией
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType ?? 'application/octet-stream',
          // В продакшене здесь должна быть правильная AWS подпись
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        url: `${this.endpoint}/${this.bucketName}/${fileName}`,
        key: fileName,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  // Загрузка PDF этикетки
  async uploadLabelPDF(
    pdfBlob: Blob,
    productSku: string,
    templateId: string
  ): Promise<UploadResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `labels/${timestamp}/${productSku}_${templateId}_${Date.now()}.pdf`;

    return this.uploadFile(pdfBlob, fileName, 'application/pdf');
  }

  // Загрузка изображения товара
  async uploadProductImage(
    imageFile: File,
    productSku: string
  ): Promise<UploadResult> {
    const extension = imageFile.name.split('.').pop() ?? 'jpg';
    const fileName = `products/${productSku}/image_${Date.now()}.${extension}`;

    return this.uploadFile(imageFile, fileName, imageFile.type);
  }

  // Загрузка шаблона этикетки
  async uploadTemplate(
    templateData: unknown,
    templateId: string
  ): Promise<UploadResult> {
    const jsonBlob = new Blob([JSON.stringify(templateData, null, 2)], {
      type: 'application/json',
    });
    const fileName = `templates/${templateId}_${Date.now()}.json`;

    return this.uploadFile(jsonBlob, fileName, 'application/json');
  }

  // Получение URL файла
  getFileUrl(key: string): string {
    if (!this.isConfigured || !this.endpoint || !this.bucketName) {
      throw new Error(
        'Cloudflare R2 is not configured. Provide VITE_R2_* environment variables.'
      );
    }
    const fileName = key.startsWith('/') ? key.slice(1) : key;
    return `${this.endpoint}/${this.bucketName}/${fileName}`;
  }

  // Список файлов в папке
  async listFiles(_prefix: string): Promise<FileMetadata[]> {
    try {
      // В реальном проекте здесь будет S3 ListObjects API
      // Для демонстрации возвращаем пустой массив
      return [];
    } catch {
      return [];
    }
  }

  // Удаление файла
  async deleteFile(key: string): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.endpoint || !this.bucketName) {
        throw new Error(
          'Cloudflare R2 is not configured. Provide VITE_R2_* environment variables.'
        );
      }
      const fileName = key.startsWith('/') ? key.slice(1) : key;
      const url = `${this.endpoint}/${this.bucketName}/${fileName}`;

      const response = await fetch(url, {
        method: 'DELETE',
        // В продакшене здесь должна быть правильная AWS подпись
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Генерация подписанного URL для прямой загрузки
  async generateUploadUrl(
    key: string,
    _contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    // В продакшене здесь будет генерация signed URL с AWS SDK
    // Для демонстрации возвращаем обычный URL
    if (!this.isConfigured || !this.endpoint || !this.bucketName) {
      throw new Error(
        'Cloudflare R2 is not configured. Provide VITE_R2_* environment variables.'
      );
    }
    const fileName = key.startsWith('/') ? key.slice(1) : key;
    return `${this.endpoint}/${this.bucketName}/${fileName}?upload=true&expires=${Date.now() + expiresIn * 1000}`;
  }

  // Получение метаданных файла
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      if (!this.isConfigured || !this.endpoint || !this.bucketName) {
        throw new Error(
          'Cloudflare R2 is not configured. Provide VITE_R2_* environment variables.'
        );
      }
      const fileName = key.startsWith('/') ? key.slice(1) : key;
      const url = `${this.endpoint}/${this.bucketName}/${fileName}`;

      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        return null;
      }

      return {
        key: fileName,
        size: parseInt(response.headers.get('content-length') ?? '0'),
        lastModified: new Date(response.headers.get('last-modified') ?? ''),
        contentType:
          response.headers.get('content-type') ?? 'application/octet-stream',
        url,
      };
    } catch {
      return null;
    }
  }

  // Пакетная загрузка файлов
  async uploadMultipleFiles(
    files: { file: File | Blob; key: string; contentType?: string }[]
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(({ file, key, contentType }) =>
      this.uploadFile(file, key, contentType)
    );
    try {
      return await Promise.all(uploadPromises);
    } catch {
      return files.map(() => ({
        success: false,
        error: 'Batch upload failed',
      }));
    }
  }

  // Очистка старых файлов
  async cleanupOldFiles(prefix: string, maxAge: number): Promise<number> {
    try {
      const files = await this.listFiles(prefix);
      const cutoffDate = new Date(Date.now() - maxAge);
      const oldFiles = files.filter(file => file.lastModified < cutoffDate);
      const deletePromises = oldFiles.map(file => this.deleteFile(file.key));
      const results = await Promise.all(deletePromises);
      return results.filter(success => success).length;
    } catch {
      return 0;
    }
  }
}

// Экспорт единственного экземпляра
export const r2Service = new R2Service();
export default r2Service;
