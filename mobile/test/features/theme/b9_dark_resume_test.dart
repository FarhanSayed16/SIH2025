import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kavach/core/theme/app_theme.dart';
import 'package:kavach/models/module_models.dart';

/// B9 acceptance slices: dark ≠ crisis; resume heuristics.
void main() {
  test('B9 peace dark theme is dark and distinct from crisis', () {
    final dark = AppTheme.peaceDark;
    final crisis = AppTheme.crisisMode;
    final light = AppTheme.peaceMode;

    expect(dark.brightness, Brightness.dark);
    expect(light.brightness, Brightness.light);
    expect(dark.colorScheme.primary, isNot(equals(crisis.colorScheme.primary)));
    expect(dark.scaffoldBackgroundColor,
        isNot(equals(crisis.scaffoldBackgroundColor)));
  });

  test('B9 VideoLesson resume heuristic', () {
    final notStarted = VideoLesson(title: 'a', url: 'u', size: '1');
    expect(notStarted.hasResumePosition, isFalse);

    final mid = VideoLesson(
      title: 'a',
      url: 'u',
      size: '1',
      lastPosition: 0.4,
    );
    expect(mid.hasResumePosition, isTrue);

    final almostDone = VideoLesson(
      title: 'a',
      url: 'u',
      size: '1',
      lastPosition: 0.96,
    );
    expect(almostDone.hasResumePosition, isFalse);

    final completed = VideoLesson(
      title: 'a',
      url: 'u',
      size: '1',
      isCompleted: true,
      lastPosition: 0.4,
    );
    expect(completed.hasResumePosition, isFalse);
  });
}
