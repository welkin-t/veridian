import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  confirmPassword: string;
  acceptTerms?: boolean;
}

export interface RegisterFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

interface RegisterPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRegister?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleRegister?: () => void;
  onSignIn?: () => void;
  showPasswordRules?: boolean;
  errors?: RegisterFormErrors;
  isLoading?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, hasError = false }: { children: React.ReactNode; hasError?: boolean }) => (
  <div className={`rounded-2xl border backdrop-blur-sm transition-all duration-200 focus-within:bg-primary/10 ${
    hasError 
      ? 'border-destructive bg-destructive/5 focus-within:border-destructive' 
      : 'border-border bg-card/40 focus-within:border-primary/70'
  }`}>
    {children}
  </div>
);

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-destructive mt-1">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

const PasswordRule = ({ isValid, children }: { isValid: boolean; children: React.ReactNode }) => (
  <div className="flex items-center space-x-2">
    {isValid ? (
      <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
    ) : (
      <span className="w-3 h-3 rounded-full border border-muted-foreground flex-shrink-0"></span>
    )}
    <span className={isValid ? "text-primary" : "text-muted-foreground"}>{children}</span>
  </div>
);

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- MAIN COMPONENT ---

export const RegisterPage: React.FC<RegisterPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Create Account</span>,
  description = "Join us to optimize your cloud workloads for efficiency and sustainability",
  onRegister,
  onGoogleRegister,
  onSignIn,
  showPasswordRules = true,
  errors = {},
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password validation helpers
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const showPasswordMismatch = Boolean(confirmPassword && !passwordsMatch);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-4">
            <h1 className="animate-fade-in animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-fade-in animate-delay-200 text-muted-foreground">{description}</p>
          </div>

          <form className="space-y-6" onSubmit={onRegister}>
            {/* Name Fields Row */}
            <div className="animate-fade-in animate-delay-300 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <GlassInputWrapper hasError={!!errors.firstName}>
                  <input 
                    name="firstName" 
                    type="text" 
                    placeholder="John" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                    required 
                  />
                </GlassInputWrapper>
                <FieldError message={errors.firstName} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <GlassInputWrapper hasError={!!errors.lastName}>
                  <input 
                    name="lastName" 
                    type="text" 
                    placeholder="Doe" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                    required 
                  />
                </GlassInputWrapper>
                <FieldError message={errors.lastName} />
              </div>
            </div>

            {/* Email Field */}
            <div className="animate-fade-in animate-delay-400 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <GlassInputWrapper hasError={!!errors.email}>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="john.doe@company.com" 
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                  required 
                />
              </GlassInputWrapper>
              <FieldError message={errors.email} />
            </div>

            {/* Company Field */}
            <div className="animate-fade-in animate-delay-500 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <GlassInputWrapper hasError={!!errors.company}>
                <input 
                  name="company" 
                  type="text" 
                  placeholder="Your Company Name" 
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                  required 
                />
              </GlassInputWrapper>
              <FieldError message={errors.company} />
            </div>

            {/* Password Field */}
            <div className="animate-fade-in animate-delay-600 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <GlassInputWrapper hasError={!!errors.password}>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Create a strong password" 
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                    {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                  </button>
                </div>
              </GlassInputWrapper>
              <FieldError message={errors.password} />
            </div>

            {/* Confirm Password Field */}
            <div className="animate-fade-in animate-delay-700 space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
              <GlassInputWrapper hasError={!!errors.confirmPassword || Boolean(confirmPassword && !passwordsMatch)}>
                <div className="relative">
                  <input 
                    name="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="Confirm your password" 
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                  </button>
                </div>
              </GlassInputWrapper>
              <FieldError message={errors.confirmPassword || (Boolean(confirmPassword && !passwordsMatch) ? "Passwords do not match" : undefined)} />
            </div>

            {/* Password Requirements */}
            {showPasswordRules && password && (
              <div className="animate-fade-in animate-delay-800 bg-card/20 rounded-2xl p-4 border border-border space-y-3">
                <p className="font-medium text-sm text-foreground">Password Requirements:</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <PasswordRule isValid={hasMinLength}>At least 8 characters</PasswordRule>
                  <PasswordRule isValid={hasUppercase}>One uppercase letter</PasswordRule>
                  <PasswordRule isValid={hasLowercase}>One lowercase letter</PasswordRule>
                  <PasswordRule isValid={hasNumber}>One number</PasswordRule>
                  {confirmPassword && (
                    <PasswordRule isValid={passwordsMatch}>Passwords match</PasswordRule>
                  )}
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="animate-fade-in animate-delay-900">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  name="acceptTerms" 
                  className="w-4 h-4 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2 mt-0.5" 
                  required 
                />
                <span className="text-xs text-muted-foreground">
                  I agree to optimize cloud workloads for a more sustainable future and accept the terms of service
                </span>
              </div>
              <FieldError message={errors.acceptTerms} />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="animate-fade-in animate-delay-1000 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="animate-fade-in animate-delay-1100 relative flex items-center justify-center">
            <span className="w-full border-t border-border"></span>
            <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
          </div>

          <button onClick={onGoogleRegister} className="animate-fade-in animate-delay-1200 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors">
              <GoogleIcon />
              Continue with Google
          </button>

          <p className="animate-fade-in animate-delay-1300 text-center text-sm text-muted-foreground">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSignIn?.(); }} className="text-primary hover:underline transition-colors">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};
