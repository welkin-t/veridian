import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Mail, Lock, Leaf } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Get success message from registration redirect
  const successMessage = location.state?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Call the backend API
      const response = await apiClient.login(data);
      
      // Store auth token (assuming it's returned in response)
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      // On successful login, navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
      setServerError(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Veridian Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Veridian</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Intelligent Carbon-Aware Cloud Workload Scheduler
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Veridian account to continue optimizing your cloud workloads
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Success Message from Registration */}
              {successMessage && (
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Server Error Alert */}
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Create account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>
            Secure access to your carbon-optimized cloud management platform.
          </p>
        </div>
      </div>
    </div>
  );
};
