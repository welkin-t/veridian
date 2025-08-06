import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RegisterPage } from '@/components/ui/register-form';
import { apiClient } from '@/lib/api-client';
import type { RegisterFormData } from '@/lib/validation';

interface RegisterPageProps {}

export const RegisterPageContainer: React.FC<RegisterPageProps> = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: RegisterFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      // Call the backend API with the validated data
      const registerData = {
        firstName: data.name.split(' ')[0] || data.name,
        lastName: data.name.split(' ').slice(1).join(' ') || '',
        email: data.email,
        company: data.company,
        password: data.password,
      };
      
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
        onSignUp={handleRegister}
        onGoogleSignIn={handleGoogleRegister}
        onSignInInstead={handleSignIn}
        isLoading={isLoading}
      />
    </div>
  );
};
