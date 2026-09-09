import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';
import 'package:kavach/features/auth/services/auth_service.dart';
import 'package:kavach/core/services/api_service.dart';
import 'package:kavach/core/services/storage_service.dart';
import 'auth_service_test.mocks.dart';

@GenerateMocks([ApiService, StorageService])
void main() {
  late AuthService authService;
  late MockApiService mockApiService;
  late MockStorageService mockStorageService;

  setUp(() {
    mockApiService = MockApiService();
    mockStorageService = MockStorageService();
    when(mockApiService.resetLogoutFlag()).thenReturn(null);
    when(mockApiService.setAuthToken(any)).thenReturn(null);
    authService = AuthService(
      apiService: mockApiService,
      storageService: mockStorageService,
    );
  });

  group('AuthService', () {
    group('login', () {
      test('should return user on successful login', () async {
        // Arrange
        final response = {
          'success': true,
          'data': {
            'accessToken': 'test_access_token',
            'refreshToken': 'test_refresh_token',
            'user': {
              'id': 'user123',
              'email': 'test@example.com',
              'name': 'Test User',
              'role': 'student',
            }
          }
        };

        when(mockApiService.post(any, data: anyNamed('data')))
            .thenAnswer((_) async => Response<Map<String, dynamic>>(
                  data: response,
                  statusCode: 200,
                  requestOptions: RequestOptions(path: '/auth/login'),
                ));

        when(mockStorageService.storeAccessToken(any))
            .thenAnswer((_) async => {});
        when(mockStorageService.storeRefreshToken(any))
            .thenAnswer((_) async => {});
        when(mockStorageService.storeUserId(any))
            .thenAnswer((_) async => {});

        // Act
        final logs = <String>[];
        final result = await runZoned(
          () => authService.login('test@example.com', 'password123'),
          zoneSpecification: ZoneSpecification(
            print: (self, parent, zone, message) => logs.add(message),
          ),
        );

        // Assert
        expect(result, isNotNull);
        expect(result.user.email, 'test@example.com');
        expect(logs.join('\n'), isNot(contains('test_access_token')));
        expect(logs.join('\n'), isNot(contains('test_refresh_token')));
        expect(logs.join('\n'), isNot(contains('test@example.com')));
        verify(mockStorageService.storeAccessToken('test_access_token')).called(1);
        verify(mockStorageService.storeRefreshToken('test_refresh_token')).called(1);
      });

      test('should throw AuthValidationException on failed login', () async {
        // Arrange
        when(mockApiService.post(any, data: anyNamed('data')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: '/auth/login'),
              response: Response<Map<String, dynamic>>(
                data: {'success': false, 'message': 'Invalid credentials'},
                statusCode: 401,
                requestOptions: RequestOptions(path: '/auth/login'),
              ),
            ));

        // Act & Assert
        await expectLater(
          authService.login('test@example.com', 'wrongpassword'),
          throwsA(isA<AuthValidationException>().having(
            (error) => error.message,
            'message',
            'Invalid credentials',
          )),
        );
        verifyNever(mockStorageService.storeAccessToken(any));
      });
    });

    test('registration preserves validation message and field errors', () async {
      when(mockApiService.post(any, data: anyNamed('data')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: '/auth/register'),
        response: Response<Map<String, dynamic>>(
          data: {
            'message': 'Validation failed',
            'errors': {
              'fields': {'email': 'Email is already registered'}
            },
          },
          statusCode: 400,
          requestOptions: RequestOptions(path: '/auth/register'),
        ),
      ));

      await expectLater(
        authService.register(
          email: 'test@example.com', password: 'password123', name: 'Student',
          role: 'student', phone: '1234567890',
        ),
        throwsA(isA<AuthValidationException>()
            .having((error) => error.message, 'message', 'Validation failed')
            .having((error) => error.fieldErrors, 'field errors',
                {'email': 'Email is already registered'})),
      );
      verifyNever(mockStorageService.storeAccessToken(any));
    });

    test('password recovery errors preserve the server message', () async {
      when(mockApiService.post(any, data: anyNamed('data')))
          .thenThrow(DioException(
        requestOptions: RequestOptions(path: '/auth/reset-password'),
        response: Response<Map<String, dynamic>>(
          data: {'message': 'Invalid reset request'},
          statusCode: 400,
          requestOptions: RequestOptions(path: '/auth/reset-password'),
        ),
      ));
      final expectedError = throwsA(isA<Exception>().having(
        (error) => error.toString(), 'message', 'Exception: Invalid reset request',
      ));
      await expectLater(authService.forgotPassword('test@example.com'), expectedError);
      await expectLater(authService.resetPassword('reset-token', 'new-password'), expectedError);
    });

    group('logout', () {
      test('should clear tokens on logout', () async {
        // Arrange
        when(mockStorageService.clearSecureStorage())
            .thenAnswer((_) async => {});

        // Act
        await authService.logout();

        // Assert
        verify(mockStorageService.clearSecureStorage()).called(1);
      });
    });
  });
}
