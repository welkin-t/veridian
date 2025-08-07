/**
 * Job and execution related types (matches Go backend models)
 */

// Job interface
export interface Job {
  id: string;
  owner_id: string;
  image_uri: string;
  env_vars: Record<string, any>; // JSON object as key-value pairs
  delay_tolerance_hours: number; // 0-168 hours (1 week max)
  created_at: string;
  updated_at: string;
}

// Execution interface
export interface JobExecution {
  id: string;
  job_id: string;
  status: ExecutionStatus;
  chosen_at?: string | null; // When scheduler selected this execution
  cloud_region?: string | null;
  vm_type?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  exit_code?: number | null; // Container exit code (0 = success)
  log_uri?: string | null; // URI to execution logs in object storage
  cost_estimate_usd?: number | null; // Estimated cost before execution
  cost_actual_usd?: number | null; // Actual cost after execution
  carbon_intensity_g_kwh?: number | null; // Carbon intensity (g CO2/kWh)
  carbon_emitted_kg?: number | null; // Total carbon emissions (kg CO2)
  created_at: string;
}

// Execution status enum matching Go ExecutionStatus
export type ExecutionStatus = 
  | 'pending'           // Waiting to be scheduled
  | 'evaluating'        // Scheduler is finding optimal resources
  | 'running'           // Currently executing on VM
  | 'completed_success' // Finished successfully
  | 'completed_error'   // Finished with error
  | 'orphaned';         // VM created but couldn't be destroyed

// Job creation request matching Go CreateJobRequest (using snake_case)
export interface CreateJobRequest {
  image_uri: string;
  env_vars?: Record<string, any>;
  delay_tolerance_hours: number; // Required, 0-168 hours
}

// Job creation response matching Go CreateJobResponse (using snake_case)
export interface CreateJobResponse {
  id: string;
  owner_id: string;
  image_uri: string;
  env_vars: Record<string, any>;
  delay_tolerance_hours: number;
  created_at: string;
  updated_at: string;
}

// Update job request
export interface UpdateJobRequest {
  image_uri?: string;
  env_vars?: Record<string, any>;
  delay_tolerance_hours?: number;
}

// Frontend-specific job statistics and analytics
export interface JobStats {
  totalJobs: number;
  pendingExecutions: number;
  evaluatingExecutions: number;
  runningExecutions: number;
  completedSuccessExecutions: number;
  completedErrorExecutions: number;
  orphanedExecutions: number;
  totalCostSavingsUsd: number;
  totalCarbonEmittedKg: number;
}

// Execution statistics from backend
export interface ExecutionStats {
  totalExecutions: number;
  avgCostUsd: number;
  totalCarbonKg: number;
  avgDelayHours: number;
}
