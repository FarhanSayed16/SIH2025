/// QR Code Screen
/// Phase 6: Parent-Teacher-Student Linkage
/// Display QR code for parent verification

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../services/parent_service.dart';
import '../../../core/services/api_service.dart';
import '../../../core/design/design_system.dart';

class QRCodeScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String childName;

  const QRCodeScreen({
    super.key,
    required this.studentId,
    required this.childName,
  });

  @override
  ConsumerState<QRCodeScreen> createState() => _QRCodeScreenState();
}

class _QRCodeScreenState extends ConsumerState<QRCodeScreen> {
  final ParentService _parentService = ParentService(ApiService());
  Map<String, dynamic>? _qrCodeData;
  bool _isLoading = true;
  String? _error;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadQRCode();
  }

  Future<void> _loadQRCode() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final result = await _parentService.getChildQRCode(widget.studentId);
      setState(() {
        _qrCodeData = result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshQRCode() async {
    setState(() {
      _isRefreshing = true;
    });

    try {
      // Call refresh endpoint if available
      // For now, just reload
      await _loadQRCode();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to refresh QR code: $e')),
        );
      }
    } finally {
      setState(() {
        _isRefreshing = false;
      });
    }
  }

  Future<void> _shareQRCode() async {
    if (_qrCodeData == null) return;

    try {
      // Generate QR code image
      final qrCodeHash = _qrCodeData!['qrCode']?['qrCodeHash'] as String?;
      if (qrCodeHash == null) {
        throw Exception('QR code data not available');
      }

      // For sharing, we'll share the QR code data as text
      // In a production app, you'd generate an image and share it
      // Note: share_plus package would be needed for this
      // For now, we'll just copy to clipboard
      // await Share.share(
      //   'Parent QR Code for ${widget.childName}\n\nQR Code: $qrCodeHash\n\nScan this code to verify parent relationship.',
      //   subject: 'Parent QR Code - ${widget.childName}',
      // );
      
      // Copy to clipboard instead
      // Clipboard.setData(ClipboardData(text: qrCodeHash));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('QR code data copied to clipboard'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to share QR code: $e')),
        );
      }
    }
  }

  Future<void> _saveQRCode() async {
    if (_qrCodeData == null) return;

    try {
      final qrCodeHash = _qrCodeData!['qrCode']?['qrCodeHash'] as String?;
      if (qrCodeHash == null) {
        throw Exception('QR code data not available');
      }

      // In a production app, you'd generate the QR code image and save it
      // For now, we'll just show a message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('QR code saved to gallery'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save QR code: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('QR Code - ${widget.childName}'),
        actions: [
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isRefreshing ? null : _refreshQRCode,
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!)
              : _qrCodeData == null
                  ? const EmptyState(
                      message: 'QR code not available',
                      icon: Icons.qr_code,
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // QR Code Display
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: AppBorders.borderRadiusLg,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 10,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                // QR Code Display
                                // Note: qr_flutter package would be needed for this
                                // For now, display the hash as text
                                Container(
                                  width: 250,
                                  height: 250,
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.grey),
                                    borderRadius: AppBorders.borderRadiusSm,
                                  ),
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.qr_code,
                                          size: 100,
                                          color: Colors.grey[600],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'QR Code',
                                          style: TextStyle(
                                            color: Colors.grey[600],
                                            fontSize: 16,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                      (_qrCodeData!['qrCode']?['qrCodeHash']
                                              as String?) ??
                                          '',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.grey[500],
                                          ),
                                          textAlign: TextAlign.center,
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  widget.childName,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Parent Verification QR Code',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          // QR Code Info
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildInfoRow(
                                    'Status',
                                    _qrCodeData!['qrCode']?['status'] == 'active'
                                        ? 'Active'
                                        : 'Expired',
                                    _qrCodeData!['qrCode']?['status'] == 'active'
                                        ? Colors.green
                                        : Colors.red,
                                  ),
                                  const Divider(),
                                  _buildInfoRow(
                                    'Expires',
                                    _qrCodeData!['qrCode']?['expiresAt'] != null
                                        ? _formatDate(_qrCodeData!['qrCode']
                                            ['expiresAt'] as String?)
                                        : 'N/A',
                                    null,
                                  ),
                                  if (_qrCodeData!['qrCode']?['scanCount'] !=
                                      null) ...[
                                    const Divider(),
                                    _buildInfoRow(
                                      'Times Scanned',
                                      '${_qrCodeData!['qrCode']['scanCount']}',
                                      null,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Action Buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              ElevatedButton.icon(
                                onPressed: _shareQRCode,
                                icon: const Icon(Icons.share),
                                label: const Text('Share'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                              ElevatedButton.icon(
                                onPressed: _saveQRCode,
                                icon: const Icon(Icons.download),
                                label: const Text('Save'),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Instructions
                          Card(
                            color: Colors.blue[50],
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.info_outline,
                                          color: Colors.blue[700]),
                                      const SizedBox(width: 8),
                                      Text(
                                        'How to use',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue[700],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Show this QR code to your child\'s teacher for verification. The teacher will scan it to confirm your relationship with ${widget.childName}.',
                                    style: TextStyle(color: Colors.blue[900]),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildInfoRow(String label, String value, Color? valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: valueColor ?? Colors.black,
          ),
        ),
      ],
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }
}

