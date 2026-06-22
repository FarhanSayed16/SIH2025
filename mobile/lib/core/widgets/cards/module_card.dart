/// Phase 101.2: Module Card Component
/// A card for displaying learning modules

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Module Card - Card for displaying learning modules
class ModuleCard extends StatelessWidget {
  /// Module title
  final String title;

  /// Module description
  final String? description;

  /// Module type/icon
  final IconData icon;

  /// Icon color
  final Color? iconColor;

  /// Progress (0.0 to 1.0)
  final double? progress;

  /// Difficulty level
  final String? difficulty;

  /// Duration in minutes
  final int? durationMinutes;

  /// Whether module is locked
  final bool isLocked;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  /// Custom padding
  final EdgeInsets? padding;

  const ModuleCard({
    super.key,
    required this.title,
    this.description,
    required this.icon,
    this.iconColor,
    this.progress,
    this.difficulty,
    this.durationMinutes,
    this.isLocked = false,
    this.onTap,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: AppBorders.borderRadiusLg,
      ),
      child: InkWell(
        onTap: isLocked ? null : onTap,
        borderRadius: AppBorders.borderRadiusLg,
        child: Padding(
          padding: padding ?? AppSpacing.card,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: (iconColor ?? AppColors.primaryGreen).withOpacity(0.1),
                  borderRadius: AppBorders.borderRadiusSm,
                ),
                child: Icon(
                  icon,
                  color: iconColor ?? AppColors.primaryGreen,
                  size: 30,
                ),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: AppTextStyles.h5,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isLocked)
                          Icon(
                            Icons.lock_outline,
                            size: 20,
                            color: AppColors.textSecondary,
                          ),
                      ],
                    ),
                    if (description != null) ...[
                      SizedBox(height: AppSpacing.xs),
                      Text(
                        description!,
                        style: AppTextStyles.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (progress != null || difficulty != null || durationMinutes != null) ...[
                      SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.xs,
                        children: [
                          if (progress != null)
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: AppSpacing.xs,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primaryGreenSubtle,
                                borderRadius: AppBorders.borderRadiusXs,
                              ),
                              child: Text(
                                '${(progress! * 100).toInt()}%',
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.primaryGreen,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          if (difficulty != null)
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: AppSpacing.xs,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.warningBackground,
                                borderRadius: AppBorders.borderRadiusXs,
                              ),
                              child: Text(
                                difficulty!,
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.warning,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          if (durationMinutes != null)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.access_time,
                                  size: 14,
                                  color: AppColors.textSecondary,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  '$durationMinutes min',
                                  style: AppTextStyles.caption,
                                ),
                              ],
                            ),
                        ],
                      ),
                    ],
                    if (progress != null && progress! > 0) ...[
                      SizedBox(height: AppSpacing.xs),
                      LinearProgressIndicator(
                        value: progress,
                        backgroundColor: AppColors.backgroundMedium,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.primaryGreen,
                        ),
                        minHeight: 4,
                        borderRadius: AppBorders.borderRadiusXs,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

