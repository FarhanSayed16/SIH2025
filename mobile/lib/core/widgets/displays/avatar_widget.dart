/// Phase 101.2: Avatar Widget Component
/// A styled avatar widget

import 'package:flutter/material.dart';
import '../../design/design_system.dart';

/// Avatar Widget - Circular avatar widget
class AvatarWidget extends StatelessWidget {
  /// Image URL
  final String? imageUrl;

  /// Name/initials (fallback if no image)
  final String? name;

  /// Avatar size
  final double size;

  /// Background color
  final Color? backgroundColor;

  /// Text color
  final Color? textColor;

  /// Border color
  final Color? borderColor;

  /// Border width
  final double? borderWidth;

  /// Whether to show online indicator
  final bool showOnlineIndicator;

  /// Online status
  final bool isOnline;

  const AvatarWidget({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 40,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
    this.borderWidth,
    this.showOnlineIndicator = false,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget avatar;

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      avatar = CircleAvatar(
        radius: size / 2,
        backgroundImage: NetworkImage(imageUrl!),
        backgroundColor: backgroundColor ?? AppColors.backgroundMedium,
      );
    } else {
      final initials = _getInitials(name ?? 'U');
      avatar = CircleAvatar(
        radius: size / 2,
        backgroundColor: backgroundColor ?? AppColors.primaryGreen,
        child: Text(
          initials,
          style: AppTextStyles.bodyMedium.copyWith(
            color: textColor ?? AppColors.textWhite,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    if (borderColor != null || borderWidth != null) {
      avatar = Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: borderColor ?? AppColors.borderLight,
            width: borderWidth ?? 2,
          ),
        ),
        child: avatar,
      );
    }

    if (showOnlineIndicator) {
      return Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: size * 0.3,
              height: size * 0.3,
              decoration: BoxDecoration(
                color: isOnline ? AppColors.success : AppColors.textDisabled,
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.backgroundWhite,
                  width: 2,
                ),
              ),
            ),
          ),
        ],
      );
    }

    return avatar;
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return 'U';
    if (parts.length == 1) {
      return parts[0][0].toUpperCase();
    }
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }
}

