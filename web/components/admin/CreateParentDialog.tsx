/**
 * Create Parent Dialog Component
 * Phase 2: Form for creating a new parent
 */

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminUsersApi, CreateParentPayload } from '@/lib/api/adminUsers';
import { validateName, validatePhone, validateEmail, validatePasswordStrength } from '@/lib/utils/validation';

interface CreateParentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const CreateParentDialog: React.FC<CreateParentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<CreateParentPayload>({
    name: '',
    phone: '',
    password: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'phone':
        return validatePhone(value, true); // Required
      case 'password':
        return validatePasswordStrength(value);
      case 'email':
        // Email is optional, but if provided, validate it
        if (value && value.trim() !== '') {
          return validateEmail(value);
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: keyof CreateParentPayload, value: string) => {
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

  const handleBlur = (field: keyof CreateParentPayload) => {
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

    const phoneError = validateField('phone', formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validateField('password', formData.password);
    if (passwordError) newErrors.password = passwordError;

    const emailError = validateField('email', formData.email || '');
    if (emailError) newErrors.email = emailError;

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
      const payload: CreateParentPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        ...(formData.email && formData.email.trim() !== '' && { email: formData.email.trim().toLowerCase() }),
      };

      const response = await adminUsersApi.createParent(payload);

      if (response.success) {
        // Reset form
        setFormData({ name: '', phone: '', password: '', email: '' });
        setErrors({});
        onSuccess();
      } else {
        // Handle backend validation errors
        if (response.error) {
          const errorMessage = response.error;
          if (errorMessage.includes('phone')) {
            setErrors({ phone: 'This phone number is already in use' });
          } else if (errorMessage.includes('email')) {
            setErrors({ email: 'This email is already in use' });
          } else {
            onError(errorMessage);
          }
        } else {
          onError('Failed to create parent');
        }
      }
    } catch (error: any) {
      console.error('Error creating parent:', error);
      if (error.message) {
        if (error.message.includes('phone')) {
          setErrors({ phone: 'This phone number is already in use' });
        } else if (error.message.includes('email')) {
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
      setFormData({ name: '', phone: '', password: '', email: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Parent" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name *"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Enter parent's full name"
          error={errors.name}
          required
        />

        <Input
          label="Phone *"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          placeholder="10-digit phone number"
          error={errors.phone}
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
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="parent@example.com (optional)"
          error={errors.email}
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
            Create Parent
          </Button>
        </div>
      </form>
    </Modal>
  );
};

