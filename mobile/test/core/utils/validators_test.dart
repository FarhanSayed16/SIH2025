import 'package:flutter_test/flutter_test.dart';
import 'package:kavach/core/utils/validators.dart';

void main() {
  group('Validators', () {
    group('Email Validation', () {
      test('valid email should return true', () {
        expect(Validators.isValidEmail('test@example.com'), true);
        expect(Validators.isValidEmail('user.name@domain.co.in'), true);
      });

      test('invalid email should return false', () {
        expect(Validators.isValidEmail('invalid'), false);
        expect(Validators.isValidEmail('test@'), false);
        expect(Validators.isValidEmail('@example.com'), false);
      });

      test('email error messages', () {
        expect(Validators.emailError(''), 'Email is required');
        expect(Validators.emailError('invalid'), 'Please enter a valid email');
        expect(Validators.emailError('test@example.com'), null);
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
        expect(Validators.passwordError('short'), 'Password must be at least 8 characters');
        expect(Validators.passwordError('onlyletters'), 'Password must contain at least one number');
        expect(Validators.passwordError('12345678'), 'Password must contain at least one letter');
        expect(Validators.passwordError('password123'), null);
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

