/// Phase 3.2.4: Group Game Setup Screen
/// Allows teacher to set up a group game session before starting

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/group_game_service.dart';
import 'bag_packer_game_screen.dart';
import 'hazard_hunter_game_screen.dart';
import 'earthquake_shake_game_screen.dart';

class GroupGameSetupScreen extends ConsumerStatefulWidget {
  final String gameType;

  const GroupGameSetupScreen({
    super.key,
    required this.gameType,
  });

  @override
  ConsumerState<GroupGameSetupScreen> createState() => _GroupGameSetupScreenState();
}

class _GroupGameSetupScreenState extends ConsumerState<GroupGameSetupScreen> {
  final GroupGameService _groupGameService = GroupGameService();
  bool _isLoading = false;
  String? _selectedClassId;
  List<Map<String, dynamic>> _availableClasses = [];
  final List<Map<String, dynamic>> _selectedStudents = [];

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    try {
      // Load classes from teacher provider
      // This would typically come from teacher service
      // For now, using empty list - will be populated from teacher service
      setState(() {
        _availableClasses = [];
      });
    } catch (e) {
      print('Error loading classes: $e');
    }
  }

  Future<void> _startGroupGame() async {
    if (_selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a class')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final session = await _groupGameService.startGroupGameSession(
        classId: _selectedClassId!,
        gameType: widget.gameType,
        participantIds: _selectedStudents.map((s) => s['id'] as String).toList(),
      );

      if (mounted) {
        final activityId = session['_id']?.toString() ?? session['id']?.toString();
        
        // Navigate to game screen with group mode enabled
        Navigator.pushReplacement<void, void>(
          context,
          MaterialPageRoute<void>(
            builder: (context) {
              switch (widget.gameType) {
                case 'bag-packer':
                  return BagPackerGameScreen(
                    isGroupMode: true,
                    groupActivityId: activityId,
                  );
                case 'hazard-hunter':
                  return HazardHunterGameScreen(
                    isGroupMode: true,
                    groupActivityId: activityId,
                  );
                case 'earthquake-shake':
                  return EarthquakeShakeGameScreen(
                    isGroupMode: true,
                    groupActivityId: activityId,
                  );
                default:
                  return const SizedBox();
              }
            },
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error starting group game: $e')),
        );
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Setup Group Game - ${widget.gameType}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Instructions
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.info_outline, color: Colors.blue),
                              const SizedBox(width: 8),
                              Text(
                                'Group Game Setup',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'In group mode, multiple students can play turns on the same device. '
                            'After each turn, assign which student played.',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Class Selection
                  Text(
                    'Select Class',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedClassId,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: 'Class',
                    ),
                    items: _availableClasses.map((cls) {
                      final id = cls['_id']?.toString() ?? cls['id']?.toString() ?? '';
                      final name = cls['name']?.toString() ?? 
                                  '${cls['grade'] ?? ''}-${cls['section'] ?? ''}';
                      return DropdownMenuItem(
                        value: id,
                        child: Text(name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedClassId = value;
                        _selectedStudents.clear();
                      });
                      // Load students for selected class
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Student Selection (Optional - can add all students)
                  if (_selectedClassId != null) ...[
                    Text(
                      'Select Students (Optional)',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Leave empty to allow all students in class to participate',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  const SizedBox(height: 32),
                  
                  // Start Game Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _selectedClassId != null ? _startGroupGame : null,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start Group Game'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

