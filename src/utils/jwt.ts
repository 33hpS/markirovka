import { z } from 'zod';

// JWT payload validation schema
export const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  iat: z.number().positive(),
  exp: z.number().positive(),
  role: z.enum(['admin', 'manager', 'worker']),
  permissions: z.array(z.string()).optional(),
});

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// Token storage utilities
export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem('authToken');
    } catch {
      return null;
    }
  },

  set: (token: string): void => {
    try {
      localStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },
};

// JWT utilities
export const jwtUtils = {
  decode: (token: string): JWTPayload | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const result = jwtPayloadSchema.safeParse(payload);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  },

  isExpired: (token: string): boolean => {
    const payload = jwtUtils.decode(token);
    if (!payload) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  },

  isValid: (token: string): boolean => {
    const payload = jwtUtils.decode(token);
    return payload !== null && !jwtUtils.isExpired(token);
  },

  getRole: (token: string): string | null => {
    const payload = jwtUtils.decode(token);
    return payload?.role ?? null;
  },

  hasPermission: (token: string, permission: string): boolean => {
    const payload = jwtUtils.decode(token);
    if (!payload?.permissions) return false;
    return payload.permissions.includes(permission);
  },
};

// Auto-refresh token utility
export class TokenRefreshManager {
  private refreshTimer?: NodeJS.Timeout;
  private readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

  constructor(private onRefresh: () => Promise<string | null>) {}

  start(token: string): void {
    this.stop();
    
    const payload = jwtUtils.decode(token);
    if (!payload) return;

    const expiryTime = payload.exp * 1000;
    const refreshTime = expiryTime - this.REFRESH_BUFFER;
    const delay = refreshTime - Date.now();

    if (delay > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          const newToken = await this.onRefresh();
          if (newToken) {
            this.start(newToken);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }, delay);
    }
  }

  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}