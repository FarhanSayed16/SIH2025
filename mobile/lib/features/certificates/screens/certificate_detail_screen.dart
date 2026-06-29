/// Phase 3.3.4: Certificate Detail Screen
/// Displays certificate details and allows download/share

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../services/certificate_service.dart';
import '../../../core/providers/api_service_provider.dart';
import '../models/certificate_model.dart';
import 'package:intl/intl.dart';

class CertificateDetailScreen extends ConsumerStatefulWidget {
  final String certificateId;

  const CertificateDetailScreen({
    super.key,
    required this.certificateId,
  });

  @override
  ConsumerState<CertificateDetailScreen> createState() =>
      _CertificateDetailScreenState();
}

class _CertificateDetailScreenState
    extends ConsumerState<CertificateDetailScreen> {
  Certificate? _certificate;
  bool _isLoading = true;
  String? _error;
  bool _isDownloading = false;
  Uint8List? _pdfBytes;

  @override
  void initState() {
    super.initState();
    _loadCertificate();
  }

  Future<void> _loadCertificate() async {
    try {
      final service = CertificateService(
        apiService: ref.read(apiServiceProvider),
      );
      final certificate = await service.getCertificateById(widget.certificateId);
      if (mounted) {
        setState(() {
          _certificate = certificate;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _downloadPdf() async {
    if (_certificate == null || _certificate!.pdfUrl == null) return;

    setState(() => _isDownloading = true);

    try {
      final service = CertificateService(
        apiService: ref.read(apiServiceProvider),
      );
      final pdfBytes = await service.downloadCertificate(_certificate!.id);

      // Save to device storage
      final directory = await getApplicationDocumentsDirectory();
      final filePath =
          '${directory.path}/certificate_${_certificate!.id}.pdf';
      final file = File(filePath);
      await file.writeAsBytes(pdfBytes);

      setState(() {
        _pdfBytes = pdfBytes;
        _isDownloading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Certificate downloaded to: $filePath'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isDownloading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to download certificate: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _shareCertificate() async {
    if (_certificate == null || _certificate!.pdfUrl == null) return;

    try {
      // Download PDF if not already downloaded
      if (_pdfBytes == null) {
        setState(() => _isDownloading = true);
        final service = CertificateService(
          apiService: ref.read(apiServiceProvider),
        );
        _pdfBytes = await service.downloadCertificate(_certificate!.id);
        setState(() => _isDownloading = false);
      }

      // Save to temporary file for sharing
      final directory = await getTemporaryDirectory();
      final filePath =
          '${directory.path}/certificate_${_certificate!.id}.pdf';
      final file = File(filePath);
      await file.writeAsBytes(_pdfBytes!);

      // Share the file
      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Check out my ${_certificate!.displayTitle} certificate!',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to share certificate: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _viewPdf() async {
    if (_certificate == null || _certificate!.pdfUrl == null) return;

    try {
      // Download PDF if not already downloaded
      if (_pdfBytes == null) {
        setState(() => _isDownloading = true);
        final service = CertificateService(
          apiService: ref.read(apiServiceProvider),
        );
        _pdfBytes = await service.downloadCertificate(_certificate!.id);
        setState(() => _isDownloading = false);
      }

      // View PDF using printing package
      await Printing.layoutPdf(
        onLayout: (format) async => _pdfBytes!,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to view certificate: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Certificate Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _certificate == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Certificate Details')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                _error ?? 'Certificate not found',
                style: TextStyle(color: Colors.red[700]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final dateFormat = DateFormat('MMMM dd, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: Text(_certificate!.displayTitle),
        actions: [
          if (_certificate!.pdfUrl != null) ...[
            IconButton(
              icon: _isDownloading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.download),
              onPressed: _isDownloading ? null : _downloadPdf,
              tooltip: 'Download',
            ),
            IconButton(
              icon: const Icon(Icons.share),
              onPressed: _shareCertificate,
              tooltip: 'Share',
            ),
            IconButton(
              icon: const Icon(Icons.picture_as_pdf),
              onPressed: _viewPdf,
              tooltip: 'View PDF',
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Certificate Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: Theme.of(context).colorScheme.primary,
                  width: 2,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    // Certificate Icon
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.verified,
                        color: Theme.of(context).colorScheme.primary,
                        size: 48,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Title
                    Text(
                      _certificate!.displayTitle,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    // Achievement
                    Text(
                      _certificate!.achievement,
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    // Date
                    Text(
                      'Issued: ${dateFormat.format(_certificate!.issuedAt)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Action Buttons
            if (_certificate!.pdfUrl != null) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _viewPdf,
                  icon: const Icon(Icons.visibility),
                  label: const Text('View Certificate'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isDownloading ? null : _downloadPdf,
                      icon: _isDownloading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.download),
                      label: const Text('Download'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _shareCertificate,
                      icon: const Icon(Icons.share),
                      label: const Text('Share'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

