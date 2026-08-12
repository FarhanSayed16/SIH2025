/**
 * Client-side validation utilities
 */

/**
 * Validate email format (for login - allows any valid email)
 */
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Enter a valid email address';
  }

  // No Gmail requirement for login - allows existing users to login
  return null;
};

/**
 * Validate email format with Gmail requirement (for registration only)
 */
export const validateEmailForRegistration = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Enter a valid email address';
  }

  // Gmail requirement for new registrations
  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return 'Use a Gmail address (example@gmail.com)';
  }

  return null;
};

/**
 * Validate password (required only for login)
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }

  return null;
};

/**
 * Validate password for registration (with strength requirements)
 */
export const validatePasswordStrength = (password: string): string | null => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  // Check for uppercase, lowercase, and digit
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasDigit) {
    return 'Password must include upper, lower case letters and a number';
  }

  return null;
};

/**
 * Validate confirm password matches password
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return 'Please re-enter your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

/**
 * Validate name (required)
 */
export const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'Name is required';
  }

  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }

  return null;
};

/**
 * Validate phone number (Indian format: 10 digits, starts with 6-9)
 */
export const validatePhone = (phone: string, required: boolean = false): string | null => {
  if (!phone || phone.trim() === '') {
    if (required) {
      return 'Phone number is required';
    }
    return null; // Optional field
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Check if it's 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return 'Enter a valid 10-digit phone number';
  }

  // Check if it starts with 6-9
  if (!/^[6-9]/.test(cleaned)) {
    return 'Phone number must start with 6, 7, 8, or 9';
  }

  return null;
};

