/**
 * Authentication related types that match the Go backend models
 */

// User represents a user in the system (matches Go User struct)
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
}

// Authentication Request Types (matches Go request structs)
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Authentication Response Types (matches Go response structs)
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Frontend-specific auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

// Common error response type
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// Auth-related validation errors
export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthValidationErrors {
  email?: string[];
  password?: string[];
  currentPassword?: string[];
  newPassword?: string[];
  general?: string[];
}
