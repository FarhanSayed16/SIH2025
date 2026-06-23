/// Validation utilities
class Validators {
  /// Validate email format
  static bool isValidEmailFormat(String email) {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    return emailRegex.hasMatch(email);
  }

  /// Validate email (format + Gmail requirement)
  static bool isValidEmail(String email) {
    if (!isValidEmailFormat(email)) {
      return false;
    }
    // Enforce Gmail requirement
    return email.toLowerCase().endsWith('@gmail.com');
  }

  /// Validate password
  /// Minimum 8 characters, at least one letter and one number
  static bool isValidPassword(String password) {
    if (password.length < 8) return false;
    final hasLetter = RegExp(r'[a-zA-Z]').hasMatch(password);
    final hasNumber = RegExp(r'[0-9]').hasMatch(password);
    return hasLetter && hasNumber;
  }

  /// Validate phone number (Indian format)
  static bool isValidPhone(String phone) {
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    return phoneRegex.hasMatch(phone.replaceAll(RegExp(r'[\s-]'), ''));
  }

  /// Validate required field
  static bool isRequired(String? value) {
    return value != null && value.trim().isNotEmpty;
  }

  /// Get email validation error message (for login - allows any valid email)
  static String? emailError(String email) {
    if (email.isEmpty) {
      return 'Email is required';
    }
    // Check email format only - no Gmail requirement for login
    if (!isValidEmailFormat(email)) {
      return 'Enter a valid email address';
    }
    // No Gmail requirement for login - allows existing users to login
    return null;
  }

  /// Get email validation error message (for registration - requires Gmail)
  static String? emailErrorForRegistration(String email) {
    if (email.isEmpty) {
      return 'Email is required.';
    }
    // Check email format first
    if (!isValidEmailFormat(email)) {
      return 'Enter a valid email address.';
    }
    // Check Gmail requirement for new registrations
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return 'Only Gmail accounts are allowed.';
    }
    return null;
  }

  /// Get password validation error message (for login - simple required check)
  static String? passwordError(String password) {
    if (password.isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  /// Get password strength validation error message (for registration)
  static String? passwordStrengthError(String password) {
    if (password.isEmpty) {
      return 'Password is required.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    
    // Check for uppercase, lowercase, and digit
    final hasUpperCase = RegExp(r'[A-Z]').hasMatch(password);
    final hasLowerCase = RegExp(r'[a-z]').hasMatch(password);
    final hasDigit = RegExp(r'[0-9]').hasMatch(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasDigit) {
      return 'Password must include upper, lower case letters and a number.';
    }
    
    return null;
  }

  /// Validate confirm password matches password
  static String? confirmPasswordError(String password, String confirmPassword) {
    if (confirmPassword.isEmpty) {
      return 'Please re-enter your password.';
    }
    if (password != confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }

  /// Validate name
  static String? nameError(String name) {
    if (name.isEmpty) {
      return 'Full name is required.';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    return null;
  }

  /// Validate phone number with error message
  static String? phoneError(String phone, {bool required = false}) {
    if (phone.isEmpty) {
      if (required) {
        return 'Phone number is required';
      }
      return null; // Optional field
    }
    
    // Remove spaces and dashes
    final cleaned = phone.replaceAll(RegExp(r'[\s-]'), '');
    
    // Check if it's 10 digits
    if (!RegExp(r'^\d{10}$').hasMatch(cleaned)) {
      return 'Enter a valid 10-digit phone number';
    }
    
    // Check if it starts with 6-9
    if (!RegExp(r'^[6-9]').hasMatch(cleaned)) {
      return 'Phone number must start with 6, 7, 8, or 9';
    }
    
    return null;
  }
}

