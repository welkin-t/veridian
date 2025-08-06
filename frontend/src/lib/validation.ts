import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().optional(),
});

// Register form validation schema (matches backend RegisterRequest)
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
})
.refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(1, 'New password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
})
.refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

// Job creation validation schema (matches backend CreateJobRequest)
export const createJobSchema = z.object({
  imageUri: z
    .string()
    .min(1, 'Container image URI is required')
    .url('Please enter a valid container image URI'),
  envVars: z
    .record(z.string(), z.any())
    .optional()
    .default({}),
  delayToleranceHours: z
    .number()
    .min(0, 'Delay tolerance cannot be negative')
    .max(168, 'Delay tolerance cannot exceed 168 hours (1 week)')
    .int('Delay tolerance must be a whole number'),
});

// Settings validation schema (matches backend constraints)
export const settingsSchema = z.object({
  costWeight: z
    .number()
    .min(0, 'Cost weight must be at least 0.00')
    .max(1, 'Cost weight cannot exceed 1.00')
    .refine(val => Number(val.toFixed(2)) === val, {
      message: 'Cost weight can only have 2 decimal places',
    }),
  carbonWeight: z
    .number()
    .min(0, 'Carbon weight must be at least 0.00')
    .max(1, 'Carbon weight cannot exceed 1.00')
    .refine(val => Number(val.toFixed(2)) === val, {
      message: 'Carbon weight can only have 2 decimal places',
    }),
})
.refine(data => Math.abs(data.costWeight + data.carbonWeight - 1.0) < 0.001, {
  message: 'Cost weight and carbon weight must sum to exactly 1.00',
  path: ['carbonWeight'], // Show error on carbon weight field
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CreateJobFormData = z.infer<typeof createJobSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;

// Password strength checker helper
export const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  const strength: 'weak' | 'medium' | 'strong' = score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong';
  
  return {
    checks,
    score,
    strength,
  };
};
