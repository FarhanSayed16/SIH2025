import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/teacher_provider.dart';
import '../../qr/screens/qr_scanner_screen.dart';
import 'attendance_marking_screen.dart';
import 'xp_assignment_screen.dart';
import 'group_quiz_trigger_screen.dart';
import 'student_progress_screen.dart';
import 'add_student_screen.dart';
import 'drill_participation_tracking_screen.dart';
import 'drill_dashboard_screen.dart';
import '../../drills/services/drill_service.dart';
import 'class_parents_screen.dart';

/// Class Management Screen
/// Phase 2.5: K-12 Multi-Access
/// Shows students in a class and allows management
class ClassManagementScreen extends ConsumerStatefulWidget {
  final String classId;
  final Map<String, dynamic> classData;

  const ClassManagementScreen({
    super.key,
    required this.classId,
    required this.classData,
  });

  @override
  ConsumerState<ClassManagementScreen> createState() =>
      _ClassManagementScreenState();
}

class _ClassManagementScreenState extends ConsumerState<ClassManagementScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    // Set up periodic refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) {
        ref.read(teacherProvider.notifier).selectClass(widget.classId);
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final teacherState = ref.watch(teacherProvider);
    final students = teacherState.students ?? [];

    final grade = widget.classData['grade'] as String? ?? '';
    final section = widget.classData['section'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text('Grade $grade - Section $section'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => QRScannerScreen(
                    title: 'Scan Student QR',
                    onQRScanned: (qrCode) {
                      // Handle QR scan - verify student
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('QR Scanned: $qrCode'),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: teacherState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : students.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline,
                          size: 80, color: Colors.grey),
                      const SizedBox(height: 20),
                      const Text(
                        'No Students in Class',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Students will appear here once assigned',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => ref
                      .read(teacherProvider.notifier)
                      .selectClass(widget.classId),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Class Info Card
                      Card(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor:
                                        Theme.of(context).colorScheme.primary,
                                    child: Text(
                                      '$grade-$section',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Grade $grade - Section $section',
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          '${students.length} students',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Phase 3.4.5: Quick Actions
                      const Text(
                        'Quick Actions',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Quick Actions Grid
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        children: [
                          _buildActionCard(
                            context,
                            'Mark Attendance',
                            Icons.how_to_reg,
                            Colors.blue,
                            () => _navigateToAttendance(context, ref),
                          ),
                          _buildActionCard(
                            context,
                            'Assign XP',
                            Icons.star,
                            Colors.amber,
                            () => _navigateToXP(context, ref),
                          ),
                          _buildActionCard(
                            context,
                            'Trigger Quiz',
                            Icons.quiz,
                            Colors.green,
                            () => _navigateToQuiz(context, ref),
                          ),
                          _buildActionCard(
                            context,
                            'View Progress',
                            Icons.assessment,
                            Colors.purple,
                            () => _navigateToProgress(context, ref),
                          ),
                          _buildActionCard(
                            context,
                            'Drill Dashboard',
                            Icons.flash_on,
                            Colors.orange,
                            () => _navigateToDrillDashboard(context),
                          ), 
                          _buildActionCard(
                            context,
                            'View Parents',
                            Icons.people,
                            Colors.teal,
                            () => _navigateToClassParents(context),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Students List Header with Add Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Students',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          // Check if grade is KG-4th for manual addition
                          if ((grade == 'KG' ||
                              (int.tryParse(grade) ?? 0) <= 4))
                            TextButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => AddStudentScreen(
                                      classId: widget.classId,
                                      grade: grade,
                                      section: section,
                                    ),
                                  ),
                                ).then((success) {
                                  if (success == true) {
                                    // Refresh students list
                                    ref
                                        .read(teacherProvider.notifier)
                                        .selectClass(widget.classId);
                                  }
                                });
                              },
                              icon: const Icon(Icons.person_add, size: 20),
                              label: const Text('Add Student'),
                              style: TextButton.styleFrom(
                                foregroundColor:
                                    Theme.of(context).colorScheme.primary,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      ...students.map((student) {
                        final name = student['name'] as String? ?? 'Unknown';
                        final grade = student['grade'] as String? ?? '';
                        final section = student['section'] as String? ?? '';
                        final qrBadgeId = student['qrBadgeId'] as String?;
                        final canUseApp =
                            student['canUseApp'] as bool? ?? false;

                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor:
                                  canUseApp ? Colors.green : Colors.orange,
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : '?',
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(name),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Grade $grade - Section $section'),
                                if (qrBadgeId != null)
                                  Text(
                                    'Badge: $qrBadgeId',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                              ],
                            ),
                            trailing: Icon(
                              canUseApp ? Icons.phone_android : Icons.tablet,
                              color: canUseApp ? Colors.green : Colors.orange,
                            ),
                            onTap: () {
                              // Show student details
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: Text(name),
                                  content: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('Grade: $grade'),
                                      Text('Section: $section'),
                                      if (qrBadgeId != null)
                                        Text('QR Badge: $qrBadgeId'),
                                      const SizedBox(height: 8),
                                      Text(
                                        'App Access: ${canUseApp ? "Yes" : "No (Teacher-led)"}',
                                        style: TextStyle(
                                          color: canUseApp
                                              ? Colors.green
                                              : Colors.orange,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Close'),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        );
                      }),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Start drill for class
          _showDrillTypeSelection(context, ref);
        },
        icon: const Icon(Icons.play_arrow),
        label: const Text('Start Drill'),
      ),
    );
  }

  // Phase 3.4.5: Helper methods for navigation

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                color.withOpacity(0.1),
                color.withOpacity(0.05),
              ],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToAttendance(BuildContext context, WidgetRef ref) {
    final students = ref.read(teacherProvider).students ?? [];
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AttendanceMarkingScreen(
          classId: widget.classId,
          students: students,
        ),
      ),
    ).then((success) {
      if (success == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance marked successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  void _navigateToXP(BuildContext context, WidgetRef ref) {
    final students = ref.read(teacherProvider).students ?? [];
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => XPAssignmentScreen(
          classId: widget.classId,
          students: students,
        ),
      ),
    ).then((success) {
      if (success == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('XP assigned successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  void _navigateToQuiz(BuildContext context, WidgetRef ref) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GroupQuizTriggerScreen(
          classId: widget.classId,
        ),
      ),
    ).then((success) {
      if (success == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Group quiz triggered!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  void _navigateToProgress(BuildContext context, WidgetRef ref) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentProgressScreen(
          classId: widget.classId,
        ),
      ),
    );
  }

  void _navigateToDrillDashboard(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const DrillDashboardScreen(),
      ),
    );
  }

  void _navigateToClassParents(BuildContext context) {
    // Extract className from classData
    final grade = widget.classData['grade'] ?? '';
    final section = widget.classData['section'] ?? '';
    final className = '$grade $section'.trim().isEmpty 
        ? 'Class ${widget.classId}' 
        : '$grade $section'.trim();
    
    Navigator.push(
      context,
      MaterialPageRoute<dynamic>(
        builder: (context) => ClassParentsScreen(
          classId: widget.classId,
          className: className,
        ),
      ),
    );
  }

  /// Phase 3: Show drill type selection dialog
  void _showDrillTypeSelection(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start Drill'),
        content: const Text('Select drill type'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startDrillAndNavigate(context, ref, 'fire');
            },
            child: const Text('Fire Drill'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startDrillAndNavigate(context, ref, 'earthquake');
            },
            child: const Text('Earthquake Drill'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startDrillAndNavigate(context, ref, 'flood');
            },
            child: const Text('Flood Drill'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startDrillAndNavigate(context, ref, 'cyclone');
            },
            child: const Text('Cyclone Drill'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  /// Phase 3: Start drill and navigate to participation tracking
  Future<void> _startDrillAndNavigate(
    BuildContext context,
    WidgetRef ref,
    String drillType,
  ) async {
    try {
      // Show loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Starting ${drillType} drill...'),
          duration: const Duration(seconds: 2),
        ),
      );

      // Start drill
      await ref.read(teacherProvider.notifier).startDrill(drillType);

      // Wait a bit for the drill to be created
      await Future<void>.delayed(const Duration(seconds: 2));

      // Get active drills to find the one we just started
      final drillService = DrillService();
      final activeDrills = await drillService.getActiveDrills();
      if (activeDrills.isNotEmpty) {
        final newDrill = activeDrills.first;
        if (mounted) {
          // Navigate to participation tracking screen
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DrillParticipationTrackingScreen(
                drillId: newDrill.id,
                drillType: newDrill.type,
                classId: widget.classId,
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  '${drillType} drill started. Check Drill Dashboard for details.'),
              backgroundColor: Colors.green,
              action: SnackBarAction(
                label: 'View Dashboard',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const DrillDashboardScreen(),
                    ),
                  );
                },
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start drill: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
