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

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.request<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.request<void>('/auth/logout', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ refreshToken }),
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
    return this.request<CreateJobResponse>('/jobs', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getUserJobs(limit?: number): Promise<Job[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<Job[]>(`/jobs${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async updateJob(jobId: string, data: UpdateJobRequest): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteJob(jobId: string): Promise<void> {
    return this.request<void>(`/jobs/${jobId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async getJobExecutions(jobId: string, limit?: number): Promise<JobExecution[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<JobExecution[]>(`/jobs/${jobId}/executions${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  // User settings endpoints
  async getUserSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/settings', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async updateUserSettings(data: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    return this.request<UpdateSettingsResponse>('/settings', {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
