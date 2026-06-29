import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/api_endpoints.dart';
import '../../../core/design/design_system.dart';
import '../../../core/services/api_service.dart';

/// Category A3: Post-drill / post-incident damage scan
class DamageScanScreen extends StatefulWidget {
  const DamageScanScreen({super.key});

  @override
  State<DamageScanScreen> createState() => _DamageScanScreenState();
}

class _DamageScanScreenState extends State<DamageScanScreen> {
  final ApiService _api = ApiService();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;
  File? _pickedImage;
  String? _accessibilityDescription;
  bool _descriptionLoading = false;

  Future<void> _pickAndScan({required ImageSource source}) async {
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
        ApiEndpoints.aiDamageScan,
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
        title: const Text('Scan damage'),
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        foregroundColor: theme.colorScheme.onSurface,
        actions: [
          if (hasResultOrError)
            TextButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.refresh, size: 20),
              label: const Text('New scan'),
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
                    color: AppColors.accentOrange.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.build_circle_outlined,
                    size: 48,
                    color: AppColors.accentOrange,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Post-incident damage check',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  'Take or pick a photo after a drill or incident. AI will identify visible damage and suggest follow-up.',
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
                        onPressed: _loading ? null : () => _pickAndScan(source: ImageSource.camera),
                        icon: const Icon(Icons.camera_alt_rounded, size: 22),
                        label: const Text('Camera'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.accentOrange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: _loading ? null : () => _pickAndScan(source: ImageSource.gallery),
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
                  const SizedBox(height: 10),
                  Text(
                    'Tip: Capture the full area of damage for best results.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
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
              color: AppColors.accentOrange.withOpacity(0.08),
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
                        color: AppColors.accentOrange,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Analyzing damage…',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: AppColors.accentOrange,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Identifying visible damage and severity',
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
            _DamageErrorCard(message: _error!),
          ],

          // Result
          if (_result != null) ...[
            const SizedBox(height: 20),
            _DamageResultCard(result: _result!),
            const SizedBox(height: 16),
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

class _DamageErrorCard extends StatelessWidget {
  final String message;

  const _DamageErrorCard({required this.message});

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
                    'Scan failed',
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

class _DamageResultCard extends StatelessWidget {
  final Map<String, dynamic> result;

  const _DamageResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final damageDetected = result['damageDetected'] == true;
    final severity = (result['severity'] ?? '').toString().trim().toLowerCase();
    final description = (result['description'] ?? '').toString();
    final followUp = (result['followUp'] ?? '').toString();

    final Color statusColor = damageDetected ? AppColors.accentOrange : AppColors.primaryGreen;
    final IconData statusIcon = damageDetected ? Icons.warning_amber_rounded : Icons.check_circle_rounded;
    final String statusLabel = damageDetected ? 'Damage detected' : 'No damage detected';
    final String statusSubtitle = damageDetected
        ? (severity.isNotEmpty ? '$severity severity' : 'Review details below')
        : 'Area appears safe';

    // Severity chip color
    Color severityColor = theme.colorScheme.onSurfaceVariant;
    if (severity.contains('high') || severity.contains('critical')) {
      severityColor = AppColors.primaryRed;
    } else if (severity.contains('medium') || severity.contains('moderate')) {
      severityColor = AppColors.accentOrange;
    } else if (severity.contains('low') || severity.contains('minor')) {
      severityColor = Colors.amber.shade700;
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
                          statusSubtitle,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        if (damageDetected && severity.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: severityColor.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              severity,
                              style: theme.textTheme.labelMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: severityColor,
                              ),
                            ),
                          ),
                        ],
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
                  if (description.isNotEmpty) ...[
                    Text(
                      'Description',
                      style: theme.textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                  if (followUp.isNotEmpty) ...[
                    SizedBox(height: description.isNotEmpty ? 16 : 0),
                    Row(
                      children: [
                        Icon(Icons.lightbulb_outline_rounded, size: 18, color: AppColors.accentOrange),
                        const SizedBox(width: 8),
                        Text(
                          'Follow-up',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      followUp,
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
