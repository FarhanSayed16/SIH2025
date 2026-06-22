/// Phase 101.2: Game Card Component
/// A card for displaying games

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Game Card - Card for displaying games
class GameCard extends StatelessWidget {
  /// Game title
  final String title;

  /// Game description
  final String? description;

  /// Game icon/image
  final Widget? image;

  /// Game icon data (fallback)
  final IconData? icon;

  /// Icon color
  final Color? iconColor;

  /// High score
  final int? highScore;

  /// Whether game supports group mode
  final bool supportsGroupMode;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  /// Custom padding
  final EdgeInsets? padding;

  const GameCard({
    super.key,
    required this.title,
    this.description,
    this.image,
    this.icon,
    this.iconColor,
    this.highScore,
    this.supportsGroupMode = false,
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
        onTap: onTap,
        borderRadius: AppBorders.borderRadiusLg,
        child: Padding(
          padding: padding ?? AppSpacing.card,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (image != null)
                    ClipRRect(
                      borderRadius: AppBorders.borderRadiusSm,
                      child: SizedBox(
                        width: 60,
                        height: 60,
                        child: image!,
                      ),
                    )
                  else if (icon != null)
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: (iconColor ?? AppColors.accentBlue).withOpacity(0.1),
                        borderRadius: AppBorders.borderRadiusSm,
                      ),
                      child: Icon(
                        icon,
                        color: iconColor ?? AppColors.accentBlue,
                        size: 30,
                      ),
                    ),
                  SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: AppTextStyles.h5,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
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
                      ],
                    ),
                  ),
                ],
              ),
              if (highScore != null || supportsGroupMode) ...[
                SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    if (highScore != null) ...[
                      Icon(
                        Icons.emoji_events,
                        size: 16,
                        color: AppColors.accentYellow,
                      ),
                      SizedBox(width: AppSpacing.xs),
                      Text(
                        'High: $highScore',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    if (supportsGroupMode) ...[
                      if (highScore != null) SizedBox(width: AppSpacing.md),
                      Icon(
                        Icons.group,
                        size: 16,
                        color: AppColors.accentBlue,
                      ),
                      SizedBox(width: AppSpacing.xs),
                      Text(
                        'Group',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

