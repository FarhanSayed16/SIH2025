/**
 * Safety Equipment List Screen
 * Displays all safety equipment with filtering and quick access to map
 * Map Integration Plan - Phase 3
 */

import 'package:flutter/material.dart';
import '../services/map_data_service.dart';
import '../models/map_models.dart';
import 'blueprint_map_screen.dart';
import 'equipment_qr_scanner_screen.dart';

class SafetyEquipmentListScreen extends StatefulWidget {
  final String schoolId;
  final int? initialFloor;

  const SafetyEquipmentListScreen({
    Key? key,
    required this.schoolId,
    this.initialFloor,
  }) : super(key: key);

  @override
  State<SafetyEquipmentListScreen> createState() => _SafetyEquipmentListScreenState();
}

class _SafetyEquipmentListScreenState extends State<SafetyEquipmentListScreen> {
  final MapDataService _mapDataService = MapDataService();
  Future<MapDataModel>? _future;
  int? _floorFilter;
  String? _typeFilter;
  String? _statusFilter;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _floorFilter = widget.initialFloor;
    _future = _mapDataService.getMapData(widget.schoolId, floor: _floorFilter);
  }

  void _reload() {
    setState(() {
      _future = _mapDataService.getMapData(widget.schoolId, floor: _floorFilter);
    });
  }

  List<SafetyEquipmentModel> _filterEquipment(List<SafetyEquipmentModel> equipment) {
    return equipment.where((e) {
      if (_floorFilter != null && e.floor != _floorFilter) return false;
      if (_typeFilter != null && e.type != _typeFilter) return false;
      if (_statusFilter != null && e.status != _statusFilter) return false;
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        if (!e.name.toLowerCase().contains(query) &&
            !e.type.toLowerCase().contains(query)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'active':
        return Colors.green;
      case 'maintenance':
        return Colors.orange;
      case 'expired':
        return Colors.red;
      case 'missing':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'fire-extinguisher':
        return Icons.fire_extinguisher;
      case 'first-aid-kit':
        return Icons.medical_services;
      case 'aed':
        return Icons.favorite;
      case 'emergency-exit-sign':
        return Icons.exit_to_app;
      case 'fire-alarm':
        return Icons.warning;
      case 'sprinkler':
        return Icons.water_drop;
      case 'emergency-light':
        return Icons.lightbulb;
      case 'defibrillator':
        return Icons.medical_information;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety Equipment'),
        actions: [
          IconButton(
            icon: const Icon(Icons.map),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute<BlueprintMapScreen>(
                  builder: (context) => BlueprintMapScreen(
                    schoolId: widget.schoolId,
                    floor: _floorFilter,
                    title: 'Blueprint Map',
                  ),
                ),
              );
            },
            tooltip: 'View on Map',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _reload,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filters
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search equipment...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<int?>(
                        value: _floorFilter,
                        decoration: const InputDecoration(
                          labelText: 'Floor',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          const DropdownMenuItem<int?>(value: null, child: Text('All Floors')),
                          ...List.generate(5, (i) => DropdownMenuItem<int?>(value: i, child: Text('Floor $i'))),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _floorFilter = value;
                          });
                          _reload();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String?>(
                        value: _typeFilter,
                        decoration: const InputDecoration(
                          labelText: 'Type',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          const DropdownMenuItem<String?>(value: null, child: Text('All Types')),
                          const DropdownMenuItem<String?>(value: 'fire-extinguisher', child: Text('Fire Extinguisher')),
                          const DropdownMenuItem<String?>(value: 'first-aid-kit', child: Text('First Aid Kit')),
                          const DropdownMenuItem<String?>(value: 'aed', child: Text('AED')),
                          const DropdownMenuItem<String?>(value: 'emergency-exit-sign', child: Text('Exit Sign')),
                          const DropdownMenuItem<String?>(value: 'fire-alarm', child: Text('Fire Alarm')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _typeFilter = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String?>(
                        value: _statusFilter,
                        decoration: const InputDecoration(
                          labelText: 'Status',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                        items: [
                          const DropdownMenuItem<String?>(value: null, child: Text('All Status')),
                          const DropdownMenuItem<String?>(value: 'active', child: Text('Active')),
                          const DropdownMenuItem<String?>(value: 'maintenance', child: Text('Maintenance')),
                          const DropdownMenuItem<String?>(value: 'expired', child: Text('Expired')),
                          const DropdownMenuItem<String?>(value: 'missing', child: Text('Missing')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _statusFilter = value;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Equipment List
          Expanded(
            child: FutureBuilder<MapDataModel>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Failed to load equipment'),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _reload,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }
                final data = snapshot.data;
                if (data == null) {
                  return const Center(child: Text('No data available'));
                }

                final filtered = _filterEquipment(data.equipment);
                if (filtered.isEmpty) {
                  return const Center(child: Text('No equipment found'));
                }

                return ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final equipment = filtered[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: _getStatusColor(equipment.status).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _getTypeIcon(equipment.type),
                            color: _getStatusColor(equipment.status),
                          ),
                        ),
                        title: Text(
                          equipment.name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Type: ${equipment.type}'),
                            if (equipment.floor != null) Text('Floor: ${equipment.floor}'),
                            if (equipment.status != null)
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(equipment.status),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    equipment.status!,
                                    style: TextStyle(
                                      color: _getStatusColor(equipment.status),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.location_on),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute<BlueprintMapScreen>(
                                builder: (context) => BlueprintMapScreen(
                                  schoolId: widget.schoolId,
                                  floor: equipment.floor,
                                  title: equipment.name,
                                ),
                              ),
                            );
                          },
                          tooltip: 'View on Map',
                        ),
                        onTap: () {
                          showModalBottomSheet<void>(
                            context: context,
                            builder: (context) => _EquipmentDetailSheet(equipment: equipment),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute<EquipmentQRScannerScreen>(
              builder: (context) => EquipmentQRScannerScreen(
                schoolId: widget.schoolId,
              ),
            ),
          );
        },
        child: const Icon(Icons.qr_code_scanner),
        tooltip: 'Scan QR Code',
      ),
    );
  }
}

// Equipment Detail Sheet (reused from blueprint_map_screen.dart)
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

