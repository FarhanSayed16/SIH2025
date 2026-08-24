/**
 * Login page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KavachLogo } from '@/components/branding/KavachLogo';

interface FieldErrors {
  email: string | null;
  password: string | null;
}

interface TouchedFields {
  email: boolean;
  password: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, fieldErrors: backendFieldErrors, clearError } = useAuthStore();
  
  // Form values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Validation state
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
  });
  
  const [clientErrors, setClientErrors] = useState<FieldErrors>({
    email: null,
    password: null,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const { user } = useAuthStore.getState();
      // Redirect based on role
      if (user?.role === 'parent') {
        router.push('/parent/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, router]);

  // Mark fields as touched when backend errors arrive
  useEffect(() => {
    if (backendFieldErrors) {
      setTouched(prev => ({
        email: prev.email || !!backendFieldErrors.email,
        password: prev.password || !!backendFieldErrors.password,
      }));
    }
  }, [backendFieldErrors]);

  // Validate field and update errors
  const validateField = (fieldName: keyof FieldErrors, value: string) => {
    let error: string | null = null;
    
    if (fieldName === 'email') {
      error = validateEmail(value);
    } else if (fieldName === 'password') {
      error = validatePassword(value);
    }
    
    setClientErrors(prev => ({
      ...prev,
      [fieldName]: error,
    }));
    
    return error === null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const emailValid = validateField('email', email);
    const passwordValid = validateField('password', password);
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });
    
    return emailValid && passwordValid;
  };

  // Get error for a field (client-side or backend)
  const getFieldError = (fieldName: keyof FieldErrors): string | undefined => {
    // Prioritize backend errors if they exist
    if (backendFieldErrors?.[fieldName]) {
      return backendFieldErrors[fieldName];
    }
    
    // Show client-side errors only if field is touched
    if (touched[fieldName] && clientErrors[fieldName]) {
      return clientErrors[fieldName];
    }
    
    return undefined;
  };

  // Check if form has validation errors
  const hasValidationErrors = (): boolean => {
    return !!(clientErrors.email || clientErrors.password || 
             backendFieldErrors?.email || backendFieldErrors?.password);
  };

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    if (!email.trim() || !password.trim()) {
      return false;
    }
    
    if (hasValidationErrors()) {
      return false;
    }
    
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    clearError();
    
    // Clear client error when user starts typing
    if (touched.email) {
      validateField('email', value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    clearError();
    
    // Clear client error when user starts typing
    if (touched.password) {
      validateField('password', value);
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    validateField('email', email);
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    validateField('password', password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      const { user } = useAuthStore.getState();
      // Redirect based on role
      if (user?.role === 'parent') {
        router.push('/parent/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center flex flex-col items-center">
          <KavachLogo slot="login" className="mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">Kavach</h1>
          <p className="mt-2 text-sm text-gray-600">Admin Dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              placeholder="example@gmail.com"
              error={getFieldError('email')}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              placeholder="••••••••"
              error={getFieldError('password')}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !isFormValid()}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <p className="text-center text-sm text-gray-600">
          Demo: Use admin credentials from seed data
        </p>
      </div>
    </div>
  );
}

