/**
 * Create Student Dialog Component
 * Phase 2: Form for creating a new student (roster record)
 */

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminUsersApi, CreateStudentPayload } from '@/lib/api/adminUsers';
import { validateName, validatePhone } from '@/lib/utils/validation';

interface CreateStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const GRADES: Array<'KG' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'> = [
  'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

export const CreateStudentDialog: React.FC<CreateStudentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<CreateStudentPayload>({
    name: '',
    grade: '1',
    section: '',
    rollNo: '',
    parentName: '',
    parentPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'grade':
        if (!value || value.trim() === '') {
          return 'Grade is required';
        }
        return null;
      case 'section':
        if (!value || value.trim() === '') {
          return 'Section is required';
        }
        return null;
      case 'parentPhone':
        // Parent phone is optional, but if provided, validate it
        if (value && value.trim() !== '') {
          return validatePhone(value, false);
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: keyof CreateStudentPayload, value: string) => {
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

  const handleBlur = (field: keyof CreateStudentPayload) => {
    const value = formData[field] || '';
    const error = validateField(field, value as string);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const gradeError = validateField('grade', formData.grade);
    if (gradeError) newErrors.grade = gradeError;

    const sectionError = validateField('section', formData.section);
    if (sectionError) newErrors.section = sectionError;

    const parentPhoneError = validateField('parentPhone', formData.parentPhone || '');
    if (parentPhoneError) newErrors.parentPhone = parentPhoneError;

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
      const payload: CreateStudentPayload = {
        name: formData.name.trim(),
        grade: formData.grade,
        section: formData.section.trim().toUpperCase(),
        ...(formData.rollNo && formData.rollNo.trim() !== '' && { rollNo: formData.rollNo.trim() }),
        ...(formData.parentName && formData.parentName.trim() !== '' && { parentName: formData.parentName.trim() }),
        ...(formData.parentPhone && formData.parentPhone.trim() !== '' && { parentPhone: formData.parentPhone.trim() }),
      };

      const response = await adminUsersApi.createStudent(payload);

      if (response.success) {
        // Reset form
        setFormData({ name: '', grade: '1', section: '', rollNo: '', parentName: '', parentPhone: '' });
        setErrors({});
        onSuccess();
      } else {
        // Handle backend validation errors
        if (response.error) {
          const errorMessage = response.error;
          if (errorMessage.includes('rollNo') || errorMessage.includes('roll number')) {
            setErrors({ rollNo: 'This roll number already exists in this institution' });
          } else {
            onError(errorMessage);
          }
        } else {
          onError('Failed to create student');
        }
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      if (error.message) {
        if (error.message.includes('rollNo') || error.message.includes('roll number')) {
          setErrors({ rollNo: 'This roll number already exists in this institution' });
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
      setFormData({ name: '', grade: '1', section: '', rollNo: '', parentName: '', parentPhone: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Student (Roster Record)" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name *"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="Enter student's full name"
          error={errors.name}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grade *
          </label>
          <select
            value={formData.grade}
            onChange={(e) => handleChange('grade', e.target.value)}
            onBlur={() => handleBlur('grade')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.grade ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade === 'KG' ? 'Kindergarten' : `Grade ${grade}`}
              </option>
            ))}
          </select>
          {errors.grade && (
            <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
          )}
        </div>

        <Input
          label="Section *"
          type="text"
          value={formData.section}
          onChange={(e) => handleChange('section', e.target.value)}
          onBlur={() => handleBlur('section')}
          placeholder="A, B, C, etc."
          error={errors.section}
          required
        />

        <Input
          label="Roll Number"
          type="text"
          value={formData.rollNo || ''}
          onChange={(e) => handleChange('rollNo', e.target.value)}
          placeholder="Optional - unique within institution"
          error={errors.rollNo}
        />

        <Input
          label="Parent Name"
          type="text"
          value={formData.parentName || ''}
          onChange={(e) => handleChange('parentName', e.target.value)}
          placeholder="Optional"
        />

        <Input
          label="Parent Phone"
          type="tel"
          value={formData.parentPhone || ''}
          onChange={(e) => handleChange('parentPhone', e.target.value)}
          onBlur={() => handleBlur('parentPhone')}
          placeholder="10-digit phone number (optional)"
          error={errors.parentPhone}
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
            Create Student
          </Button>
        </div>
      </form>
    </Modal>
  );
};

