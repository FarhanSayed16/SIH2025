import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import '../providers/teacher_provider.dart';
import 'class_management_screen.dart';

/// Teacher Dashboard Screen
/// Phase 2.5: K-12 Multi-Access
/// Phase 101.8.1: Redesigned with new component library
class TeacherDashboardScreen extends ConsumerWidget {
  const TeacherDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teacherState = ref.watch(teacherProvider);

    return Scaffold(
      appBar: AppBarCustom(
        title: 'Teacher Dashboard',
        actions: [
          IconButtonCustom(
            icon: Icons.refresh,
            onPressed: () => ref.read(teacherProvider.notifier).loadClasses(),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: teacherState.isLoading && teacherState.classes.isEmpty
          ? const LoadingState(message: 'Loading classes...')
          : teacherState.classes.isEmpty
              ? EmptyState(
                  icon: Icons.school_outlined,
                  title: 'No Classes Assigned',
                  message: 'Contact your administrator to assign classes',
                )
              : RefreshIndicator(
                  onRefresh: () => ref.read(teacherProvider.notifier).loadClasses(),
                  child: ScreenLayout(
                    padding: EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Text(
                          'My Classes',
                          style: AppTextStyles.h3,
                        ),
                        SizedBox(height: AppSpacing.md),
                        // Classes List
                        Expanded(
                          child: ListView.builder(
                            itemCount: teacherState.classes.length,
                            itemBuilder: (context, index) {
                              final classData = teacherState.classes[index];
                              final grade = classData['grade'] as String? ?? '';
                              final section = classData['section'] as String? ?? '';
                              final students = classData['studentIds'] as List? ?? [];
                              final studentCount = students.length;
                              
                              return Padding(
                                padding: EdgeInsets.only(bottom: AppSpacing.md),
                                child: ActionCard(
                                  title: 'Grade $grade - Section $section',
                                  subtitle: '$studentCount students',
                                  leadingIcon: Icons.class_,
                                  onTap: () {
                                    final classId = classData['_id'] as String? ?? 
                                                  classData['id'] as String? ?? '';
                                    ref.read(teacherProvider.notifier).selectClass(classId);
                                    // Navigate to class management
                                    Navigator.push<void>(
                                      context,
                                      MaterialPageRoute<void>(
                                        builder: (context) => ClassManagementScreen(
                                          classId: classId,
                                          classData: classData,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
      floatingActionButton: teacherState.classes.isNotEmpty
          ? FABButton(
              icon: Icons.add,
              label: 'Quick Actions',
              onPressed: () {
                // Quick action menu
                showModalBottomSheet<void>(
                  context: context,
                  builder: (context) => const QuickActionsSheet(),
                );
              },
            )
          : null,
    );
  }
}

/// Quick Actions Bottom Sheet
class QuickActionsSheet extends StatelessWidget {
  const QuickActionsSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Quick Actions',
            style: AppTextStyles.h3,
          ),
          SizedBox(height: AppSpacing.lg),
          ActionCard(
            title: 'Start Fire Drill',
            leadingIcon: Icons.local_fire_department,
            onTap: () {
              Navigator.pop(context);
              // Start drill logic
            },
          ),
          SizedBox(height: AppSpacing.md),
          ActionCard(
            title: 'Start Earthquake Drill',
            leadingIcon: Icons.waves,
            onTap: () {
              Navigator.pop(context);
              // Start drill logic
            },
          ),
          SizedBox(height: AppSpacing.md),
          ActionCard(
            title: 'View All Students',
            leadingIcon: Icons.people,
            onTap: () {
              Navigator.pop(context);
              // View students logic
            },
          ),
        ],
      ),
    );
  }
}

