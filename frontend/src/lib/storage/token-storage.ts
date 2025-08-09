/**
 * Token storage abstraction layer
 * Centralizes token storage operations and provides secure storage interface
 */

export interface TokenStorageInterface {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
  hasValidTokens(): boolean;
}

/**
 * LocalStorage implementation of token storage
 * Future: Could be replaced with secure storage, memory storage, etc.
 */
class LocalStorageTokenStorage implements TokenStorageInterface {
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  hasValidTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
}

// Export singleton instance
export const tokenStorage: TokenStorageInterface = new LocalStorageTokenStorage();
