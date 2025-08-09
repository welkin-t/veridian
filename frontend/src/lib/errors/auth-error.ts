/**
 * Standardized error types for authentication system
 */

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_FAILED: 'REFRESH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED'
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];

export class AuthError extends Error {
  public code: AuthErrorCode;
  public field?: string;
  public statusCode?: number;

  constructor(
    code: AuthErrorCode,
    message: string,
    field?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.field = field;
    this.statusCode = statusCode;
  }

  static fromApiError(error: any): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    // Handle different error response formats
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An error occurred';
      
      switch (status) {
        case 401:
          return new AuthError(AuthErrorCode.UNAUTHORIZED, message, data?.field, status);
        case 422:
          return new AuthError(AuthErrorCode.VALIDATION_ERROR, message, data?.field, status);
        case 404:
          return new AuthError(AuthErrorCode.USER_NOT_FOUND, message, data?.field, status);
        default:
          return new AuthError(AuthErrorCode.SERVER_ERROR, message, data?.field, status);
      }
    }

    // Handle network errors
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return new AuthError(AuthErrorCode.NETWORK_ERROR, 'Network connection failed');
    }

    // Default error
    const message = error.message || 'An unexpected error occurred';
    return new AuthError(AuthErrorCode.SERVER_ERROR, message);
  }

  static invalidCredentials(message = 'Invalid email or password'): AuthError {
    return new AuthError(AuthErrorCode.INVALID_CREDENTIALS, message);
  }

  static tokenExpired(message = 'Your session has expired'): AuthError {
    return new AuthError(AuthErrorCode.TOKEN_EXPIRED, message);
  }

  static refreshFailed(message = 'Unable to refresh authentication'): AuthError {
    return new AuthError(AuthErrorCode.REFRESH_FAILED, message);
  }

  static networkError(message = 'Network connection failed'): AuthError {
    return new AuthError(AuthErrorCode.NETWORK_ERROR, message);
  }

  getUserFriendlyMessage(): string {
    switch (this.code) {
      case AuthErrorCode.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case AuthErrorCode.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case AuthErrorCode.NETWORK_ERROR:
        return 'Unable to connect. Please check your internet connection.';
      case AuthErrorCode.EMAIL_NOT_VERIFIED:
        return 'Please verify your email address before signing in.';
      case AuthErrorCode.USER_NOT_FOUND:
        return 'No account found with this email address.';
      case AuthErrorCode.VALIDATION_ERROR:
        return this.message; // Use specific validation message
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
