/**
 * Centralized Authentication Service
 * Handles all authentication-related business logic
 */

import { apiClient } from '@/lib/api/unified-api-client';
import { tokenStorage } from '@/lib/storage/token-storage';
import { decodeJWT, isTokenExpired } from '@/lib/jwt-utils';
import { AuthError } from '@/lib/errors/auth-error';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest,
  AuthState 
} from '@/types';

export interface AuthServiceInterface {
  // State queries
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  getAuthState(): AuthState;
  
  // Auth operations
  login(credentials: LoginRequest): Promise<User>;
  register(data: RegisterRequest): Promise<User>;
  logout(): Promise<void>;
  changePassword(data: ChangePasswordRequest): Promise<void>;
  
  // Token management
  refreshToken(): Promise<void>;
  clearSession(): void;
  
  // Initialization
  initialize(): Promise<AuthState>;
}

class AuthService implements AuthServiceInterface {
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current user information from stored token
   */
  getCurrentUser(): User | null {
    const token = tokenStorage.getAccessToken();
    
    if (!token || isTokenExpired(token)) {
      return null;
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Return user object based on token payload
    // Note: This is basic info from token, for full user data, make API call
    return {
      id: payload.sub,
      email: payload.email,
      emailVerified: true, // Assume verified if they have a valid token
      isActive: true,
      createdAt: new Date(payload.iat * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }

  /**
   * Get complete authentication state
   */
  getAuthState(): AuthState {
    const isAuthenticated = this.isAuthenticated();
    const user = isAuthenticated ? this.getCurrentUser() : null;

    return {
      user,
      isAuthenticated,
      isLoading: false,
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await apiClient.login(credentials);
      return response.user;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.fromApiError(error);
    }
  }

  /**
   * Register new user account
   */
  async register(data: RegisterRequest): Promise<User> {
    try {
      const response = await apiClient.register(data);
      return response.user;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.fromApiError(error);
    }
  }

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      // Log warning but don't throw - we want to clear local state regardless
      console.warn('Logout API call failed:', error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.changePassword(data);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.fromApiError(error);
    }
  }

  /**
   * Manually refresh authentication tokens
   */
  async refreshToken(): Promise<void> {
    try {
      // The unified API client handles token refresh internally
      // This method exists for explicit refresh requests
      const token = tokenStorage.getAccessToken();
      if (token && !isTokenExpired(token)) {
        return; // Token is still valid
      }
      
      // Force a token refresh by making an authenticated request
      // The API client will automatically refresh if needed
      await apiClient.authenticatedRequest('/auth/verify', { method: 'GET' });
    } catch (error) {
      this.clearSession();
      if (error instanceof AuthError) {
        throw error;
      }
      throw AuthError.refreshFailed('Unable to refresh authentication');
    }
  }

  /**
   * Clear all authentication data
   */
  clearSession(): void {
    tokenStorage.clearTokens();
  }

  /**
   * Initialize auth state on app startup
   * Returns the initial auth state
   */
  async initialize(): Promise<AuthState> {
    try {
      // Check if we have valid tokens
      if (!tokenStorage.hasValidTokens()) {
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
        };
      }

      // Verify tokens are still valid
      const token = tokenStorage.getAccessToken();
      if (!token || isTokenExpired(token)) {
        this.clearSession();
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
        };
      }

      // Return current state
      return this.getAuthState();
    } catch (error) {
      // If there's any error during initialization, clear session
      this.clearSession();
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    }
  }
}

// Export singleton instance
export const authService: AuthServiceInterface = new AuthService();
