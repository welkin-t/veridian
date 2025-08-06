/**
 * User settings and preferences types (matches Go backend UserSetting struct)
 */

// User settings interface matching Go UserSetting struct
export interface UserSettings {
  userId: string; // Reference to users table (one-to-one)
  costWeight: number; // Weight for cost optimization (0.00-1.00)
  carbonWeight: number; // Weight for carbon optimization (0.00-1.00) 
  updatedAt: string; // Last settings update timestamp
}

// Request interface for updating user settings
export interface UpdateSettingsRequest {
  costWeight?: number; // Must be between 0.00 and 1.00
  carbonWeight?: number; // Must be between 0.00 and 1.00
  // Note: costWeight + carbonWeight must equal 1.00 (enforced by backend)
}

// Response interface for settings operations
export interface UpdateSettingsResponse {
  userId: string;
  costWeight: number;
  carbonWeight: number;
  updatedAt: string;
}

// Frontend-specific settings validation
export interface SettingsValidation {
  isValid: boolean;
  errors: {
    costWeight?: string;
    carbonWeight?: string;
    sum?: string; // For when weights don't sum to 1.00
  };
}

// Settings form data for frontend forms
export interface SettingsFormData {
  costWeight: number;
  carbonWeight: number;
}

// Default settings values
export const DEFAULT_SETTINGS: Pick<UserSettings, 'costWeight' | 'carbonWeight'> = {
  costWeight: 0.50,
  carbonWeight: 0.50,
} as const;
