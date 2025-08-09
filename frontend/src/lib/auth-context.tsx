import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '@/lib/auth/auth-service';
import type { 
  AuthContextType, 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest 
} from '@/types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const initialState = await authService.initialize();
        setState(initialState);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.login(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.register(data);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      await authService.refreshToken();
      // Update state with current auth status
      const currentState = authService.getAuthState();
      setState(currentState);
    } catch (error) {
      // If refresh fails, clear auth state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await authService.changePassword(data);
    } catch (error) {
      throw error;
    }
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
