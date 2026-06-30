/**
 * Phase 4.10: Teacher Alert Trigger Screen
 * Allows teachers to trigger emergency alerts from mobile app
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../services/teacher_alert_service.dart';

class TeacherAlertScreen extends ConsumerStatefulWidget {
  const TeacherAlertScreen({super.key});

  @override
  ConsumerState<TeacherAlertScreen> createState() => _TeacherAlertScreenState();
}

class _TeacherAlertScreenState extends ConsumerState<TeacherAlertScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _selectedType = 'fire';
  String _selectedSeverity = 'high';
  Position? _currentPosition;
  bool _isLoading = false;
  bool _isLocationLoading = false;

  final TeacherAlertService _alertService = TeacherAlertService();

  final List<Map<String, String>> _alertTypes = [
    {'value': 'fire', 'label': 'Fire', 'icon': '🔥'},
    {'value': 'earthquake', 'label': 'Earthquake', 'icon': '🌍'},
    {'value': 'flood', 'label': 'Flood', 'icon': '💧'},
    {'value': 'cyclone', 'label': 'Cyclone', 'icon': '🌀'},
    {'value': 'medical', 'label': 'Medical', 'icon': '🏥'},
    {'value': 'stampede', 'label': 'Stampede', 'icon': '⚠️'},
    {'value': 'other', 'label': 'Other', 'icon': '🚨'},
  ];

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLocationLoading = true;
    });

    try {
      // Check location permissions
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        _currentPosition = position;
        _isLocationLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLocationLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Location error: ${e.toString()}'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  Future<void> _triggerAlert() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Build location details
      final Map<String, dynamic> locationDetails = _currentPosition != null
          ? <String, dynamic>{
              'latitude': _currentPosition!.latitude,
              'longitude': _currentPosition!.longitude,
              'accuracy': _currentPosition!.accuracy,
              'timestamp': DateTime.now().toIso8601String(),
            }
          : <String, dynamic>{};

      // Trigger alert
      final result = await _alertService.triggerAlert(
        type: _selectedType,
        severity: _selectedSeverity,
        title: _titleController.text.trim().isNotEmpty
            ? _titleController.text.trim()
            : '${_alertTypes.firstWhere((t) => t['value'] == _selectedType)['label']} Emergency Alert',
        description: _descriptionController.text.trim(),
        locationDetails: locationDetails,
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Emergency alert triggered successfully'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );

          // Navigate back after delay
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              Navigator.of(context).pop(true); // Return true to indicate success
            }
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: ${result['error'] ?? 'Failed to trigger alert'}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🚨 Trigger Emergency Alert'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Alert Type Selection
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Alert Type',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _alertTypes.map((type) {
                          final isSelected = _selectedType == type['value'];
                          return FilterChip(
                            label: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(type['icon']!),
                                const SizedBox(width: 4),
                                Text(type['label']!),
                              ],
                            ),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                _selectedType = type['value']!;
                              });
                            },
                            selectedColor: Colors.red.shade100,
                            checkmarkColor: Colors.red,
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Severity Selection
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Severity',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(value: 'low', label: Text('Low')),
                          ButtonSegment(value: 'medium', label: Text('Medium')),
                          ButtonSegment(value: 'high', label: Text('High')),
                          ButtonSegment(value: 'critical', label: Text('Critical')),
                        ],
                        selected: {_selectedSeverity},
                        onSelectionChanged: (Set<String> newSelection) {
                          setState(() {
                            _selectedSeverity = newSelection.first;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Title Input
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: 'Alert Title (Optional)',
                  hintText: 'Leave empty for default title',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.title),
                ),
              ),

              const SizedBox(height: 16),

              // Description Input
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description (Optional)',
                  hintText: 'Additional details about the emergency',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.description),
                ),
                maxLines: 4,
              ),

              const SizedBox(height: 16),

              // Location Status
              Card(
                color: _currentPosition != null ? Colors.green.shade50 : Colors.orange.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        _currentPosition != null ? Icons.location_on : Icons.location_off,
                        color: _currentPosition != null ? Colors.green : Colors.orange,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentPosition != null
                                  ? 'Location captured'
                                  : 'Location not available',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            if (_currentPosition != null)
                              Text(
                                '${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                      ),
                      if (_isLocationLoading)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else
                        IconButton(
                          icon: const Icon(Icons.refresh),
                          onPressed: _getCurrentLocation,
                          tooltip: 'Refresh location',
                        ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Warning Message
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  border: Border.all(color: Colors.orange),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber, color: Colors.orange),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'This will trigger a REAL emergency alert. All students and staff will be notified immediately.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.orange.shade900,
                            ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Trigger Button
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _triggerAlert,
                icon: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.emergency),
                label: Text(_isLoading ? 'Triggering Alert...' : '🚨 TRIGGER EMERGENCY ALERT'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

