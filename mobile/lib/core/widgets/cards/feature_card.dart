/// Phase 101.2: Feature Card Component
/// Professional quick-action card with accent color, icon, and optional description.
/// Used in home screen Quick Actions and similar grids.

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Feature Card - Professional card for quick actions
class FeatureCard extends StatelessWidget {
  /// Feature title
  final String title;

  /// Feature description (optional)
  final String? description;

  /// Feature icon
  final IconData icon;

  /// Accent color for icon, left bar, and highlights
  final Color? iconColor;

  /// Optional gradient (e.g. for primary CTA). When set, card uses gradient background.
  final List<Color>? gradientColors;

  /// Whether card is tappable
  final bool clickable;

  /// Callback when card is tapped
  final VoidCallback? onTap;

  /// Custom padding
  final EdgeInsets? padding;

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
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = iconColor ?? AppColors.primaryGreen;
    final useGradient = gradientColors != null && gradientColors!.length >= 2;

    final contentRadius = useGradient
        ? BorderRadius.circular(AppBorders.radiusLg)
        : const BorderRadius.only(
            topRight: Radius.circular(AppBorders.radiusLg),
            bottomRight: Radius.circular(AppBorders.radiusLg),
          );
    final content = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: contentRadius,
        gradient: useGradient
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradientColors!,
              )
            : null,
        color: useGradient ? null : theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: (useGradient ? accent : AppColors.divider).withOpacity(0.12),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
        border: useGradient
            ? null
            : Border.all(
                color: accent.withOpacity(0.2),
                width: 1,
              ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.max,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: useGradient
                  ? Colors.white.withOpacity(0.2)
                  : accent.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppBorders.radiusMd),
            ),
            child: Icon(
              icon,
              size: 26,
              color: useGradient ? Colors.white : accent,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            title,
            style: AppTextStyles.h4.copyWith(
              color: useGradient ? AppColors.textWhite : AppColors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (description != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Expanded(
              child: Text(
                description!,
                style: AppTextStyles.bodySmall.copyWith(
                  color: useGradient
                      ? AppColors.textLight.withOpacity(0.9)
                      : AppColors.textSecondary,
                  fontSize: 12,
                  height: 1.35,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
          if (clickable && !useGradient) ...[
            const SizedBox(height: AppSpacing.xs),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 16,
                  color: accent.withOpacity(0.7),
                ),
              ],
            ),
          ],
        ],
      ),
    );

    if (useGradient) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: clickable ? onTap : null,
          borderRadius: BorderRadius.circular(AppBorders.radiusLg),
          child: content,
        ),
      );
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: clickable ? onTap : null,
        borderRadius: BorderRadius.circular(AppBorders.radiusLg),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppBorders.radiusLg),
          child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: accent,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(AppBorders.radiusLg),
                  bottomLeft: Radius.circular(AppBorders.radiusLg),
                ),
              ),
            ),
            Expanded(child: content),
          ],
        ),
        ),
      ),
    );
  }
}
