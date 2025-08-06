import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignInPage, type Testimonial } from '@/components/ui/sign-in';
import { useAuth } from '@/lib/auth-context';
import { type LoginFormData } from '@/lib/validation';
import greenImage from '@/assets/green.png';

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80",
    name: "Sarah Chen",
    handle: "@sarahtech",
    text: "Veridian reduced our cloud costs by 40% while cutting carbon emissions. Game-changer for sustainable ops!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    name: "Marcus Johnson",
    handle: "@marcuscloud",
    text: "Smart scheduling means our workloads run when energy is cleanest and cheapest. Perfect platform!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&q=80",
    name: "David Martinez",
    handle: "@davidops",
    text: "The carbon-aware scheduling is brilliant. We're meeting sustainability goals without sacrificing performance."
  },
];

interface LoginPageProps {}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  // Get success message from registration redirect
  const successMessage = location.state?.message;

  const handleSignIn = async (data: LoginFormData) => {
    setServerError(null);

    try {
      // Use AuthContext login method
      await login({
        email: data.email,
        password: data.password,
      });
      
      // Navigate to intended destination or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
      setServerError(errorMessage);
      console.error('Login error:', error);
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
        heroImageSrc={greenImage}
        testimonials={testimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
      />
    </div>
  );
};
