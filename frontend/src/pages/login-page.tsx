import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignInPage, type Testimonial, type LoginFormErrors } from '@/components/ui/sign-in';
import { apiClient } from '@/lib/api-client';

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&q=80",
    name: "Sarah Chen",
    handle: "@sarahtech",
    text: "Veridian reduced our cloud costs by 40% while cutting carbon emissions. Game-changer for sustainable ops!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    name: "Marcus Johnson",
    handle: "@marcuscloud",
    text: "Smart scheduling means our workloads run when energy is cleanest and cheapest. Perfect platform!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    name: "David Martinez",
    handle: "@davidops",
    text: "The carbon-aware scheduling is brilliant. We're meeting sustainability goals without sacrificing performance."
  },
];

// Helper function to validate email format
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface LoginPageProps {}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get success message from registration redirect
  const successMessage = location.state?.message;

  const validateForm = (formData: FormData): LoginFormErrors => {
    const errors: LoginFormErrors = {};
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Email validation
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    return errors;
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setErrors({});
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      // Call the backend API
      const response = await apiClient.login(data);
      
      // Store auth token
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      // On successful login, navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Set field-specific error for wrong credentials
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        setErrors({ email: 'Invalid email or password' });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
        setServerError(errorMessage);
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    // TODO: Implement Google OAuth
    alert("Google Sign-In coming soon!");
  };
  
  const handleResetPassword = () => {
    navigate('/forgot-password');
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  return (
    <div className="bg-background text-foreground">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          <Alert className="border-primary/20 bg-primary/5">
            <Leaf className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {serverError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        </div>
      )}

      <SignInPage
        title={
          <div className="flex items-center gap-3">
            <Leaf className="h-10 w-10 text-primary" />
            <span className="font-light text-foreground tracking-tighter">Welcome to Veridian</span>
          </div>
        }
        description="Sign in to optimize your cloud workloads for cost and carbon efficiency"
        heroImageSrc="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        errors={errors}
        isLoading={isLoading}
      />
    </div>
  );
};
