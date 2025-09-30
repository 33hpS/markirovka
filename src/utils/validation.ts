import { z } from 'zod';
import DOMPurify from 'dompurify';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone format');

// User validation schemas
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'manager', 'worker']).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Product/Label validation schemas
export const labelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Label name is required'),
  description: z.string().optional(),
  qrCode: z.string().min(1, 'QR code is required'),
  category: z.string().min(1, 'Category is required'),
  dimensions: z.object({
    width: z.number().positive('Width must be positive'),
    height: z.number().positive('Height must be positive'),
  }),
  elements: z.array(z.object({
    type: z.enum(['text', 'qr', 'image', 'barcode']),
    content: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    style: z.record(z.string(), z.unknown()).optional(),
  })),
});

export const batchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Batch name is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
}).refine(data => {
  if (data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Settings validation schemas
export const printerSettingsSchema = z.object({
  name: z.string().min(1, 'Printer name is required'),
  type: z.enum(['thermal', 'inkjet', 'laser']),
  connection: z.enum(['usb', 'network', 'bluetooth']),
  settings: z.object({
    dpi: z.number().positive(),
    paperSize: z.string(),
    orientation: z.enum(['portrait', 'landscape']),
  }),
});

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Input sanitization utilities
export const sanitizeInput = {
  html: (input: string): string => {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
  },

  text: (input: string): string => {
    return input.replace(/[<>'"&]/g, match => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[match] || match;
    });
  },

  filename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9.-]/g, '_');
  },

  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },
};

// Validation helpers
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sanitize = true
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    let processedData = data;
    
    if (sanitize && typeof data === 'object' && data !== null) {
      processedData = sanitizeObjectStrings(data);
    }

    const result = schema.safeParse(processedData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
};

// Recursive object sanitization
const sanitizeObjectStrings = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return sanitizeInput.text(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectStrings(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Common validation functions
export const validateFile = (file: File, maxSize: number, allowedTypes: string[]) => {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
};

export const validateQRCode = (qrData: string): boolean => {
  // Basic QR code validation - should contain valid JSON or specific format
  try {
    JSON.parse(qrData);
    return true;
  } catch {
    // Check if it's a valid URL or other format
    return qrData.length > 0 && qrData.length <= 2953; // QR code max capacity
  }
};