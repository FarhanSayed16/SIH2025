/// Phase 101.9.1: Page Transition Utilities
/// Enhanced page transitions for smooth navigation

import 'package:flutter/material.dart';

/// Custom page route with fade transition
class FadePageRoute<T> extends PageRouteBuilder<T> {
  final Widget child;

  FadePageRoute({required this.child, RouteSettings? settings})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => child,
          transitionDuration: const Duration(milliseconds: 300),
          reverseTransitionDuration: const Duration(milliseconds: 200),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
          settings: settings,
        );
}

/// Custom page route with slide transition
class SlidePageRoute<T> extends PageRouteBuilder<T> {
  final Widget child;
  final SlideDirection direction;

  SlidePageRoute({
    required this.child,
    this.direction = SlideDirection.right,
    RouteSettings? settings,
  }) : super(
          pageBuilder: (context, animation, secondaryAnimation) => child,
          transitionDuration: const Duration(milliseconds: 300),
          reverseTransitionDuration: const Duration(milliseconds: 250),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            Offset begin;
            Offset end = Offset.zero;

            switch (direction) {
              case SlideDirection.right:
                begin = const Offset(-1.0, 0.0);
                break;
              case SlideDirection.left:
                begin = const Offset(1.0, 0.0);
                break;
              case SlideDirection.top:
                begin = const Offset(0.0, 1.0);
                break;
              case SlideDirection.bottom:
                begin = const Offset(0.0, -1.0);
                break;
            }

            final slideTween = Tween(begin: begin, end: end);
            final curvedAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.easeInOutCubic,
            );

            return SlideTransition(
              position: slideTween.animate(curvedAnimation),
              child: child,
            );
          },
          settings: settings,
        );
}

/// Slide direction enum
enum SlideDirection {
  left,
  right,
  top,
  bottom,
}

/// Custom page route with scale transition
class ScalePageRoute<T> extends PageRouteBuilder<T> {
  final Widget child;

  ScalePageRoute({required this.child, RouteSettings? settings})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => child,
          transitionDuration: const Duration(milliseconds: 300),
          reverseTransitionDuration: const Duration(milliseconds: 200),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final scaleAnimation = Tween<double>(
              begin: 0.0,
              end: 1.0,
            ).animate(
              CurvedAnimation(
                parent: animation,
                curve: Curves.easeInOutCubic,
              ),
            );

            return ScaleTransition(
              scale: scaleAnimation,
              child: FadeTransition(
                opacity: animation,
                child: child,
              ),
            );
          },
          settings: settings,
        );
}

/// Enhanced Material Page Route with smooth transitions
class SmoothMaterialPageRoute<T> extends MaterialPageRoute<T> {
  SmoothMaterialPageRoute({
    required super.builder,
    super.settings,
    bool maintainState = true,
    bool fullscreenDialog = false,
  }) : super(
          maintainState: maintainState,
          fullscreenDialog: fullscreenDialog,
        );

  @override
  Widget buildTransitions(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Smooth fade + slide transition
    final slideTween = Tween<Offset>(
      begin: const Offset(0.0, 0.02),
      end: Offset.zero,
    );
    final fadeTween = Tween<double>(begin: 0.0, end: 1.0);

    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
    );

    return FadeTransition(
      opacity: fadeTween.animate(curvedAnimation),
      child: SlideTransition(
        position: slideTween.animate(curvedAnimation),
        child: child,
      ),
    );
  }

  @override
  Duration get transitionDuration => const Duration(milliseconds: 250);
}

