import type { 
  RegisterRequest, 
  LoginRequest, 
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  CreateJobRequest,
  CreateJobResponse,
  UpdateJobRequest,
  Job,
  JobExecution,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
  UserSettings,
  ApiError 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: 'An unexpected error occurred',
        }));
        throw new Error(errorData.message);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // --- Mapping helpers: backend (snake_case) <-> frontend (camelCase) ---
  private mapJobFromBackend(job: any): Job {
    return {
      id: job.id,
      ownerId: job.owner_id,
      imageUri: job.image_uri,
      envVars: job.env_vars ?? {},
      delayToleranceHours: job.delay_tolerance_hours,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  private mapJobToBackendCreate(data: CreateJobRequest): any {
    return {
      image_uri: data.imageUri,
      env_vars: data.envVars ?? {},
      delay_tolerance_hours: data.delayToleranceHours,
    };
  }

  private mapJobToBackendUpdate(data: UpdateJobRequest): any {
    const payload: Record<string, any> = {};
    if (data.imageUri !== undefined) payload.image_uri = data.imageUri;
    if (data.envVars !== undefined) payload.env_vars = data.envVars;
    if (data.delayToleranceHours !== undefined) payload.delay_tolerance_hours = data.delayToleranceHours;
    return payload;
  }

  private mapCreateJobResponse(job: any): CreateJobResponse {
    return {
      id: job.id,
      ownerId: job.owner_id,
      imageUri: job.image_uri,
      envVars: job.env_vars ?? {},
      delayToleranceHours: job.delay_tolerance_hours,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  private mapExecutionFromBackend(exec: any): JobExecution {
    return {
      id: exec.id,
      jobId: exec.job_id,
      status: exec.status,
      chosenAt: exec.chosen_at ?? null,
      cloudRegion: exec.cloud_region ?? null,
      vmType: exec.vm_type ?? null,
      startedAt: exec.started_at ?? null,
      completedAt: exec.completed_at ?? null,
      exitCode: exec.exit_code ?? null,
      logUri: exec.log_uri ?? null,
      costEstimateUsd: exec.cost_estimate_usd ?? null,
      costActualUsd: exec.cost_actual_usd ?? null,
      carbonIntensityGkwh: exec.carbon_intensity_g_kwh ?? null,
      carbonEmittedKg: exec.carbon_emitted_kg ?? null,
      createdAt: exec.created_at,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Authentication endpoints
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
    });

    // Transform backend response to frontend types
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

  async login(data: LoginRequest): Promise<LoginResponse> {
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
      body: JSON.stringify(data),
    });

    // Transform backend response to frontend types
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

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_at: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: data.refreshToken }),
    });

    // Transform backend response to frontend types
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_at,
    };
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request<void>('/api/v1/auth/change-password', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  // Get user profile (protected route)
  async getProfile(): Promise<{ user: any }> {
    return this.request<{ user: any }>('/api/v1/auth/profile', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.request<void>('/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        // Even if logout fails on server, we should clear local storage
        console.warn('Logout request failed:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Job management endpoints
  async createJob(data: CreateJobRequest): Promise<CreateJobResponse> {
    const payload = this.mapJobToBackendCreate(data);
    const raw = await this.request<any>('/api/v1/jobs', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.mapCreateJobResponse(raw);
  }

  async getJob(jobId: string): Promise<Job> {
    const raw = await this.request<any>(`/api/v1/jobs/${jobId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.mapJobFromBackend(raw);
  }

  async getUserJobs(limit?: number): Promise<{ jobs: Job[] }> {
    const params = limit ? `?limit=${limit}` : '';
    const raw = await this.request<{ jobs: any[] }>(`/api/v1/jobs${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return { jobs: (raw.jobs || []).map(this.mapJobFromBackend.bind(this)) };
  }

  async updateJob(jobId: string, data: UpdateJobRequest): Promise<Job> {
    const payload = this.mapJobToBackendUpdate(data);
    const raw = await this.request<any>(`/api/v1/jobs/${jobId}`, {
      method: 'PUT', // Backend uses PUT, not PATCH
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.mapJobFromBackend(raw);
  }

  async deleteJob(jobId: string): Promise<void> {
    return this.request<void>(`/api/v1/jobs/${jobId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Note: This endpoint doesn't exist in backend yet, fallback to empty array
  async getJobExecutions(jobId: string, limit?: number): Promise<JobExecution[]> {
    try {
      const params = limit ? `?limit=${limit}` : '';
  const raw = await this.request<any[]>(`/api/v1/jobs/${jobId}/executions${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
  });
  return (raw || []).map(this.mapExecutionFromBackend.bind(this));
    } catch (error) {
      console.warn(`Executions endpoint not implemented yet for job ${jobId}`);
      // Return empty array as fallback
      return [];
    }
  }

  // User settings endpoints (these don't exist in backend yet)
  async getUserSettings(): Promise<UserSettings> {
    try {
      return this.request<UserSettings>('/api/v1/settings', {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Settings endpoint not implemented yet');
      // Return default settings as fallback
      return {
        id: 'default',
        userId: 'unknown',
        costWeight: 0.6,
        carbonWeight: 0.4,
        maxDelayHours: 168,
        preferredRegions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as UserSettings;
    }
  }

  async updateUserSettings(data: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    try {
      return this.request<UpdateSettingsResponse>('/api/v1/settings', {
        method: 'PUT', // Backend would use PUT
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Settings update endpoint not implemented yet');
      throw new Error('Settings update not available yet');
    }
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
