/**
 * Unified API Client with automatic authentication and token management
 */

import { tokenStorage } from '@/lib/storage/token-storage';
import { AuthError, AuthErrorCode } from '@/lib/errors/auth-error';
import { decodeJWT, isTokenExpired } from '@/lib/jwt-utils';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ChangePasswordRequest 
} from '@/types';

interface RequestConfig extends RequestInit {
  requireAuth?: boolean;
}

class UnifiedApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with automatic authentication handling
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requireAuth = false, ...options } = config;
    
    // Handle authentication if required
    if (requireAuth) {
      await this.ensureValidToken();
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth header if we have a token
    if (requireAuth || tokenStorage.hasValidTokens()) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 errors with token refresh
      if (response.status === 401 && requireAuth) {
        await this.handleUnauthorized();
        // Retry request once after token refresh
        return this.request<T>(endpoint, { ...config, requireAuth: false });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T; // For void responses
    } catch (error) {
      throw AuthError.fromApiError(error);
    }
  }

  /**
   * Handle error responses and convert to AuthError
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      }
    } catch {
      // If we can't parse the error response, use a generic message
    }

    const message = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
    
    switch (response.status) {
      case 401:
        throw new AuthError(AuthErrorCode.UNAUTHORIZED, message, errorData.field, response.status);
      case 422:
        throw new AuthError(AuthErrorCode.VALIDATION_ERROR, message, errorData.field, response.status);
      case 404:
        throw new AuthError(AuthErrorCode.USER_NOT_FOUND, message, errorData.field, response.status);
      default:
        throw new AuthError(AuthErrorCode.SERVER_ERROR, message, errorData.field, response.status);
    }
  }

  /**
   * Handle 401 unauthorized responses
   */
  private async handleUnauthorized(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      this.clearAuthState();
      throw AuthError.tokenExpired();
    }

    try {
      await this.refreshTokens();
    } catch (error) {
      this.clearAuthState();
      throw AuthError.refreshFailed();
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (!accessToken || !refreshToken) {
      throw AuthError.tokenExpired();
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    if (isTokenExpired(accessToken) || this.isTokenExpiringSoon(accessToken, 300)) {
      await this.refreshTokens();
    }
  }

  /**
   * Check if token expires within the given number of seconds
   */
  private isTokenExpiringSoon(token: string, bufferSeconds: number): boolean {
    const payload = decodeJWT(token);
    if (!payload) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = payload.exp - currentTime;
    return timeUntilExpiration <= bufferSeconds;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(): Promise<void> {
    // Prevent multiple simultaneous refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw AuthError.refreshFailed('No refresh token available');
    }

    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_at: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      requireAuth: false,
    });

    tokenStorage.setTokens(response.access_token, response.refresh_token);
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    tokenStorage.clearTokens();
  }

  // --- PUBLIC API METHODS ---

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_at: string;
      user: {
        id: string;
        email: string;
        email_verified: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        last_login?: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      requireAuth: false,
    });

    // Store tokens
    tokenStorage.setTokens(response.access_token, response.refresh_token);

    // Transform response to frontend format
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_at,
      user: {
        id: response.user.id,
        email: response.user.email,
        emailVerified: response.user.email_verified,
        isActive: response.user.is_active,
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
        lastLogin: response.user.last_login || null,
      },
    };
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_at: string;
      user: {
        id: string;
        email: string;
        email_verified: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        last_login?: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    });

    // Store tokens
    tokenStorage.setTokens(response.access_token, response.refresh_token);

    // Transform response to frontend format
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_at,
      user: {
        id: response.user.id,
        email: response.user.email,
        emailVerified: response.user.email_verified,
        isActive: response.user.is_active,
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
        lastLogin: response.user.last_login || null,
      },
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', {
        method: 'POST',
        requireAuth: true,
      });
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn('Server logout failed:', error);
    } finally {
      this.clearAuthState();
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.request<void>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
      requireAuth: true,
    });
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = tokenStorage.getAccessToken();
    return !!(token && !isTokenExpired(token));
  }

  /**
   * Get current user from token
   */
  getCurrentUser() {
    const token = tokenStorage.getAccessToken();
    if (!token || isTokenExpired(token)) {
      return null;
    }

    const payload = decodeJWT(token);
    return payload ? {
      id: payload.sub,
      email: payload.email,
    } : null;
  }

  /**
   * Make authenticated request to any endpoint
   */
  async authenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, requireAuth: true });
  }

  // --- JOB MANAGEMENT METHODS ---

  /**
   * Get single job by ID
   */
  async getJob(jobId: string): Promise<any> {
    const response = await this.authenticatedRequest<{
      id: string;
      owner_id: string;
      image_uri: string;
      env_vars: Record<string, any>;
      delay_tolerance_hours: number;
      created_at: string;
      updated_at: string;
    }>(`/api/v1/jobs/${jobId}`);

    // Transform backend response to frontend format
    return {
      id: response.id,
      ownerId: response.owner_id,
      imageUri: response.image_uri,
      envVars: response.env_vars ?? {},
      delayToleranceHours: response.delay_tolerance_hours,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };
  }

  /**
   * Get job executions
   */
  async getJobExecutions(jobId: string): Promise<any[]> {
    const response = await this.authenticatedRequest<{
      id: string;
      job_id: string;
      status: string;
      cloud_region?: string;
      vm_type?: string;
      cost_actual_usd?: number;
      carbon_emitted_kg?: number;
      exit_code?: number;
      started_at?: string;
      completed_at?: string;
      created_at: string;
      updated_at: string;
    }[]>(`/api/v1/jobs/${jobId}/executions`);

    // Transform backend response to frontend format
    return response.map(execution => ({
      id: execution.id,
      jobId: execution.job_id,
      status: execution.status,
      cloudRegion: execution.cloud_region,
      vmType: execution.vm_type,
      costActualUsd: execution.cost_actual_usd,
      carbonEmittedKg: execution.carbon_emitted_kg,
      exitCode: execution.exit_code,
      startedAt: execution.started_at,
      completedAt: execution.completed_at,
      createdAt: execution.created_at,
      updatedAt: execution.updated_at,
    }));
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    await this.authenticatedRequest<void>(`/api/v1/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all jobs for current user
   */
  async getJobs(limit?: number): Promise<any[]> {
    const endpoint = limit ? `/api/v1/jobs?limit=${limit}` : '/api/v1/jobs';
    const response = await this.authenticatedRequest<{
      id: string;
      owner_id: string;
      image_uri: string;
      env_vars: Record<string, any>;
      delay_tolerance_hours: number;
      created_at: string;
      updated_at: string;
    }[]>(endpoint);

    // Transform backend response to frontend format
    return response.map(job => ({
      id: job.id,
      ownerId: job.owner_id,
      imageUri: job.image_uri,
      envVars: job.env_vars ?? {},
      delayToleranceHours: job.delay_tolerance_hours,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    }));
  }

  /**
   * Create a new job
   */
  async createJob(data: {
    imageUri: string;
    envVars?: Record<string, any>;
    delayToleranceHours: number;
  }): Promise<any> {
    const response = await this.authenticatedRequest<{
      id: string;
      owner_id: string;
      image_uri: string;
      env_vars: Record<string, any>;
      delay_tolerance_hours: number;
      created_at: string;
      updated_at: string;
    }>('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify({
        image_uri: data.imageUri,
        env_vars: data.envVars ?? {},
        delay_tolerance_hours: data.delayToleranceHours,
      }),
    });

    // Transform backend response to frontend format
    return {
      id: response.id,
      ownerId: response.owner_id,
      imageUri: response.image_uri,
      envVars: response.env_vars ?? {},
      delayToleranceHours: response.delay_tolerance_hours,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId: string, data: {
    imageUri?: string;
    envVars?: Record<string, any>;
    delayToleranceHours?: number;
  }): Promise<any> {
    const payload: Record<string, any> = {};
    if (data.imageUri !== undefined) payload.image_uri = data.imageUri;
    if (data.envVars !== undefined) payload.env_vars = data.envVars;
    if (data.delayToleranceHours !== undefined) payload.delay_tolerance_hours = data.delayToleranceHours;

    const response = await this.authenticatedRequest<{
      id: string;
      owner_id: string;
      image_uri: string;
      env_vars: Record<string, any>;
      delay_tolerance_hours: number;
      created_at: string;
      updated_at: string;
    }>(`/api/v1/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Transform backend response to frontend format
    return {
      id: response.id,
      ownerId: response.owner_id,
      imageUri: response.image_uri,
      envVars: response.env_vars ?? {},
      delayToleranceHours: response.delay_tolerance_hours,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    };
  }
}

// Export singleton instance
export const apiClient = new UnifiedApiClient();
