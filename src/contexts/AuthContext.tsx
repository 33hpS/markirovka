/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { validateToken, decodeToken, type TokenPayload } from '../utils/jwt';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from '../utils/storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'worker';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: 'admin' | 'manager' | 'worker') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database (в production это будет API запрос)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@markirovka.ru',
    password: 'admin123', // В production: bcrypt hash
    firstName: 'Александр',
    lastName: 'Петров',
    role: 'admin' as const,
    permissions: [
      'users.manage',
      'system.config',
      'audit.view',
      'production.manage',
      'labels.manage',
      'printing.manage',
      'reports.view',
    ],
  },
  {
    id: '2',
    email: 'manager@markirovka.ru',
    password: 'manager123',
    firstName: 'Мария',
    lastName: 'Сидорова',
    role: 'manager' as const,
    permissions: [
      'production.manage',
      'labels.create',
      'printing.manage',
      'reports.view',
      'users.view',
    ],
  },
  {
    id: '3',
    email: 'worker@markirovka.ru',
    password: 'worker123',
    firstName: 'Иван',
    lastName: 'Козлов',
    role: 'worker' as const,
    permissions: ['labels.view', 'printing.basic', 'production.view'],
  },
];

// Mock JWT generation (в production используйте настоящий JWT backend)
function generateMockToken(user: (typeof MOCK_USERS)[0]): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 hours
  };

  // В production это должен делать backend с настоящей подписью
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(payload))}.mock_signature_${user.id}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();

      if (storedToken) {
        const isValid = validateToken(storedToken);

        if (isValid) {
          const decoded = decodeToken(storedToken);
          if (decoded) {
            // В production: API запрос для получения актуальных данных пользователя
            const mockUser = MOCK_USERS.find(u => u.id === decoded.userId);
            if (mockUser) {
              setUser({
                id: mockUser.id,
                email: mockUser.email,
                firstName: mockUser.firstName,
                lastName: mockUser.lastName,
                role: mockUser.role,
                permissions: mockUser.permissions,
              });
              setToken(storedToken);
            }
          }
        } else {
          // Token expired or invalid
          clearStoredToken();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // В production: API запрос к /api/auth/login
        const mockUser = MOCK_USERS.find(
          u => u.email === email && u.password === password
        );

        if (!mockUser) {
          return {
            success: false,
            error: 'Неверный email или пароль',
          };
        }

        // Generate token (в production это делает backend)
        const newToken = generateMockToken(mockUser);

        // Store token
        setStoredToken(newToken);

        // Set user state
        const userData: User = {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          permissions: mockUser.permissions,
        };

        setUser(userData);
        setToken(newToken);

        return { success: true };
      } catch {
        return {
          success: false,
          error: 'Произошла ошибка при входе',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    // В production: API запрос к /api/auth/logout для инвалидации токена
    clearStoredToken();
    setUser(null);
    setToken(null);
    // Используем setTimeout чтобы состояние успело обновиться
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 0);
  }, [navigate]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: 'admin' | 'manager' | 'worker'): boolean => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook для проверки конкретного разрешения
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook для проверки роли
export function useRole(role: 'admin' | 'manager' | 'worker'): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}
