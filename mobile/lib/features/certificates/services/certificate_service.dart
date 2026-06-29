/// Phase 3.3.4: Certificate Service
/// Handles API calls for certificate management

import 'dart:typed_data';
import '../../../core/services/api_service.dart';
import '../../../core/config/env.dart' as env_config;
import '../../../core/constants/api_endpoints.dart';
import '../models/certificate_model.dart';
import 'package:flutter/foundation.dart';

class CertificateService {
  final ApiService _apiService;

  CertificateService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  /// Get user's certificates
  Future<List<Certificate>> getMyCertificates() async {
    try {
      final response = await _apiService.get(ApiEndpoints.myCertificates);

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final certificatesList = data['certificates'] as List<dynamic>? ?? [];
        return certificatesList
            .map((json) => Certificate.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      throw Exception('Failed to fetch certificates');
    } catch (e) {
      debugPrint('Error fetching certificates: $e');
      rethrow;
    }
  }

  /// Get certificate by ID
  Future<Certificate> getCertificateById(String certificateId) async {
    try {
      final response = await _apiService.get(
        ApiEndpoints.certificate(certificateId),
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return Certificate.fromJson(
          data['certificate'] as Map<String, dynamic>,
        );
      }

      throw Exception('Failed to fetch certificate');
    } catch (e) {
      debugPrint('Error fetching certificate: $e');
      rethrow;
    }
  }

  /// Download certificate PDF
  Future<Uint8List> downloadCertificate(String certificateId) async {
    try {
      final response = await _apiService.getBinary(
        ApiEndpoints.certificateDownload(certificateId),
      );

      if (response.statusCode == 200 && response.data != null) {
        return Uint8List.fromList(response.data!);
      }

      throw Exception('Failed to download certificate PDF');
    } catch (e) {
      debugPrint('Error downloading certificate: $e');
      rethrow;
    }
  }

  /// Generate certificate
  Future<Certificate> generateCertificate({
    required CertificateType certificateType,
    required String achievement,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.certificatesGenerate,
        data: {
          'certificateType': certificateType.value,
          'achievement': achievement,
          'metadata': metadata ?? {},
        },
      );

      if ((response.statusCode == 200 || response.statusCode == 201) &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        return Certificate.fromJson(
          data['certificate'] as Map<String, dynamic>,
        );
      }

      throw Exception('Failed to generate certificate');
    } catch (e) {
      debugPrint('Error generating certificate: $e');
      rethrow;
    }
  }

  /// Check and generate certificates for achievements
  Future<List<Certificate>> checkCertificates({
    String? triggerType,
    Map<String, dynamic>? triggerData,
  }) async {
    try {
      final response = await _apiService.post(
        ApiEndpoints.checkCertificates,
        data: {
          if (triggerType != null) 'triggerType': triggerType,
          if (triggerData != null) 'triggerData': triggerData,
        },
      );

      if (response.statusCode == 200 &&
          (response.data['success'] == true ||
              response.data['success'] == 'true')) {
        final data = response.data['data'] ?? response.data;
        final newCertificatesList =
            data['newCertificates'] as List<dynamic>? ?? [];
        return newCertificatesList
            .map((json) => Certificate.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      debugPrint('Error checking certificates: $e');
      return [];
    }
  }

  /// Get full PDF URL from relative URL
  String getFullPdfUrl(String? pdfUrl) {
    if (pdfUrl == null || pdfUrl.isEmpty) return '';
    if (pdfUrl.startsWith('http')) return pdfUrl;

    // Get base URL from environment (remove /api suffix if present)
    var baseUrl = env_config.Env.apiBaseUrl;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    if (pdfUrl.startsWith('/')) {
      return '$baseUrl$pdfUrl';
    }
    return '$baseUrl/$pdfUrl';
  }
}

