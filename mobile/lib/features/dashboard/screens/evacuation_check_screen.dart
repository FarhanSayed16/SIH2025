import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_endpoints.dart';
import '../../../core/design/design_system.dart';
import '../../../core/services/api_service.dart';

/// Category A1: Check evacuation route (clear / blocked / partially blocked)
class EvacuationCheckScreen extends StatefulWidget {
  const EvacuationCheckScreen({super.key});

  @override
  State<EvacuationCheckScreen> createState() => _EvacuationCheckScreenState();
}

class _EvacuationCheckScreenState extends State<EvacuationCheckScreen> {
  final ApiService _api = ApiService();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;
  File? _pickedImage;
  String? _accessibilityDescription;
  bool _descriptionLoading = false;

  Future<void> _pickAndCheck({required ImageSource source}) async {
    final picker = ImagePicker();
    final xFile = await picker.pickImage(
      source: source,
      imageQuality: 85,
      maxWidth: 1024,
      maxHeight: 1024,
    );
    if (xFile == null || !mounted) return;

    setState(() {
      _pickedImage = File(xFile.path);
      _error = null;
      _result = null;
      _loading = true;
    });

    try {
      final bytes = await _pickedImage!.readAsBytes();
      final base64 = base64Encode(bytes);
      final response = await _api.post(
        ApiEndpoints.aiEvacuationCheck,
        data: {'image': base64, 'mimeType': 'image/jpeg'},
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );
      final data = response.data;
      final payload = data is Map && data['data'] != null
          ? data['data'] as Map<String, dynamic>
          : data as Map<String, dynamic>?;
      if (mounted) {
        setState(() {
          _result = payload;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  void _reset() {
    setState(() {
      _result = null;
      _error = null;
      _pickedImage = null;
      _accessibilityDescription = null;
    });
  }

  Future<void> _fetchAccessibilityDescription() async {
    if (_pickedImage == null) return;
    setState(() {
      _descriptionLoading = true;
      _accessibilityDescription = null;
    });
    try {
      final bytes = await _pickedImage!.readAsBytes();
      final base64 = base64Encode(bytes);
      final response = await _api.post(
        ApiEndpoints.aiDescribe,
        data: {'image': base64, 'mimeType': 'image/jpeg'},
        options: Options(receiveTimeout: const Duration(seconds: 90)),
      );
      final data = response.data;
      final desc = data is Map && data['data'] != null
          ? (data['data'] as Map)['description']?.toString()
          : (data is Map ? data['description']?.toString() : null);
      if (mounted) setState(() {
        _accessibilityDescription = desc ?? 'Description unavailable.';
        _descriptionLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _accessibilityDescription = 'Could not load description.';
        _descriptionLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasResultOrError = _result != null || _error != null;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Check exit'),
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        foregroundColor: theme.colorScheme.onSurface,
        actions: [
          if (hasResultOrError)
            TextButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.refresh, size: 20),
              label: const Text('New check'),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          // Hero section
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.exit_to_app_rounded,
                    size: 48,
                    color: AppColors.primaryGreen,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Is the evacuation route clear?',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  'Take or pick a photo of the corridor or exit. AI will tell you if it\'s clear, blocked, or partially blocked.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Capture area
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(
                color: theme.dividerColor.withOpacity(0.5),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  if (_pickedImage != null && !_loading) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        _pickedImage!,
                        height: 180,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FilledButton.icon(
                        onPressed: _loading
                            ? null
                            : () => _pickAndCheck(source: ImageSource.camera),
                        icon: const Icon(Icons.camera_alt_rounded, size: 22),
                        label: const Text('Camera'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: _loading
                            ? null
                            : () => _pickAndCheck(source: ImageSource.gallery),
                        icon: const Icon(Icons.photo_library_rounded, size: 22),
                        label: const Text('Gallery'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Loading state
          if (_loading) ...[
            const SizedBox(height: 20),
            Card(
              elevation: 0,
              color: AppColors.primaryGreenSubtle.withOpacity(0.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
                child: Column(
                  children: [
                    const SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Analyzing route…',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: AppColors.primaryGreenDark,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Checking if the exit is clear for evacuation',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Error state
          if (_error != null) ...[
            const SizedBox(height: 20),
            _ErrorCard(message: _error!),
          ],

          // Result
          if (_result != null) ...[
            const SizedBox(height: 20),
            _ResultCard(result: _result!),
            const SizedBox(height: 16),
            // Accessibility
            OutlinedButton.icon(
              onPressed: _descriptionLoading ? null : _fetchAccessibilityDescription,
              icon: _descriptionLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.accessibility_new_rounded, size: 20),
              label: Text(
                _descriptionLoading ? 'Loading…' : 'Get image description (accessibility)',
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            if (_accessibilityDescription != null) ...[
              const SizedBox(height: 12),
              Card(
                elevation: 0,
                color: theme.colorScheme.primaryContainer.withOpacity(0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.accessibility_new_rounded, size: 18, color: theme.colorScheme.primary),
                          const SizedBox(width: 8),
                          Text(
                            'Image description',
                            style: theme.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SelectableText(
                        _accessibilityDescription!,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;

  const _ErrorCard({required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: AppColors.primaryRedSubtle.withOpacity(0.6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.primaryRedLight.withOpacity(0.5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline_rounded, color: AppColors.primaryRed, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Something went wrong',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryRedDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final Map<String, dynamic> result;

  const _ResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = (result['status'] ?? 'unknown').toString();
    final reason = (result['reason'] ?? '').toString();
    final recommendation = (result['recommendation'] ?? '').toString();

    Color statusColor = Colors.grey;
    String statusLabel = status;
    IconData statusIcon = Icons.help_outline_rounded;
    if (status == 'clear') {
      statusColor = AppColors.primaryGreen;
      statusLabel = 'Clear';
      statusIcon = Icons.check_circle_rounded;
    } else if (status == 'blocked') {
      statusColor = AppColors.primaryRed;
      statusLabel = 'Blocked';
      statusIcon = Icons.cancel_rounded;
    } else if (status == 'partially_blocked') {
      statusColor = AppColors.accentOrange;
      statusLabel = 'Partially blocked';
      statusIcon = Icons.warning_amber_rounded;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: statusColor.withOpacity(0.4)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              color: statusColor.withOpacity(0.12),
              child: Row(
                children: [
                  Icon(statusIcon, size: 32, color: statusColor),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          statusLabel,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                        Text(
                          status == 'clear'
                              ? 'Route is safe for evacuation'
                              : status == 'blocked'
                                  ? 'Do not use this route'
                                  : 'Use with caution',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (reason.isNotEmpty) ...[
                    Text(
                      'Analysis',
                      style: theme.textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      reason,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                  if (recommendation.isNotEmpty) ...[
                    SizedBox(height: reason.isNotEmpty ? 16 : 0),
                    Text(
                      'Recommendation',
                      style: theme.textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      recommendation,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
