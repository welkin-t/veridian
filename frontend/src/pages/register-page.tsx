import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RegisterPage, type RegisterFormErrors } from '@/components/ui/register-form';
import { apiClient } from '@/lib/api-client';

interface RegisterPageProps {}

export const RegisterPageContainer: React.FC<RegisterPageProps> = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});

  const validateForm = (data: { [key: string]: FormDataEntryValue | null }) => {
    const errors: RegisterFormErrors = {};

    // First Name validation
    if (!data.firstName || (data.firstName as string).trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Last Name validation
    if (!data.lastName || (data.lastName as string).trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email as string)) {
      errors.email = 'Please enter a valid email address';
    }

    // Company validation
    if (!data.company || (data.company as string).trim().length < 2) {
      errors.company = 'Company name must be at least 2 characters';
    }

    // Password validation
    const password = data.password as string;
    if (!password) {
      errors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      if (password.length < 8) passwordErrors.push('at least 8 characters');
      if (!/[A-Z]/.test(password)) passwordErrors.push('one uppercase letter');
      if (!/[a-z]/.test(password)) passwordErrors.push('one lowercase letter');
      if (!/[0-9]/.test(password)) passwordErrors.push('one number');
      
      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    // Confirm Password validation
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance validation
    if (!data.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms to continue';
    }

    return errors;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setFormErrors({});
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      company: formData.get('company'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      acceptTerms: formData.get('acceptTerms'),
    };

    // Client-side validation
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Remove confirmPassword from data before sending to API
      const registerData = {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        company: data.company as string,
        password: data.password as string,
      };
      
      // Call the backend API
      await apiClient.register(registerData);
      
      // On successful registration, navigate to login
      navigate('/login', { 
        state: { message: 'Account created successfully! Please log in.' }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setServerError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    console.log("Continue with Google clicked");
    // TODO: Implement Google OAuth
    alert("Google Registration coming soon!");
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="bg-background text-foreground">
      {/* Error Messages */}
      {serverError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        </div>
      )}

      <RegisterPage
        title={
          <div className="flex items-center gap-3 justify-center">
            <Leaf className="h-10 w-10 text-primary" />
            <span className="font-light text-foreground tracking-tighter">Join Veridian</span>
          </div>
        }
        description="Create your account to optimize cloud workloads for cost and carbon efficiency"
        onRegister={handleRegister}
        onGoogleRegister={handleGoogleRegister}
        onSignIn={handleSignIn}
        showPasswordRules={true}
        errors={formErrors}
        isLoading={isLoading}
      />
    </div>
  );
};
