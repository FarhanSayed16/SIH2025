/// Phase 3.2.4: Student Assignment Dialog
/// Allows teacher to assign which student played the game turn
/// Phase 3.2.6: Enhanced with QR code scanning

import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../qr/screens/qr_scanner_screen.dart';

class StudentAssignmentDialog extends StatefulWidget {
  final List<Map<String, dynamic>> students;
  final String? selectedStudentId;
  final String gameType;

  const StudentAssignmentDialog({
    super.key,
    required this.students,
    this.selectedStudentId,
    required this.gameType,
  });

  @override
  State<StudentAssignmentDialog> createState() =>
      _StudentAssignmentDialogState();
}

class _StudentAssignmentDialogState extends State<StudentAssignmentDialog> {
  String? _selectedStudentId;
  Map<String, dynamic>? _scannedStudent;

  @override
  void initState() {
    super.initState();
    _selectedStudentId = widget.selectedStudentId;
  }

  Future<void> _scanQRCode() async {
    try {
      // Navigate to QR scanner
      await Navigator.push<void>(
        context,
        MaterialPageRoute<void>(
          builder: (context) => QRScannerScreen(
            title: 'Scan Student QR Code',
            onQRScanned: (qrCode) async {
              // Verify QR code and get student info
              try {
                final apiService = ApiService();
                final response =
                    await apiService.get(ApiEndpoints.verifyQR(qrCode));
                final data = response.data as Map<String, dynamic>;
                final studentInfo = data['data'] as Map<String, dynamic>?;

                if (studentInfo != null && mounted) {
                  final studentId = studentInfo['studentId']?.toString();
                  if (studentId != null) {
                    // Update state with scanned student
                    setState(() {
                      _scannedStudent = studentInfo;
                      _selectedStudentId = studentId;
                    });

                    // Show success message
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                            'Student scanned: ${studentInfo['name'] ?? 'Unknown'}'),
                        backgroundColor: Colors.green,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
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
              }
            },
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error opening scanner: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.person_add, color: Colors.blue),
          const SizedBox(width: 8),
          Text('Assign Student - ${widget.gameType}'),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Scanned Student Info
            if (_scannedStudent != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green[300]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.check_circle,
                        color: Colors.green[700], size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _scannedStudent!['name']?.toString() ?? 'Unknown',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          if (_scannedStudent!['grade'] != null)
                            Text(
                              'Grade ${_scannedStudent!['grade']}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () {
                        setState(() {
                          _scannedStudent = null;
                          _selectedStudentId = null;
                        });
                      },
                    ),
                  ],
                ),
              ),
            // Student List or Empty State
            Flexible(
              child: widget.students.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.people_outline,
                                size: 48, color: Colors.grey),
                            SizedBox(height: 8),
                            Text('No students available'),
                            SizedBox(height: 8),
                            Text(
                              'Scan QR code or manually select',
                              style:
                                  TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: widget.students.length,
                      itemBuilder: (context, index) {
                        final student = widget.students[index];
                        final studentId = student['id']?.toString() ??
                            student['_id']?.toString() ??
                            '';
                        final studentName =
                            student['name']?.toString() ?? 'Unknown';
                        final grade = student['grade']?.toString();
                        final isSelected = _selectedStudentId == studentId;

                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor:
                                isSelected ? Colors.blue : Colors.grey[300],
                            child: Text(
                              studentName.isNotEmpty
                                  ? studentName[0].toUpperCase()
                                  : '?',
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : Colors.grey[700],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(studentName),
                          subtitle: grade != null ? Text('Grade $grade') : null,
                          trailing: isSelected
                              ? const Icon(Icons.check_circle,
                                  color: Colors.blue)
                              : null,
                          onTap: () {
                            setState(() {
                              _selectedStudentId = studentId;
                              _scannedStudent =
                                  null; // Clear scanned student when manually selecting
                            });
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      actions: [
        // QR Scan Button
        IconButton(
          icon: const Icon(Icons.qr_code_scanner),
          tooltip: 'Scan QR Code',
          onPressed: _scanQRCode,
        ),
        const SizedBox(width: 8),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _selectedStudentId != null
              ? () => Navigator.pop(context, _selectedStudentId)
              : null,
          child: const Text('Assign'),
        ),
      ],
    );
  }
}
