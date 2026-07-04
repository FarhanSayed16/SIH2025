/// Phase 4.8: ML Predictions Service
/// Handles ML prediction API calls

import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';

/// Student Risk Prediction Model
class StudentRiskPrediction {
  final int riskScore; // 0-100
  final String riskLevel; // low, medium, high
  final Map<String, dynamic> factors;
  final Map<String, dynamic> historicalData;

  StudentRiskPrediction({
    required this.riskScore,
    required this.riskLevel,
    required this.factors,
    required this.historicalData,
  });

  factory StudentRiskPrediction.fromJson(Map<String, dynamic> json) {
    return StudentRiskPrediction(
      riskScore: (json['riskScore'] as int?) ?? 50,
      riskLevel: (json['riskLevel'] as String?) ?? 'medium',
      factors: (json['factors'] as Map<String, dynamic>?) ?? {},
      historicalData: (json['historicalData'] as Map<String, dynamic>?) ?? {},
    );
  }
}

/// Drill Performance Prediction Model
class DrillPerformancePrediction {
  final int predictedResponseTime; // seconds
  final int predictedParticipationRate; // percentage
  final double confidence; // 0-1
  final Map<String, dynamic> factors;
  final Map<String, dynamic> historicalBaseline;

  DrillPerformancePrediction({
    required this.predictedResponseTime,
    required this.predictedParticipationRate,
    required this.confidence,
    required this.factors,
    required this.historicalBaseline,
  });

  factory DrillPerformancePrediction.fromJson(Map<String, dynamic> json) {
    return DrillPerformancePrediction(
      predictedResponseTime: (json['predictedResponseTime'] as int?) ?? 300,
      predictedParticipationRate: (json['predictedParticipationRate'] as int?) ?? 80,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.5,
      factors: (json['factors'] as Map<String, dynamic>?) ?? {},
      historicalBaseline: (json['historicalBaseline'] as Map<String, dynamic>?) ?? {},
    );
  }
}

/// Optimal Drill Timing Model
class OptimalTiming {
  final int dayOfWeek; // 0-6
  final int hourOfDay; // 0-23
  final int predictedParticipationRate;
  final int predictedResponseTime;
  final double confidence;

  OptimalTiming({
    required this.dayOfWeek,
    required this.hourOfDay,
    required this.predictedParticipationRate,
    required this.predictedResponseTime,
    required this.confidence,
  });

  factory OptimalTiming.fromJson(Map<String, dynamic> json) {
    return OptimalTiming(
      dayOfWeek: (json['dayOfWeek'] as int?) ?? 1,
      hourOfDay: (json['hourOfDay'] as int?) ?? 10,
      predictedParticipationRate: (json['predictedParticipationRate'] as int?) ?? 80,
      predictedResponseTime: (json['predictedResponseTime'] as int?) ?? 300,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.5,
    );
  }
}

/// Optimal Drill Timing Result
class OptimalDrillTiming {
  final List<OptimalTiming> optimalTimings;
  final OptimalTiming? recommendation;

  OptimalDrillTiming({
    required this.optimalTimings,
    this.recommendation,
  });

  factory OptimalDrillTiming.fromJson(Map<String, dynamic> json) {
    final timings = (json['optimalTimings'] as List<dynamic>? ?? [])
        .map((t) => OptimalTiming.fromJson(t as Map<String, dynamic>))
        .toList();

    return OptimalDrillTiming(
      optimalTimings: timings,
      recommendation: json['recommendation'] != null
          ? OptimalTiming.fromJson(json['recommendation'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Student Progress Forecast Model
class StudentProgressForecast {
  final Map<String, dynamic> forecast;
  final Map<String, dynamic> currentMetrics;
  final double confidence;

  StudentProgressForecast({
    required this.forecast,
    required this.currentMetrics,
    required this.confidence,
  });

  factory StudentProgressForecast.fromJson(Map<String, dynamic> json) {
    return StudentProgressForecast(
      forecast: (json['forecast'] as Map<String, dynamic>?) ?? {},
      currentMetrics: (json['currentMetrics'] as Map<String, dynamic>?) ?? {},
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.5,
    );
  }
}

/// ML Predictions Service
class MLPredictionsService {
  final ApiService _apiService;

  MLPredictionsService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get student risk prediction
  Future<StudentRiskPrediction> getStudentRisk(String userId) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.studentRiskPrediction(userId),
      );

      final data = response.data as Map<String, dynamic>;
      final predictionData = data['data'] ?? data;

      return StudentRiskPrediction.fromJson(predictionData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Get student risk prediction error: $e');
      rethrow;
    }
  }

  /// Predict drill performance
  Future<DrillPerformancePrediction> predictDrillPerformance({
    String? drillType,
    String? institutionId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (drillType != null) queryParams['drillType'] = drillType;
      if (institutionId != null) queryParams['institutionId'] = institutionId;

      final response = await _apiService.get(
        ApiEndpoints.drillPerformancePrediction,
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final predictionData = data['data'] ?? data;

      return DrillPerformancePrediction.fromJson(predictionData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Predict drill performance error: $e');
      rethrow;
    }
  }

  /// Get optimal drill timing
  Future<OptimalDrillTiming> getOptimalDrillTiming({String? institutionId}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (institutionId != null) queryParams['institutionId'] = institutionId;

      final response = await _apiService.get(
        ApiEndpoints.optimalDrillTiming,
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      final data = response.data as Map<String, dynamic>;
      final timingData = data['data'] ?? data;

      return OptimalDrillTiming.fromJson(timingData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Get optimal drill timing error: $e');
      rethrow;
    }
  }

  /// Forecast student progress
  Future<StudentProgressForecast> forecastStudentProgress(String userId) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.studentProgressForecast(userId),
      );

      final data = response.data as Map<String, dynamic>;
      final forecastData = data['data'] ?? data;

      return StudentProgressForecast.fromJson(forecastData as Map<String, dynamic>);
    } catch (e) {
      print('❌ Forecast student progress error: $e');
      rethrow;
    }
  }
}

