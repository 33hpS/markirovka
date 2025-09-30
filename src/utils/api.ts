import { tokenStorage, jwtUtils } from './jwt';
import { validateAndSanitize, apiResponseSchema } from './validation';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Error types
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  requireAuth?: boolean;
}

// Response interceptor type
type ResponseInterceptor = (response: Response) => Promise<Response>;

// API Client class
export class APIClient {
  private baseURL: string;
  private defaultTimeout: number;
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL = API_BASE_URL, timeout = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Build request URL
  private buildURL(endpoint: string): string {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      return new URL(url).toString();
    } catch {
      throw new APIError(400, 'Invalid URL format');
    }
  }

  // Get authorization headers
  private getAuthHeaders(): Record<string, string> {
    const token = tokenStorage.get();
    
    if (!token) {
      throw new APIError(401, 'No authentication token found');
    }

    if (!jwtUtils.isValid(token)) {
      tokenStorage.remove();
      throw new APIError(401, 'Authentication token expired');
    }

    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Build request headers
  private buildHeaders(config: RequestConfig): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    });

    if (config.requireAuth) {
      const authHeaders = this.getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    return headers;
  }

  // Create abort controller with timeout
  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    // Clear timeout if request completes
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });

    return controller;
  }

  // Process response through interceptors
  private async processResponse(response: Response): Promise<Response> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  // Parse response body
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new APIError(response.status, `Unexpected content type: ${contentType}`, text);
    }

    try {
      const data = await response.json();
      
      // Validate API response format
      const validation = validateAndSanitize(apiResponseSchema, data);
      if (!validation.success) {
        console.warn('API response format validation failed:', validation.errors);
      }
      
      return data as T;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(response.status, 'Failed to parse response JSON');
    }
  }

  // Main request method
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      timeout = this.defaultTimeout,
    } = config;

    const url = this.buildURL(endpoint);
    const headers = this.buildHeaders(config);
    const controller = this.createAbortController(timeout);

    const requestInit: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestInit);
      const processedResponse = await this.processResponse(response);

      if (!processedResponse.ok) {
        const errorData = await this.parseResponse(processedResponse).catch(() => null);
        const message = (errorData as any)?.error || `HTTP ${processedResponse.status}`;
        throw new APIError(processedResponse.status, message, errorData);
      }

      return this.parseResponse<T>(processedResponse);
    } catch (error) {
      if (error instanceof APIError) throw error;
      
      if (error instanceof TypeError) {
        throw new NetworkError('Network request failed');
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      
      throw new NetworkError(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create default API client instance
export const apiClient = new APIClient();

// Add default response interceptor for token refresh
apiClient.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    tokenStorage.remove();
    // Could trigger a logout or token refresh here
  }
  return response;
});