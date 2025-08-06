/**
 * API request interceptor that automatically handles token refresh
 */

import { tokenManager } from './token-manager';

class AuthenticatedApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  async authenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // 1. Ensure we have valid token (refresh if needed)
    try {
      await tokenManager.ensureValidToken();
    } catch (error) {
      // Token refresh failed - redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    // 2. Get current token
    const token = localStorage.getItem('auth_token');
    
    // 3. Make request with token
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // 4. Handle 401 responses
    if (response.status === 401) {
      // Token might be invalid - try refresh once
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          await tokenManager.refreshTokens();
          
          // Retry request with new token
          const newToken = localStorage.getItem('auth_token');
          return fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              ...options.headers,
            },
          }).then(res => res.json());
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
        throw new Error('Authentication expired');
      }
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const authenticatedApiClient = new AuthenticatedApiClient(
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
);
