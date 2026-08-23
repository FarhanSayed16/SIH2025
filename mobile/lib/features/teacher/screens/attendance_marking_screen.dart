/// Phase 3.4.5: Attendance Marking Screen
/// Allows teachers to mark attendance for their class

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/teacher_service.dart';

class AttendanceMarkingScreen extends ConsumerStatefulWidget {
  final String classId;
  final List<Map<String, dynamic>> students;

  const AttendanceMarkingScreen({
    super.key,
    required this.classId,
    required this.students,
  });

  @override
  ConsumerState<AttendanceMarkingScreen> createState() =>
      _AttendanceMarkingScreenState();
}

class _AttendanceMarkingScreenState
    extends ConsumerState<AttendanceMarkingScreen> {
  final TeacherService _teacherService = TeacherService();
  final Map<String, String> _attendanceStatus = {}; // studentId -> status
  DateTime _selectedDate = DateTime.now();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    // Initialize all students as present by default
    for (var student in widget.students) {
      final studentId = student['_id'] as String? ?? student['id'] as String? ?? '';
      if (studentId.isNotEmpty) {
        _attendanceStatus[studentId] = 'present';
      }
    }
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);

    try {
      final records = _attendanceStatus.entries.map((entry) {
        return {
          'studentId': entry.key,
          'status': entry.value,
          'markedAt': DateTime.now().toIso8601String(),
        };
      }).toList();

      await _teacherService.markAttendance(
        widget.classId,
        _selectedDate.toIso8601String(),
        records,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance marked successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  void _changeAttendanceStatus(String studentId, String status) {
    setState(() {
      _attendanceStatus[studentId] = status;
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mark Attendance'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: _selectDate,
            tooltip: 'Select Date',
          ),
        ],
      ),
      body: Column(
        children: [
          // Date selector
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Attendance Date',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.calendar_today),
                  onPressed: _selectDate,
                ),
              ],
            ),
          ),

          // Summary chips
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryChip(
                  'Present',
                  _attendanceStatus.values.where((s) => s == 'present').length,
                  Colors.green,
                ),
                _buildSummaryChip(
                  'Absent',
                  _attendanceStatus.values.where((s) => s == 'absent').length,
                  Colors.red,
                ),
                _buildSummaryChip(
                  'Late',
                  _attendanceStatus.values.where((s) => s == 'late').length,
                  Colors.orange,
                ),
                _buildSummaryChip(
                  'Excused',
                  _attendanceStatus.values.where((s) => s == 'excused').length,
                  Colors.blue,
                ),
              ],
            ),
          ),

          const Divider(),

          // Students list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: widget.students.length,
              itemBuilder: (context, index) {
                final student = widget.students[index];
                final studentId =
                    student['_id'] as String? ?? student['id'] as String? ?? '';
                final name = student['name'] as String? ?? 'Unknown';
                final currentStatus = _attendanceStatus[studentId] ?? 'present';

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(currentStatus),
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    title: Text(name),
                    subtitle: Text(
                      'Status: ${currentStatus.toUpperCase()}',
                      style: TextStyle(
                        color: _getStatusColor(currentStatus),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    trailing: PopupMenuButton<String>(
                      icon: Icon(
                        _getStatusIcon(currentStatus),
                        color: _getStatusColor(currentStatus),
                      ),
                      onSelected: (value) =>
                          _changeAttendanceStatus(studentId, value),
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'present',
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green),
                              SizedBox(width: 8),
                              Text('Present'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'absent',
                          child: Row(
                            children: [
                              Icon(Icons.cancel, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Absent'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'late',
                          child: Row(
                            children: [
                              Icon(Icons.schedule, color: Colors.orange),
                              SizedBox(width: 8),
                              Text('Late'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'excused',
                          child: Row(
                            children: [
                              Icon(Icons.info, color: Colors.blue),
                              SizedBox(width: 8),
                              Text('Excused'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isSaving ? null : _saveAttendance,
            icon: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save),
            label: Text(_isSaving ? 'Saving...' : 'Save Attendance'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'absent':
        return Colors.red;
      case 'late':
        return Colors.orange;
      case 'excused':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'absent':
        return Icons.cancel;
      case 'late':
        return Icons.schedule;
      case 'excused':
        return Icons.info;
      default:
        return Icons.help;
    }
  }
}

