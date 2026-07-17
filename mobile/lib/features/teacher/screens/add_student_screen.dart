import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/teacher_service.dart';
import '../providers/teacher_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Add Student Screen
/// Allows teachers to manually add students to their classes (KG-4th grade)
class AddStudentScreen extends ConsumerStatefulWidget {
  final String classId;
  final String grade;
  final String section;

  const AddStudentScreen({
    super.key,
    required this.classId,
    required this.grade,
    required this.section,
  });

  @override
  ConsumerState<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends ConsumerState<AddStudentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _parentNameController = TextEditingController();
  final _parentPhoneController = TextEditingController();
  final _notesController = TextEditingController();
  
  bool _isLoading = false;
  final TeacherService _teacherService = TeacherService();

  @override
  void dispose() {
    _nameController.dispose();
    _parentNameController.dispose();
    _parentPhoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _addStudent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await _teacherService.createRosterStudent(
        widget.classId,
        name: _nameController.text.trim(),
        parentName: _parentNameController.text.trim().isEmpty
            ? null
            : _parentNameController.text.trim(),
        parentPhone: _parentPhoneController.text.trim().isEmpty
            ? null
            : _parentPhoneController.text.trim(),
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      );

      if (mounted) {
        // Refresh the class students list
        ref.read(teacherProvider.notifier).selectClass(widget.classId);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Student added successfully!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
        
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding student: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check if grade is KG-4th
    final gradeNum = widget.grade == 'KG' ? 0 : int.tryParse(widget.grade) ?? 0;
    final isEligible = gradeNum <= 4;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Student'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Card
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Grade ${widget.grade} - Section ${widget.section}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (!isEligible)
                        Text(
                          'Note: Manual student addition is only available for KG-4th grade classes.',
                          style: TextStyle(
                            color: Colors.orange[700],
                            fontSize: 14,
                          ),
                        )
                      else
                        Text(
                          'Add a student who cannot register themselves. This student will be managed by you during drills and activities.',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 14,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Student Name (Required)
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Student Name *',
                  hintText: 'Enter student full name',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.words,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Student name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'Name must be at least 2 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Parent Name (Optional)
              TextFormField(
                controller: _parentNameController,
                decoration: const InputDecoration(
                  labelText: 'Parent/Guardian Name',
                  hintText: 'Enter parent or guardian name (optional)',
                  prefixIcon: Icon(Icons.family_restroom),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 16),

              // Parent Phone (Optional)
              TextFormField(
                controller: _parentPhoneController,
                decoration: const InputDecoration(
                  labelText: 'Parent/Guardian Phone',
                  hintText: 'Enter phone number (optional)',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(10),
                ],
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    if (value.length != 10) {
                      return 'Phone number must be 10 digits';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Notes (Optional)
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes',
                  hintText: 'Any additional notes (optional)',
                  prefixIcon: Icon(Icons.note),
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 32),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isEligible && !_isLoading ? _addStudent : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Add Student',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),

              if (!isEligible) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.orange[50],
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.orange[700]),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Students in Grade ${widget.grade} should register themselves using the app or QR code.',
                            style: TextStyle(
                              color: Colors.orange[900],
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

