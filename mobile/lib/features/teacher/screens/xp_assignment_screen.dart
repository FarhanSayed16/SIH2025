/// Phase 3.4.5: XP Assignment Screen
/// Allows teachers to assign XP to students

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/teacher_service.dart';

class XPAssignmentScreen extends ConsumerStatefulWidget {
  final String classId;
  final List<Map<String, dynamic>> students;

  const XPAssignmentScreen({
    super.key,
    required this.classId,
    required this.students,
  });

  @override
  ConsumerState<XPAssignmentScreen> createState() =>
      _XPAssignmentScreenState();
}

class _XPAssignmentScreenState extends ConsumerState<XPAssignmentScreen> {
  final TeacherService _teacherService = TeacherService();
  final TextEditingController _xpAmountController = TextEditingController(
    text: '50',
  );
  final TextEditingController _reasonController = TextEditingController();
  final Set<String> _selectedStudentIds = {};
  bool _selectAll = false;
  bool _isAssigning = false;

  @override
  void dispose() {
    _xpAmountController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  void _toggleSelectAll() {
    setState(() {
      _selectAll = !_selectAll;
      if (_selectAll) {
        for (var student in widget.students) {
          final studentId =
              student['_id'] as String? ?? student['id'] as String? ?? '';
          if (studentId.isNotEmpty) {
            _selectedStudentIds.add(studentId);
          }
        }
      } else {
        _selectedStudentIds.clear();
      }
    });
  }

  void _toggleStudent(String studentId) {
    setState(() {
      if (_selectedStudentIds.contains(studentId)) {
        _selectedStudentIds.remove(studentId);
        _selectAll = false;
      } else {
        _selectedStudentIds.add(studentId);
        // Check if all are selected
        if (_selectedStudentIds.length == widget.students.length) {
          _selectAll = true;
        }
      }
    });
  }

  Future<void> _assignXP() async {
    final xpAmount = int.tryParse(_xpAmountController.text.trim());
    if (xpAmount == null || xpAmount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid XP amount'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_selectedStudentIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one student'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isAssigning = true);

    try {
      final _ = await _teacherService.assignXP(
        widget.classId,
        xpAmount,
        studentIds: _selectedStudentIds.toList(),
        reason: _reasonController.text.trim().isEmpty
            ? null
            : _reasonController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'XP assigned successfully to ${_selectedStudentIds.length} student(s)!',
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
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
        setState(() => _isAssigning = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Assign XP'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // XP Amount and Reason
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'XP Assignment Details',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _xpAmountController,
                  decoration: const InputDecoration(
                    labelText: 'XP Amount',
                    hintText: 'Enter XP amount',
                    prefixIcon: Icon(Icons.star),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _reasonController,
                  decoration: const InputDecoration(
                    labelText: 'Reason (Optional)',
                    hintText: 'e.g., Excellent participation',
                    prefixIcon: Icon(Icons.note),
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),

          // Select All toggle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Checkbox(
                  value: _selectAll,
                  onChanged: (_) => _toggleSelectAll(),
                ),
                const Text(
                  'Select All Students',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Text(
                  '${_selectedStudentIds.length} selected',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
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
                final isSelected = _selectedStudentIds.contains(studentId);

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                  color: isSelected
                      ? Theme.of(context).colorScheme.primaryContainer
                      : null,
                  child: CheckboxListTile(
                    value: isSelected,
                    onChanged: (_) => _toggleStudent(studentId),
                    title: Text(name),
                    secondary: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: const TextStyle(color: Colors.white),
                      ),
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
            onPressed: _isAssigning ? null : _assignXP,
            icon: _isAssigning
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.star),
            label: Text(
              _isAssigning
                  ? 'Assigning...'
                  : 'Assign XP (${_selectedStudentIds.length} students)',
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ),
    );
  }
}

