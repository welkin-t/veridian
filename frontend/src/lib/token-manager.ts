/**
 * HTTP interceptor for handling token refresh automatically
 */

import { apiClient } from './api-client';
import { isTokenExpiringSoon } from './jwt-utils';

class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * Check if access token needs refresh and refresh it if necessary
   */
  async ensureValidToken(): Promise<void> {
    const accessToken = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('No tokens available');
    }

    // Check if token is expiring soon (within 5 minutes)
    if (!isTokenExpiringSoon(accessToken, 300)) {
      return; // Token is still valid
    }

    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.refreshTokens();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Manually refresh tokens (public method)
   */
  async refreshTokens(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.refreshToken({ refreshToken });
    
    localStorage.setItem('auth_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

export const tokenManager = new TokenManager();
