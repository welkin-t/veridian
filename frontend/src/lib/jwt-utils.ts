/**
 * JWT token utilities for authentication
 */

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
}

/**
 * Decode JWT token payload without verification
 * Note: This is for client-side convenience only - never trust JWT payload on frontend
 */
export const decodeJWT = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    return decoded as TokenPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get time until token expiration in seconds
 */
export const getTokenExpirationTime = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
};

/**
 * Check if token expires within the given number of seconds
 */
export const isTokenExpiringSoon = (token: string, bufferSeconds: number = 300): boolean => {
  const timeUntilExpiration = getTokenExpirationTime(token);
  return timeUntilExpiration <= bufferSeconds;
};
