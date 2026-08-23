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
        final result = await authService.login('test@example.com', 'password123');

        // Assert
        expect(result, isNotNull);
        expect(result.user.email, 'test@example.com');
        verify(mockStorageService.storeAccessToken('test_access_token')).called(1);
        verify(mockStorageService.storeRefreshToken('test_refresh_token')).called(1);
      });

      test('should throw exception on failed login', () async {
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
        expect(
          () => authService.login('test@example.com', 'wrongpassword'),
          throwsA(isA<String>()),
        );
        verifyNever(mockStorageService.storeAccessToken(any));
      });
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

