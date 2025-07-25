import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

type AuthMode = 'login' | 'register';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company?: string;
}

interface AuthContainerProps {
  initialMode?: AuthMode;
  onLogin?: (data: LoginFormData) => void;
  onRegister?: (data: RegisterFormData) => void;
  isLoading?: boolean;
}

export function AuthContainer({
  initialMode = 'login',
  onLogin,
  onRegister,
  isLoading = false
}: AuthContainerProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode);

  const handleSwitchToRegister = () => {
    setCurrentMode('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentMode('login');
  };

  const handleLoginSubmit = (data: LoginFormData) => {
    console.log('Login attempt:', data);
    onLogin?.(data);
  };

  const handleRegisterSubmit = (data: RegisterFormData) => {
    console.log('Registration attempt:', data);
    onRegister?.(data);
  };

  if (currentMode === 'login') {
    return (
      <LoginPage
        onSubmit={handleLoginSubmit}
        onSwitchToRegister={handleSwitchToRegister}
        isLoading={isLoading}
      />
    );
  }

  return (
    <RegisterPage
      onSubmit={handleRegisterSubmit}
      onSwitchToLogin={handleSwitchToLogin}
      isLoading={isLoading}
    />
  );
};
