/**
 * Equipment QR Code Scanner Screen
 * Scans QR codes on safety equipment to quickly access equipment details
 * Map Integration Plan - Phase 3
 */

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/map_data_service.dart';
import '../models/map_models.dart';
import 'blueprint_map_screen.dart';
import 'safety_equipment_list_screen.dart';
import 'dart:convert';

class EquipmentQRScannerScreen extends StatefulWidget {
  final String schoolId;

  const EquipmentQRScannerScreen({
    Key? key,
    required this.schoolId,
  }) : super(key: key);

  @override
  State<EquipmentQRScannerScreen> createState() => _EquipmentQRScannerScreenState();
}

class _EquipmentQRScannerScreenState extends State<EquipmentQRScannerScreen> {
  final MapDataService _mapDataService = MapDataService();
  final MobileScannerController _scannerController = MobileScannerController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _handleQRCode(String rawValue) async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      // Parse QR code data
      final qrData = jsonDecode(rawValue) as Map<String, dynamic>;
      
      if (qrData['type'] != 'safety-equipment') {
        _showError('Invalid QR code. This is not a safety equipment QR code.');
        return;
      }

      final equipmentId = qrData['equipmentId'] as String?;
      final schoolId = qrData['schoolId'] as String?;

      if (equipmentId == null || schoolId == null) {
        _showError('Invalid QR code data.');
        return;
      }

      // Verify school ID matches
      if (schoolId != widget.schoolId) {
        _showError('This QR code belongs to a different school.');
        return;
      }

      // Get map data to find equipment
      final mapData = await _mapDataService.getMapData(widget.schoolId);
      final equipment = mapData.equipment.firstWhere(
        (e) => e.id == equipmentId,
        orElse: () => throw Exception('Equipment not found'),
      );

      // Stop scanner
      await _scannerController.stop();

      // Navigate to equipment on map
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute<BlueprintMapScreen>(
            builder: (context) => BlueprintMapScreen(
              schoolId: widget.schoolId,
              floor: equipment.floor,
              title: equipment.name,
            ),
          ),
        );

        // Show equipment details after a short delay
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            showModalBottomSheet<void>(
              context: context,
              builder: (context) => _EquipmentDetailSheet(equipment: equipment),
            );
          }
        });
      }
    } catch (e) {
      _showError('Failed to process QR code: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
    setState(() {
      _isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Equipment QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.list),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute<SafetyEquipmentListScreen>(
                  builder: (context) => SafetyEquipmentListScreen(
                    schoolId: widget.schoolId,
                  ),
                ),
              );
            },
            tooltip: 'View Equipment List',
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  _handleQRCode(barcode.rawValue!);
                  break;
                }
              }
            },
          ),
          // Overlay with instructions
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.qr_code_scanner, color: Colors.white, size: 32),
                  SizedBox(height: 8),
                  Text(
                    'Point camera at equipment QR code',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          // Processing indicator
          if (_isProcessing)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.5),
                child: const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: Colors.white),
                      SizedBox(height: 16),
                      Text(
                        'Processing QR code...',
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Equipment Detail Sheet (reused)
class _EquipmentDetailSheet extends StatelessWidget {
  final SafetyEquipmentModel equipment;

  const _EquipmentDetailSheet({required this.equipment});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Colors.redAccent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  equipment.name,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _DetailRow('Type', equipment.type),
          if (equipment.status != null) _DetailRow('Status', equipment.status!),
          if (equipment.floor != null) _DetailRow('Floor', 'Floor ${equipment.floor}'),
          if (equipment.x != null && equipment.y != null)
            _DetailRow('Location', '(${equipment.x!.toStringAsFixed(0)}, ${equipment.y!.toStringAsFixed(0)})'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}

