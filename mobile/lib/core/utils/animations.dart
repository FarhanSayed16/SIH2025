/// Phase 101.9.1: Animation Utilities
/// Reusable animations for consistent UI interactions

import 'package:flutter/material.dart';

/// Animation utilities
class AnimationUtils {
  /// Fade in animation
  static Animation<double> fadeInAnimation(AnimationController controller) {
    return Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.easeIn,
      ),
    );
  }

  /// Slide in animation
  static Animation<Offset> slideInAnimation(
    AnimationController controller,
    Offset begin,
    Offset end,
  ) {
    return Tween<Offset>(begin: begin, end: end).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.easeOutCubic,
      ),
    );
  }

  /// Scale animation
  static Animation<double> scaleAnimation(AnimationController controller) {
    return Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.elasticOut,
      ),
    );
  }

  /// Bounce animation
  static Animation<double> bounceAnimation(AnimationController controller) {
    return Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.bounceOut,
      ),
    );
  }

  /// Pulse animation
  static Animation<double> pulseAnimation(AnimationController controller) {
    return Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  /// Standard page transition curve
  static Curve get pageTransitionCurve => Curves.easeOutCubic;

  /// Standard page transition duration
  static Duration get pageTransitionDuration => const Duration(milliseconds: 300);

  /// Button press animation duration
  static Duration get buttonPressDuration => const Duration(milliseconds: 150);

  /// Loading animation duration
  static Duration get loadingAnimationDuration => const Duration(milliseconds: 1200);

  /// Success animation duration
  static Duration get successAnimationDuration => const Duration(milliseconds: 500);
}

/// Animation presets
class AnimationPresets {
  /// Standard fade transition
  static Widget fadeTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: animation,
      child: child,
    );
  }

  /// Slide from right transition
  static Widget slideFromRightTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    const begin = Offset(1.0, 0.0);
    const end = Offset.zero;
    const curve = Curves.easeOutCubic;

    final slideAnimation = Tween<Offset>(begin: begin, end: end).animate(
      CurvedAnimation(parent: animation, curve: curve),
    );

    return SlideTransition(
      position: slideAnimation,
      child: child,
    );
  }

  /// Scale transition
  static Widget scaleTransition(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    const curve = Curves.easeOutCubic;
    final scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: animation, curve: curve),
    );

    return ScaleTransition(
      scale: scaleAnimation,
      child: FadeTransition(
        opacity: animation,
        child: child,
      ),
    );
  }
}

