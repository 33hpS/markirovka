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

import {
  getSupabaseService,
  isSupabaseAvailable,
} from '../services/supabaseService';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseAvailable) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseService();
        const currentUser = await supabase.getCurrentUser();

        if (currentUser) {
          // TODO: Fetch user profile from database to get role and permissions
          // For now, set basic user data
          setUser({
            id: currentUser.id,
            email: currentUser.email ?? '',
            firstName: currentUser.user_metadata?.firstName ?? '',
            lastName: currentUser.user_metadata?.lastName ?? '',
            role: currentUser.user_metadata?.role ?? 'worker',
            permissions: currentUser.user_metadata?.permissions ?? [],
          });
          setToken(currentUser.id); // Using user ID as token placeholder
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
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

        if (!isSupabaseAvailable) {
          return {
            success: false,
            error: 'Supabase не настроен. Проверьте конфигурацию.',
          };
        }

        const supabase = getSupabaseService();
        const data = await supabase.signIn(email, password);

        if (data.user) {
          // TODO: Fetch user profile from database to get role and permissions
          const userData: User = {
            id: data.user.id,
            email: data.user.email ?? '',
            firstName: data.user.user_metadata?.firstName ?? '',
            lastName: data.user.user_metadata?.lastName ?? '',
            role: data.user.user_metadata?.role ?? 'worker',
            permissions: data.user.user_metadata?.permissions ?? [],
          };

          setUser(userData);
          setToken(data.session?.access_token || null);

          return { success: true };
        }

        return {
          success: false,
          error: 'Не удалось войти в систему',
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Произошла ошибка при входе',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (isSupabaseAvailable) {
        const supabase = getSupabaseService();
        await supabase.signOut();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setToken(null);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 0);
    }
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
