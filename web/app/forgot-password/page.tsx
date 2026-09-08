/**
 * Forgot Password page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateEmail } from '@/lib/utils/validation';
import { KavachLogo } from '@/components/branding/KavachLogo';

interface FieldErrors {
  email: string | null;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState({ email: false });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({ email: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate field and update errors
  const validateField = (fieldName: keyof FieldErrors, value: string) => {
    let error: string | null = null;
    
    if (fieldName === 'email') {
      error = validateEmail(value);
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
    
    // Mark all fields as touched
    setTouched({ email: true });
    
    return emailValid;
  };

  // Get error for a field
  const getFieldError = (fieldName: keyof FieldErrors): string | undefined => {
    if (touched[fieldName] && clientErrors[fieldName]) {
      return clientErrors[fieldName];
    }
    return undefined;
  };

  // Check if form is valid for submission
  const isFormValid = (): boolean => {
    if (!email.trim()) {
      return false;
    }
    
    if (clientErrors.email) {
      return false;
    }
    
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError(null);
    
    // Clear client error when user starts typing
    if (touched.email) {
      validateField('email', value);
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    validateField('email', email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error: any) {
      // Even on error, show success message for security (don't reveal if email exists)
      setIsSuccess(true);
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="mt-2 text-sm text-gray-600">
              If this email is registered, we have sent a password reset link.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              The link will expire in 30 minutes.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Back to Login
            </Button>
            <Button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setError(null);
              }}
              variant="outline"
              className="w-full"
            >
              Request Another Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center flex flex-col items-center">
          <KavachLogo slot="login" className="mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">Kavach</h1>
          <p className="mt-2 text-sm text-gray-600">Forgot Password</p>
          <p className="mt-1 text-xs text-gray-500">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
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
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !isFormValid()}
          >
            Send Reset Link
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

