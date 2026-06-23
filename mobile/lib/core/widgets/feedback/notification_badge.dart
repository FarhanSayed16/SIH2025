/// Phase 101.2: Notification Badge Component
/// A notification badge widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Notification Badge - Badge for notifications
class NotificationBadge extends StatelessWidget {
  /// Badge count (0 = hide badge)
  final int count;

  /// Badge color
  final Color? color;

  /// Badge text color
  final Color? textColor;

  /// Maximum count to show (above shows as "max+")
  final int maxCount;

  /// Badge size
  final double size;

  /// Position offset
  final Offset? offset;

  const NotificationBadge({
    super.key,
    required this.count,
    this.color,
    this.textColor,
    this.maxCount = 99,
    this.size = 20,
    this.offset,
  });

  @override
  Widget build(BuildContext context) {
    if (count <= 0) {
      return const SizedBox.shrink();
    }

    final displayCount = count > maxCount ? '$maxCount+' : count.toString();
    final badgeColor = color ?? AppColors.primaryRed;
    final badgeTextColor = textColor ?? AppColors.textWhite;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      constraints: BoxConstraints(
        minWidth: size,
        minHeight: size,
      ),
      decoration: BoxDecoration(
        color: badgeColor,
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.backgroundWhite,
          width: 2,
        ),
      ),
      child: Center(
        child: Text(
          displayCount,
          style: AppTextStyles.caption.copyWith(
            color: badgeTextColor,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

/// Notification Badge Wrapper - Wraps a widget with a notification badge
class NotificationBadgeWrapper extends StatelessWidget {
  /// Child widget
  final Widget child;

  /// Badge count
  final int count;

  /// Badge position
  final BadgePosition position;

  /// Badge color
  final Color? badgeColor;

  const NotificationBadgeWrapper({
    super.key,
    required this.child,
    required this.count,
    this.position = BadgePosition.topRight,
    this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    if (count <= 0) {
      return child;
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        Positioned(
          top: position == BadgePosition.topRight || position == BadgePosition.topLeft
              ? -8
              : null,
          bottom: position == BadgePosition.bottomRight || position == BadgePosition.bottomLeft
              ? -8
              : null,
          right: position == BadgePosition.topRight || position == BadgePosition.bottomRight
              ? -8
              : null,
          left: position == BadgePosition.topLeft || position == BadgePosition.bottomLeft
              ? -8
              : null,
          child: NotificationBadge(
            count: count,
            color: badgeColor,
          ),
        ),
      ],
    );
  }
}

/// Badge position enum
enum BadgePosition {
  topRight,
  topLeft,
  bottomRight,
  bottomLeft,
}

