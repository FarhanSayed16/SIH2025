import 'package:flutter_test/flutter_test.dart';
import 'package:kavach/core/utils/validators.dart';

void main() {
  group('Validators', () {
    group('Email Validation', () {
      test('valid email should return true', () {
        expect(Validators.isValidEmailFormat('test@example.com'), true);
        expect(Validators.isValidEmailFormat('user.name@domain.co.in'), true);
      });

      test('invalid email should return false', () {
        expect(Validators.isValidEmail('invalid'), false);
        expect(Validators.isValidEmail('test@'), false);
        expect(Validators.isValidEmail('@example.com'), false);
      });

      test('email error messages', () {
        expect(Validators.emailError(''), 'Email is required');
        expect(Validators.emailError('invalid'), 'Enter a valid email address');
        expect(Validators.emailError('test@example.com'), null);
        expect(Validators.emailErrorForRegistration('test@example.com'), 'Only Gmail accounts are allowed.');
        expect(Validators.emailErrorForRegistration('test@gmail.com'), null);
      });
    });

    group('Password Validation', () {
      test('valid password should return true', () {
        expect(Validators.isValidPassword('password123'), true);
        expect(Validators.isValidPassword('Test1234'), true);
      });

      test('invalid password should return false', () {
        expect(Validators.isValidPassword('short'), false);
        expect(Validators.isValidPassword('onlyletters'), false);
        expect(Validators.isValidPassword('12345678'), false);
      });

      test('password error messages', () {
        expect(Validators.passwordError(''), 'Password is required');
        // Login accepts existing credentials; strength rules apply to registration.
        expect(Validators.passwordError('short'), null);
        expect(Validators.passwordStrengthError('short'), 'Password must be at least 8 characters.');
        expect(Validators.passwordStrengthError('onlyletters'), isNotNull);
        expect(Validators.passwordStrengthError('12345678'), isNotNull);
        expect(Validators.passwordStrengthError('Password123'), null);

      });
    });

    group('Required Field Validation', () {
      test('non-empty string should return true', () {
        expect(Validators.isRequired('test'), true);
        expect(Validators.isRequired('  test  '), true);
      });

      test('empty or null should return false', () {
        expect(Validators.isRequired(''), false);
        expect(Validators.isRequired('   '), false);
        expect(Validators.isRequired(null), false);
      });
    });
  });
}

