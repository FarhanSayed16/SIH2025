import 'package:flutter/material.dart';
import '../../../core/design/design_system.dart';

class DrillPreparednessScreen extends StatelessWidget {
  const DrillPreparednessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Drill Preparedness'),
        backgroundColor: AppColors.primaryRed,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: ListView(
            children: const [
              _Section(
                title: '1) Before the drill',
                bulletPoints: [
                  'Note your nearest exit and secondary exit.',
                  'Keep your ID and essentials handy.',
                  'Stay with your class/group and listen to instructions.',
                ],
                icon: Icons.accessibility_new,
                color: Colors.blue,
              ),
              SizedBox(height: AppSpacing.lg),
              _Section(
                title: '2) During the drill',
                bulletPoints: [
                  'Follow the teacher/warden instructions calmly.',
                  'If indoors: Drop, Cover, Hold (earthquake) or stay low (fire).',
                  'Move to the assembly point using the marked route—no running/pushing.',
                ],
                icon: Icons.warning_amber_rounded,
                color: Colors.orange,
              ),
              SizedBox(height: AppSpacing.lg),
              _Section(
                title: '3) After reaching assembly',
                bulletPoints: [
                  'Report to your teacher/warden for headcount.',
                  'Report injuries or hazards immediately.',
                  'Wait for the “all clear” before re-entering.',
                ],
                icon: Icons.check_circle,
                color: Colors.green,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final List<String> bulletPoints;
  final IconData icon;
  final Color color;

  const _Section({
    required this.title,
    required this.bulletPoints,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    title,
                    style: AppTextStyles.h5.copyWith(color: color),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            ...bulletPoints.map(
              (b) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('•  ', style: TextStyle(height: 1.3)),
                    Expanded(
                      child: Text(
                        b,
                        style: AppTextStyles.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
