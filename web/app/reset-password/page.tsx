/**
 * Reset Password page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validatePasswordStrength } from '@/lib/utils/validation';
import { KavachLogo } from '@/components/branding/KavachLogo';

interface FieldErrors {
  password: string | null;
  confirmPassword: string | null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [clientErrors, setClientErrors] = useState<FieldErrors>({ password: null, confirmPassword: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  // Validate password field
  const validatePasswordField = (value: string) => {
    const error = validatePasswordStrength(value);
    setClientErrors(prev => ({ ...prev, password: error }));
    return error === null;
  };

  // Validate confirm password field
  const validateConfirmPasswordField = (value: string) => {
    let error: string | null = null;
    
    if (!value.trim()) {
      error = 'Please re-enter your password.';
    } else if (value !== password) {
      error = 'Passwords do not match.';
    }
    
    setClientErrors(prev => ({ ...prev, confirmPassword: error }));
    return error === null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const passwordValid = validatePasswordField(password);
    const confirmPasswordValid = validateConfirmPasswordField(confirmPassword);
    
    // Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });
    
    return passwordValid && confirmPasswordValid;
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
    if (!password.trim() || !confirmPassword.trim()) {
      return false;
    }
    
    if (clientErrors.password || clientErrors.confirmPassword) {
      return false;
    }
    
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setError(null);
    
    // Re-validate confirm password when password changes
    if (touched.confirmPassword) {
      validateConfirmPasswordField(confirmPassword);
    }
    
    // Validate password field
    if (touched.password) {
      validatePasswordField(value);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setError(null);
    
    // Validate confirm password field
    if (touched.confirmPassword) {
      validateConfirmPasswordField(value);
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    validatePasswordField(password);
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    validateConfirmPasswordField(confirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authApi.resetPassword(token, password);
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to reset password.';
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900">Password Reset Successful</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>

          <Button
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h1>
            <p className="mt-2 text-sm text-gray-600">
              This reset link is invalid or has expired. Please request a new password reset.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              Back to Login
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
          <p className="mt-2 text-sm text-gray-600">Reset Password</p>
          <p className="mt-1 text-xs text-gray-500">
            Enter your new password below.
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
              label="New Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              placeholder="••••••••"
              error={getFieldError('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={handleConfirmPasswordBlur}
              required
              placeholder="••••••••"
              error={getFieldError('confirmPassword')}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading || !isFormValid()}
          >
            Reset Password
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    </div>
  );
}

