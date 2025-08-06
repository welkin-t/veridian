import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { decodeJWT, isTokenExpired } from '@/lib/jwt-utils';
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

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (token && refreshToken) {
        // Check if token is valid and not expired
        if (!isTokenExpired(token)) {
          const payload = decodeJWT(token);
          if (payload) {
            setState({
              user: {
                id: payload.sub,
                email: payload.email,
                emailVerified: true, // We'll assume verified if they have a valid token
                isActive: true,
                createdAt: new Date(payload.iat * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }
        
        // Token is expired or invalid - clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
      }));
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await apiClient.login(credentials);
      
      // Store tokens
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await apiClient.register(data);
      
      // Store tokens
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      await apiClient.logout();
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      console.warn('Logout request failed:', error);
    }
    
    // Clear local state regardless of backend response
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async (): Promise<void> => {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.refreshToken({
        refreshToken: currentRefreshToken,
      });
      
      // Update tokens
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      
    } catch (error) {
      // If refresh fails, log user out
      logout();
      throw error;
    }
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.changePassword(data);
  };

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
