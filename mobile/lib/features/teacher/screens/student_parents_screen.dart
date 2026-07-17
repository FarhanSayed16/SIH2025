/// Student Parents Screen
/// Phase 7: Parent-Teacher-Student Linkage
/// List of all parents for a student

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../services/teacher_service.dart';
import 'parent_qr_scanner_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class StudentParentsScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String studentName;

  const StudentParentsScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  ConsumerState<StudentParentsScreen> createState() =>
      _StudentParentsScreenState();
}

final studentParentsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, studentId) async {
    final service = TeacherService();
    return await service.getStudentParents(studentId);
  },
);

class _StudentParentsScreenState extends ConsumerState<StudentParentsScreen> {
  @override
  Widget build(BuildContext context) {
    final parentsAsync = ref.watch(studentParentsProvider(widget.studentId));

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.studentName}\'s Parents'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ParentQRScannerScreen(
                    studentId: widget.studentId,
                  ),
                ),
              );
            },
            tooltip: 'Scan QR Code',
          ),
        ],
      ),
      body: parentsAsync.when(
        data: (parents) {
          if (parents.isEmpty) {
            return EmptyState(
              message: 'No parents linked to this student',
              icon: Icons.person_off,
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(studentParentsProvider(widget.studentId));
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: parents.length,
              itemBuilder: (context, index) {
                final parent = parents[index];
                final relationship = (parent['relationship'] as String?) ?? 'N/A';
                final isPrimary = (parent['isPrimary'] as bool?) == true;
                final verified = (parent['verified'] as bool?) == true;
                final phone = (parent['phone'] as String?) ??
                    (parent['parentProfile']?['phoneNumber'] as String?) ??
                    '';
                final email = (parent['email'] as String?) ?? '';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ExpansionTile(
                    leading: CircleAvatar(
                      backgroundColor: verified
                          ? Colors.green.shade100
                          : Colors.orange.shade100,
                      child: Icon(
                        verified ? Icons.check_circle : Icons.pending,
                        color: verified ? Colors.green : Colors.orange,
                      ),
                    ),
                    title: Text(
                      (parent['name'] as String?) ?? 'Unknown',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Relationship: $relationship'),
                        if (isPrimary)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Primary',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                              ),
                            ),
                          ),
                      ],
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            // Contact Information
                            if (email.isNotEmpty)
                              ListTile(
                                leading: const Icon(Icons.email),
                                title: const Text('Email'),
                                subtitle: Text(email),
                                trailing: IconButton(
                                  icon: const Icon(Icons.open_in_new),
                                  onPressed: () async {
                                    final uri = Uri.parse('mailto:$email');
                                    if (await canLaunchUrl(uri)) {
                                      await launchUrl(uri);
                                    }
                                  },
                                ),
                              ),
                            if (phone.isNotEmpty)
                              ListTile(
                                leading: const Icon(Icons.phone),
                                title: const Text('Phone'),
                                subtitle: Text(phone),
                                trailing: IconButton(
                                  icon: const Icon(Icons.call),
                                  onPressed: () async {
                                    final uri = Uri.parse('tel:$phone');
                                    if (await canLaunchUrl(uri)) {
                                      await launchUrl(uri);
                                    }
                                  },
                                ),
                              ),
                            const Divider(),
                            // Verification Status
                            ListTile(
                              leading: Icon(
                                verified
                                    ? Icons.verified_user
                                    : Icons.pending_actions,
                                color: verified ? Colors.green : Colors.orange,
                              ),
                              title: Text(
                                verified ? 'Verified' : 'Not Verified',
                                style: TextStyle(
                                  color: verified ? Colors.green : Colors.orange,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              subtitle: verified && (parent['verifiedAt'] != null)
                                  ? Text(
                                      'Verified on: ${_formatDate(parent['verifiedAt'] as String?)}',
                                    )
                                  : const Text('Verification pending'),
                            ),
                            // QR Code Scan Button
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ParentQRScannerScreen(
                                      studentId: widget.studentId,
                                    ),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.qr_code_scanner),
                              label: const Text('Scan QR Code'),
                              style: ElevatedButton.styleFrom(
                                minimumSize: const Size(double.infinity, 48),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
        loading: () => const LoadingState(),
        error: (error, stack) => ErrorState(
          message: error.toString(),
          onRetry: () {
            ref.invalidate(studentParentsProvider(widget.studentId));
          },
        ),
      ),
    );
  }

  String _formatDate(dynamic dateValue) {
    try {
      final dateString = dateValue.toString();
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateValue.toString();
    }
  }
}

