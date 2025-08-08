/**
 * Job and execution related types (frontend camelCase models)
 * These represent the canonical shapes used across the UI.
 */

// Job interface
export interface Job {
  id: string;
  ownerId: string;
  imageUri: string;
  envVars: Record<string, any>; // JSON object as key-value pairs
  delayToleranceHours: number; // 0-168 hours (1 week max)
  createdAt: string;
  updatedAt: string;
}

// Execution interface
export interface JobExecution {
  id: string;
  jobId: string;
  status: ExecutionStatus;
  chosenAt?: string | null; // When scheduler selected this execution
  cloudRegion?: string | null;
  vmType?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  exitCode?: number | null; // Container exit code (0 = success)
  logUri?: string | null; // URI to execution logs in object storage
  costEstimateUsd?: number | null; // Estimated cost before execution
  costActualUsd?: number | null; // Actual cost after execution
  carbonIntensityGkwh?: number | null; // Carbon intensity (g CO2/kWh)
  carbonEmittedKg?: number | null; // Total carbon emissions (kg CO2)
  createdAt: string;
}

// Execution status enum matching Go ExecutionStatus
export type ExecutionStatus = 
  | 'pending'           // Waiting to be scheduled
  | 'evaluating'        // Scheduler is finding optimal resources
  | 'running'           // Currently executing on VM
  | 'completed_success' // Finished successfully
  | 'completed_error'   // Finished with error
  | 'orphaned';         // VM created but couldn't be destroyed

// Job creation request (frontend camelCase)
export interface CreateJobRequest {
  imageUri: string;
  envVars?: Record<string, any>;
  delayToleranceHours: number; // Required, 0-168 hours
}

// Job creation response (frontend camelCase)
export interface CreateJobResponse {
  id: string;
  ownerId: string;
  imageUri: string;
  envVars: Record<string, any>;
  delayToleranceHours: number;
  createdAt: string;
  updatedAt: string;
}

// Update job request
export interface UpdateJobRequest {
  imageUri?: string;
  envVars?: Record<string, any>;
  delayToleranceHours?: number;
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
