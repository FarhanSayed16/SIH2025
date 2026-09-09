/// Class Parents Screen
/// Phase 7: Parent-Teacher-Student Linkage
/// All parents in the class with relationship matrix

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../services/teacher_service.dart';
import 'parent_qr_scanner_screen.dart';
import 'student_parents_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/design/design_system.dart';

class ClassParentsScreen extends ConsumerStatefulWidget {
  final String classId;
  final String className;

  const ClassParentsScreen({
    super.key,
    required this.classId,
    required this.className,
  });

  @override
  ConsumerState<ClassParentsScreen> createState() =>
      _ClassParentsScreenState();
}

final classParentsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>(
  (ref, classId) async {
    final service = TeacherService();
    return await service.getClassParents(classId);
  },
);

class _ClassParentsScreenState extends ConsumerState<ClassParentsScreen> {
  String _searchQuery = '';
  String? _selectedFilter; // 'all', 'verified', 'unverified'

  @override
  Widget build(BuildContext context) {
    final parentsAsync = ref.watch(classParentsProvider(widget.classId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Parents - ${widget.className}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute<dynamic>(
                  builder: (context) => ParentQRScannerScreen(
                    classId: widget.classId,
                  ),
                ),
              );
            },
            tooltip: 'Scan QR Code',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search parents...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              setState(() {
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: AppBorders.borderRadiusMd,
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
                const SizedBox(height: 12),
                // Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Verified', 'verified'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Unverified', 'unverified'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          // Parents List
          Expanded(
            child: parentsAsync.when(
              data: (parents) {
                // Filter parents
                var filteredParents = parents;
                
                // Apply search filter
                if (_searchQuery.isNotEmpty) {
                  filteredParents = filteredParents.where((parent) {
                    final name = (parent['name'] ?? '').toString().toLowerCase();
                    final email = (parent['email'] ?? '').toString().toLowerCase();
                    final query = _searchQuery.toLowerCase();
                    return name.contains(query) || email.contains(query);
                  }).toList();
                }

                // Apply verification filter
                if (_selectedFilter == 'verified') {
                  filteredParents = filteredParents
                      .where((parent) => parent['verified'] == true)
                      .toList();
                } else if (_selectedFilter == 'unverified') {
                  filteredParents = filteredParents
                      .where((parent) => parent['verified'] != true)
                      .toList();
                }

                if (filteredParents.isEmpty) {
                  return EmptyState(
                    message: _searchQuery.isNotEmpty || _selectedFilter != null
                        ? 'No parents match your filters'
                        : 'No parents found in this class',
                    icon: Icons.person_off,
                  );
                }

                // Group by student
                final Map<String, List<Map<String, dynamic>>> parentsByStudent = {};
                for (final parent in filteredParents) {
                  final studentId = parent['studentId']?.toString() ?? 'unknown';
                  final studentName = parent['studentName']?.toString() ?? 'Unknown Student';
                  final key = '$studentId|$studentName';
                  
                  if (!parentsByStudent.containsKey(key)) {
                    parentsByStudent[key] = [];
                  }
                  parentsByStudent[key]!.add(parent);
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(classParentsProvider(widget.classId));
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: parentsByStudent.length,
                    itemBuilder: (context, index) {
                      final entry = parentsByStudent.entries.elementAt(index);
                      final studentInfo = entry.key.split('|');
                      final studentId = studentInfo[0];
                      final studentName = studentInfo[1];
                      final studentParents = entry.value;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ExpansionTile(
                          leading: CircleAvatar(
                            child: Text(studentName[0].toUpperCase()),
                          ),
                          title: Text(
                            studentName,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            '${studentParents.length} parent${studentParents.length > 1 ? 's' : ''}',
                          ),
                          children: [
                            ...studentParents.map((parent) {
                              final relationship =
                                  (parent['relationship'] as String?) ?? 'N/A';
                              final isPrimary = (parent['isPrimary'] as bool?) == true;
                              final verified = (parent['verified'] as bool?) == true;
                              final phone = (parent['phone'] as String?) ??
                                  (parent['parentProfile']?['phoneNumber'] as String?) ??
                                  '';
                              final email = (parent['email'] as String?) ?? '';

                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: verified
                                      ? Colors.green.shade100
                                      : Colors.orange.shade100,
                                  child: Icon(
                                    verified
                                        ? Icons.check_circle
                                        : Icons.pending,
                                    color: verified ? Colors.green : Colors.orange,
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  (parent['name'] as String?) ?? 'Unknown',
                                  style: const TextStyle(fontWeight: FontWeight.w500),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Relationship: $relationship'),
                                    if (isPrimary)
                                      Container(
                                        margin: const EdgeInsets.only(top: 4),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.blue.shade100,
                                          borderRadius: AppBorders.borderRadiusSm,
                                        ),
                                        child: const Text(
                                          'Primary',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (email.isNotEmpty)
                                      IconButton(
                                        icon: const Icon(Icons.email),
                                        onPressed: () async {
                                          final uri = Uri.parse('mailto:$email');
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(uri);
                                          }
                                        },
                                      ),
                                    if (phone.isNotEmpty)
                                      IconButton(
                                        icon: const Icon(Icons.phone),
                                        onPressed: () async {
                                          final uri = Uri.parse('tel:$phone');
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(uri);
                                          }
                                        },
                                      ),
                                  ],
                                ),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute<dynamic>(
                                      builder: (context) => StudentParentsScreen(
                                        studentId: studentId,
                                        studentName: studentName,
                                      ),
                                    ),
                                  );
                                },
                              );
                            }),
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
                  ref.invalidate(classParentsProvider(widget.classId));
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = selected ? value : null;
        });
      },
    );
  }
}

