/// Phase 3.3.4: Certificate Provider
/// Manages certificate state using Riverpod

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/api_service_provider.dart';
import '../models/certificate_model.dart';
import '../services/certificate_service.dart';
import 'package:flutter/foundation.dart';

/// Certificate Service Provider
final certificateServiceProvider = Provider<CertificateService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return CertificateService(apiService: apiService);
});

/// My Certificates State
class MyCertificatesState {
  final List<Certificate> certificates;
  final bool isLoading;
  final String? error;
  final DateTime? lastFetched;

  MyCertificatesState({
    this.certificates = const [],
    this.isLoading = false,
    this.error,
    this.lastFetched,
  });

  MyCertificatesState copyWith({
    List<Certificate>? certificates,
    bool? isLoading,
    String? error,
    DateTime? lastFetched,
  }) {
    return MyCertificatesState(
      certificates: certificates ?? this.certificates,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastFetched: lastFetched ?? this.lastFetched,
    );
  }
}

/// My Certificates Notifier
class MyCertificatesNotifier extends StateNotifier<MyCertificatesState> {
  final CertificateService _service;

  MyCertificatesNotifier(this._service) : super(MyCertificatesState());

  /// Load user's certificates
  Future<void> loadCertificates({bool forceRefresh = false}) async {
    if (!forceRefresh &&
        state.lastFetched != null &&
        DateTime.now().difference(state.lastFetched!).inMinutes < 5) {
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    try {
      final certificates = await _service.getMyCertificates();
      state = MyCertificatesState(
        certificates: certificates,
        isLoading: false,
        lastFetched: DateTime.now(),
      );
    } catch (e) {
      debugPrint('Error loading certificates: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check and generate new certificates
  Future<List<Certificate>> checkCertificates({
    String? triggerType,
    Map<String, dynamic>? triggerData,
  }) async {
    try {
      final newCertificates = await _service.checkCertificates(
        triggerType: triggerType,
        triggerData: triggerData,
      );

      // Reload certificates if new ones were generated
      if (newCertificates.isNotEmpty) {
        await loadCertificates(forceRefresh: true);
      }

      return newCertificates;
    } catch (e) {
      debugPrint('Error checking certificates: $e');
      return [];
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// My Certificates Provider
final myCertificatesProvider =
    StateNotifierProvider<MyCertificatesNotifier, MyCertificatesState>((ref) {
  final service = ref.watch(certificateServiceProvider);
  return MyCertificatesNotifier(service);
});

