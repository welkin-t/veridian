import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, CheckCircle, Shield, Mail, Lock } from 'lucide-react';
import { registerSchema, checkPasswordStrength, type RegisterFormData } from '@/lib/validation';

// --- TYPE DEFINITIONS ---

interface RegisterPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignUp?: (data: RegisterFormData) => Promise<void> | void;
  onGoogleSignIn?: () => void;
  onSignInInstead?: () => void;
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

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;
  
  const { checks, strength } = checkPasswordStrength(password);
  
  const strengthColors: Record<'weak' | 'medium' | 'strong', string> = {
    weak: 'bg-destructive',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels: Record<'weak' | 'medium' | 'strong', string> = {
    weak: 'Weak',
    medium: 'Medium', 
    strong: 'Strong',
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{ width: `${(Object.values(checks).filter(Boolean).length / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${strength === 'strong' ? 'text-green-600' : strength === 'medium' ? 'text-yellow-600' : 'text-destructive'}`}>
          {strengthLabels[strength]}
        </span>
      </div>
      
      <div className="text-xs space-y-1">
        <div className={`flex items-center gap-2 ${checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.length ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
          At least 8 characters
        </div>
        <div className={`flex items-center gap-2 ${checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.uppercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
          One uppercase letter
        </div>
        <div className={`flex items-center gap-2 ${checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.lowercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
          One lowercase letter  
        </div>
        <div className={`flex items-center gap-2 ${checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.number ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
          One number
        </div>
        <div className={`flex items-center gap-2 ${checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.special ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
          One special character (!@#$%^&*...)
        </div>
      </div>
    </div>
  );
};

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
  description = "Join us and start your journey towards a more sustainable future",
  onSignUp,
  onGoogleSignIn,
  onSignInInstead,
  isLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    if (onSignUp) {
      await onSignUp(data);
    }
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="animate-fade-in animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight mb-2">{title}</h1>
            <p className="animate-fade-in animate-delay-200 text-muted-foreground">{description}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="animate-fade-in animate-delay-300 space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <GlassInputWrapper hasError={!!errors.email}>
                <input 
                  {...register('email')}
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                />
              </GlassInputWrapper>
              <FieldError message={errors.email?.message} />
            </div>

            {/* Password */}
            <div className="animate-fade-in animate-delay-400 space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <GlassInputWrapper hasError={!!errors.password}>
                <div className="relative">
                  <input 
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Create a strong password" 
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                    {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                  </button>
                </div>
              </GlassInputWrapper>
              <FieldError message={errors.password?.message} />
              <PasswordStrengthIndicator password={watchPassword || ''} />
            </div>

            {/* Confirm Password */}
            <div className="animate-fade-in animate-delay-500 space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Confirm Password
              </label>
              <GlassInputWrapper hasError={!!errors.confirmPassword}>
                <div className="relative">
                  <input 
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="Confirm your password" 
                    className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-muted-foreground" 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                  </button>
                </div>
              </GlassInputWrapper>
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            {/* Terms & Conditions */}
            <div className="animate-fade-in animate-delay-600 space-y-1">
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input 
                  {...register('acceptTerms')}
                  type="checkbox" 
                  className="w-4 h-4 mt-0.5 text-primary bg-transparent border-2 border-border rounded focus:ring-primary focus:ring-2" 
                />
                <span className="text-foreground/90 leading-relaxed">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </span>
              </label>
              <FieldError message={errors.acceptTerms?.message} />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="animate-fade-in animate-delay-700 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="animate-fade-in animate-delay-800 relative flex items-center justify-center">
            <span className="w-full border-t border-border"></span>
            <span className="px-4 text-sm text-muted-foreground bg-background absolute">Or continue with</span>
          </div>

          <button onClick={onGoogleSignIn} className="animate-fade-in animate-delay-900 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors">
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="animate-fade-in animate-delay-1000 text-center text-sm text-muted-foreground">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSignInInstead?.(); }} className="text-primary hover:underline transition-colors">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
};
