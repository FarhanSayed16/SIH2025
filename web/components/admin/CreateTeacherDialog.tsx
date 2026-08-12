/**
 * Create Teacher Dialog Component
 * Phase 2: Form for creating a new teacher
 */

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminUsersApi, CreateTeacherPayload } from '@/lib/api/adminUsers';
import { validateName, validateEmail, validatePasswordStrength } from '@/lib/utils/validation';

interface CreateTeacherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const CreateTeacherDialog: React.FC<CreateTeacherDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<CreateTeacherPayload>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePasswordStrength(value);
      case 'phone':
        // Phone is optional, but if provided, validate it
        if (value && value.trim() !== '') {
          // Basic phone validation (10 digits)
          const phoneRegex = /^[6-9]\d{9}$/;
          const cleaned = value.replace(/[\s-]/g, '');
          if (!phoneRegex.test(cleaned)) {
            return 'Enter a valid 10-digit phone number starting with 6-9';
          }
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: keyof CreateTeacherPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof CreateTeacherPayload) => {
    const value = formData[field] || '';
    const error = validateField(field, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) newErrors.password = passwordError;

    const phoneError = validateField('phone', formData.phone || '');
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateTeacherPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ...(formData.phone && formData.phone.trim() !== '' && { phone: formData.phone.trim() }),
      };

      const response = await adminUsersApi.createTeacher(payload);

      if (response.success) {
        // Reset form
        setFormData({ name: '', email: '', password: '', phone: '' });
        setErrors({});
        onSuccess();
      } else {
        // Handle backend validation errors
        if (response.error) {
          // Try to parse field-specific errors
          const errorMessage = response.error;
          if (errorMessage.includes('email')) {
            setErrors({ email: 'This email is already in use' });
          } else {
            onError(errorMessage);
          }
        } else {
          onError('Failed to create teacher');
        }
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      if (error.message) {
        if (error.message.includes('email')) {
          setErrors({ email: 'This email is already in use' });
        } else {
          onError(error.message);
        }
      } else {
        onError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', email: '', password: '', phone: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Teacher" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name *"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Enter teacher's full name"
          error={errors.name}
          required
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="teacher@school.com"
          error={errors.email}
          required
        />

        <Input
          label="Password *"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          placeholder="Minimum 8 characters"
          error={errors.password}
          required
        />

        <Input
          label="Phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          placeholder="10-digit phone number (optional)"
          error={errors.phone}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Create Teacher
          </Button>
        </div>
      </form>
    </Modal>
  );
};

