// Authentication related types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// Job related types (for future use)
export interface Job {
  id: string;
  title: string;
  description: string;
  dockerImage: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  region?: string;
  costSavings?: number;
  carbonSavings?: number;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// Settings related types
export interface UserSettings {
  costWeight: number; // 0-1, weight for cost optimization
  carbonWeight: number; // 0-1, weight for carbon optimization
  maxDelay: number; // maximum delay in hours
  preferredRegions: string[];
}
