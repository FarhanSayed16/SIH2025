/// Phase 3.1.4: Quiz Service
/// Handles AI-powered quiz generation and caching

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../../modules/models/module_model.dart'; // Use existing quiz models
import 'package:connectivity_plus/connectivity_plus.dart';

class QuizService {
  final ApiService _apiService;
  final StorageService _storageService;
  final Connectivity _connectivity = Connectivity();

  QuizService({
    ApiService? apiService,
    StorageService? storageService,
  })  : _apiService = apiService ?? ApiService(),
        _storageService = storageService ?? StorageService();

  /// Check if device is online
  Future<bool> _isOnline() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      return connectivityResult != ConnectivityResult.none;
    } catch (e) {
      return false;
    }
  }

  /// Generate quiz using AI
  Future<ModuleQuiz> generateQuiz({
    required String moduleId,
    int numQuestions = 5,
    String difficulty = 'beginner',
    String gradeLevel = 'all',
    bool useCache = true,
  }) async {
    try {
      // Check cache first if useCache is true
      if (useCache) {
        final cachedQuiz = await getCachedQuiz(moduleId: moduleId);
        if (cachedQuiz != null) {
          return cachedQuiz;
        }
      }

      // Check if online
      if (!await _isOnline()) {
        // Try to get offline cached quiz
        final offlineQuiz = await getOfflineCachedQuiz(moduleId);
        if (offlineQuiz != null) {
          return offlineQuiz;
        }
        throw Exception('No internet connection and no cached quiz available');
      }

      // Generate quiz via API
      final queryParams = <String, dynamic>{
        'numQuestions': numQuestions,
        'difficulty': difficulty,
        'gradeLevel': gradeLevel,
        'useCache': useCache,
      };

      final response = await _apiService.get(
        ApiEndpoints.generateQuiz(moduleId),
        queryParameters: queryParams,
      );

      final responseData = response.data as Map<String, dynamic>;
      if (response.statusCode == 200 && (responseData['success'] == true || responseData['success'] == 'true')) {
        final data = responseData['data'] as Map<String, dynamic>;
        final questionsList = data['questions'] as List<dynamic>? ?? <dynamic>[];
        final questions = questionsList
            .cast<Map<String, dynamic>>()
            .map((q) => QuizQuestion.fromJson(q))
            .toList();

        final quiz = ModuleQuiz(
          questions: questions,
          passingScore: 70,
          timeLimit: null,
        );

        // Cache the quiz offline
        await cacheQuizOffline(moduleId, quiz);

        return quiz;
      } else {
        final responseData = response.data as Map<String, dynamic>;
        throw Exception(responseData['message'] as String? ?? 'Failed to generate quiz');
      }
    } catch (e) {
      // Try offline cache as fallback
      final offlineQuiz = await getOfflineCachedQuiz(moduleId);
      if (offlineQuiz != null) {
        return offlineQuiz;
      }
      rethrow;
    }
  }

  /// Get cached quiz from server
  Future<ModuleQuiz?> getCachedQuiz({
    required String moduleId,
    int numQuestions = 5,
    String difficulty = 'beginner',
    String gradeLevel = 'all',
  }) async {
    try {
      if (!await _isOnline()) {
        return null;
      }

      final queryParams = <String, dynamic>{
        'numQuestions': numQuestions,
        'difficulty': difficulty,
        'gradeLevel': gradeLevel,
      };

      final response = await _apiService.get(
        ApiEndpoints.getCachedQuiz(moduleId),
        queryParameters: queryParams,
      );

      final responseData = response.data as Map<String, dynamic>;
      if (response.statusCode == 200 && (responseData['success'] == true || responseData['success'] == 'true')) {
        final data = responseData['data'] as Map<String, dynamic>;
        final questionsList = data['questions'] as List<dynamic>? ?? <dynamic>[];
        final questions = questionsList
            .cast<Map<String, dynamic>>()
            .map((q) => QuizQuestion.fromJson(q))
            .toList();

        final quiz = ModuleQuiz(
          questions: questions,
          passingScore: 70,
          timeLimit: null,
        );

        // Cache offline
        await cacheQuizOffline(moduleId, quiz);

        return quiz;
      }
      return null;
    } catch (e) {
      // 404 means no cache, which is fine
      if (e.toString().contains('404')) {
        return null;
      }
      print('Error getting cached quiz: $e');
      return null;
    }
  }

  /// Cache quiz offline
  Future<void> cacheQuizOffline(String moduleId, ModuleQuiz quiz) async {
    try {
      final box = await _storageService.openBox(AppConstants.quizzesBox);
      final quizKey = 'quiz_$moduleId';
      
      await box.put(quizKey, {
        'moduleId': moduleId,
        'questions': quiz.questions.map((q) => q.toJson()).toList(),
        'generatedAt': DateTime.now().toIso8601String(),
        'passingScore': quiz.passingScore,
        'timeLimit': quiz.timeLimit,
      });
    } catch (e) {
      print('Error caching quiz offline: $e');
    }
  }

  /// Get offline cached quiz
  Future<ModuleQuiz?> getOfflineCachedQuiz(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.quizzesBox);
      final quizKey = 'quiz_$moduleId';
      final cached = box.get(quizKey);

      if (cached != null && cached is Map) {
        final questions = (cached['questions'] as List)
            .map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>))
            .toList();

        return ModuleQuiz(
          questions: questions,
          passingScore: cached['passingScore'] as int? ?? 70,
          timeLimit: cached['timeLimit'] as int?,
        );
      }
      return null;
    } catch (e) {
      print('Error getting offline cached quiz: $e');
      return null;
    }
  }

  /// Clear cached quiz for a module
  Future<void> clearCachedQuiz(String moduleId) async {
    try {
      final box = await _storageService.openBox(AppConstants.quizzesBox);
      final quizKey = 'quiz_$moduleId';
      await box.delete(quizKey);
    } catch (e) {
      print('Error clearing cached quiz: $e');
    }
  }
}


