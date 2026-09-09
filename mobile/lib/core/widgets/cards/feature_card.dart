/// Compact feature / quick-action card (B4).
/// Leading icon, title, one supporting line — no empty Expanded space or corner arrow.

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

class FeatureCard extends StatelessWidget {
  final String title;
  final String? description;
  final IconData icon;
  final Color? iconColor;
  final List<Color>? gradientColors;
  final bool clickable;
  final VoidCallback? onTap;
  final EdgeInsets? padding;

  /// When true, card sizes to content (list / wrap). When false, fills grid cell.
  final bool compact;

  const FeatureCard({
    super.key,
    required this.title,
    this.description,
    required this.icon,
    this.iconColor,
    this.gradientColors,
    this.clickable = false,
    this.onTap,
    this.padding,
    this.compact = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = iconColor ?? AppColors.primaryGreen;
    final useGradient = gradientColors != null && gradientColors!.length >= 2;
    final onAccent = useGradient ? Colors.white : accent;
    final titleColor =
        useGradient ? AppColors.textWhite : theme.colorScheme.onSurface;
    final bodyColor = useGradient
        ? AppColors.textLight.withValues(alpha: 0.9)
        : theme.colorScheme.onSurfaceVariant;

    final content = Padding(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.md,
          ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: useGradient
                  ? Colors.white.withValues(alpha: 0.2)
                  : accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AppBorders.radiusMd),
            ),
            child: Icon(icon, size: 22, color: onAccent),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: titleColor,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    description!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: bodyColor,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    final decorated = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppBorders.radiusLg),
        gradient: useGradient
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradientColors!,
              )
            : null,
        color: useGradient ? null : theme.colorScheme.surface,
        border: useGradient
            ? null
            : Border.all(color: accent.withValues(alpha: 0.22)),
        boxShadow: [
          BoxShadow(
            color: AppColors.divider.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: content,
    );

    final child = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: clickable ? onTap : null,
        borderRadius: BorderRadius.circular(AppBorders.radiusLg),
        child: decorated,
      ),
    );

    if (compact) return child;

    return SizedBox.expand(child: child);
  }
}
