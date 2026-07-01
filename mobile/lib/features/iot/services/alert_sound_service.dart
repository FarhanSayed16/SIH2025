/**
 * Phase 201: IoT Alert Sound Service
 * Plays sound alerts for IoT device disasters
 */

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'dart:async';

class AlertSoundService {
  static final AlertSoundService _instance = AlertSoundService._internal();
  factory AlertSoundService() => _instance;
  AlertSoundService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isEnabled = true;
  bool _isPlaying = false;

  /// Enable/disable sound alerts
  void setEnabled(bool enabled) {
    _isEnabled = enabled;
  }

  bool get isEnabled => _isEnabled;

  /// Play sound for alert type
  Future<void> playAlertSound(String alertType) async {
    if (!_isEnabled || _isPlaying) return;

    try {
      _isPlaying = true;

      switch (alertType.toUpperCase()) {
        case 'FIRE':
          await _playFireSound();
          break;
        case 'FLOOD':
          await _playFloodSound();
          break;
        case 'EARTHQUAKE':
          await _playEarthquakeSound();
          break;
        default:
          await _playGenericAlertSound();
      }
    } catch (e) {
      print('Error playing alert sound: $e');
    } finally {
      _isPlaying = false;
    }
  }

  /// Play fire alarm sound (siren pattern)
  Future<void> _playFireSound() async {
    // Use system sound for fire alarm
    // Pattern: High-low siren
    for (int i = 0; i < 3; i++) {
      await SystemSound.play(SystemSoundType.alert);
      await Future.delayed(const Duration(milliseconds: 200));
      await SystemSound.play(SystemSoundType.alert);
      await Future.delayed(const Duration(milliseconds: 300));
    }
  }

  /// Play flood alert sound (beep pattern)
  Future<void> _playFloodSound() async {
    // Use system sound for flood
    for (int i = 0; i < 2; i++) {
      await SystemSound.play(SystemSoundType.alert);
      await Future.delayed(const Duration(milliseconds: 500));
    }
  }

  /// Play earthquake alert sound (vibration pattern)
  Future<void> _playEarthquakeSound() async {
    // Use system sound for earthquake
    await SystemSound.play(SystemSoundType.alert);
    await Future.delayed(const Duration(milliseconds: 300));
    await SystemSound.play(SystemSoundType.alert);
  }

  /// Play generic alert sound
  Future<void> _playGenericAlertSound() async {
    await SystemSound.play(SystemSoundType.alert);
  }

  /// Stop any playing sound
  Future<void> stop() async {
    try {
      await _audioPlayer.stop();
      _isPlaying = false;
    } catch (e) {
      print('Error stopping sound: $e');
    }
  }

  /// Dispose resources
  void dispose() {
    _audioPlayer.dispose();
  }
}

