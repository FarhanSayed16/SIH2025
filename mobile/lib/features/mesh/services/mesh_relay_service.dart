/// Phase 5.4: Mesh Relay Service
/// Handles automatic message relay with TTL, jitter, and message type handling

import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/mesh_message.dart';
// Removed mesh_service.dart import to break circular dependency
// MeshRelayService uses callback function instead
import 'message_deduplicator.dart';
import 'mesh_security_service.dart';
import '../../emergency/services/crisis_alert_service.dart';
import 'dart:async';

/// Phase 5.4: Mesh Relay Service
/// Manages automatic message relay with TTL decrementing and jitter
class MeshRelayService {
  // Use callback function instead of direct MeshService dependency to break circular dependency
  Future<bool> Function(MeshMessage)? _sendMessageCallback;
  final MessageDeduplicator _deduplicator;
  final MeshSecurityService? _securityService;
  
  // Message type handlers (optional - can be null if not available)
  final CrisisAlertService? _crisisAlertService;

  MeshRelayService({
    Future<bool> Function(MeshMessage)? sendMessageCallback,
    required MessageDeduplicator deduplicator,
    MeshSecurityService? securityService,
    CrisisAlertService? crisisAlertService,
  })  : _sendMessageCallback = sendMessageCallback,
        _deduplicator = deduplicator,
        _securityService = securityService,
        _crisisAlertService = crisisAlertService;
  
  /// Set send message callback (used to break circular dependency)
  void setSendMessageCallback(Future<bool> Function(MeshMessage) callback) {
    _sendMessageCallback = callback;
  }

  /// Process incoming message with relay logic
  /// Phase 5.4: Complete relay processing pipeline
  Future<void> processMessage(MeshMessage message, {String? sourceEndpointId}) async {
    try {
      // 1. Check if already seen (deduplication)
      if (_deduplicator.hasSeen(message.msgId)) {
        if (kDebugMode) {
          print('⚠️ Mesh Relay: Duplicate message ${message.msgId}, dropping');
        }
        return;
      }

      // 2. Reject messages that cannot be authenticated and decrypted.
      final security = _securityService;
      if (security == null || message.schoolId.isEmpty) return;
      final verifiedMessage = await security.verifyAndDecryptMessage(message);
      if (verifiedMessage == null) return;

      // 3. Mark as seen (before processing to prevent race conditions)
      await _deduplicator.markSeen(message.msgId);

      // 4. Handle message type (show UI, trigger actions)
      await _handleMessageType(verifiedMessage);

      // 5. Relay if TTL > 0
      if (message.shouldRelay()) {
        await _relayMessage(message);
      } else {
        if (kDebugMode) {
          print('ℹ️ Mesh Relay: Message ${message.msgId} TTL expired (${message.ttl}), not relaying');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error processing message ${message.msgId}: $e');
      }
      rethrow;
    }
  }

  /// Handle specific message types
  /// Phase 5.4: Route messages to appropriate handlers
  Future<void> _handleMessageType(MeshMessage message) async {
    try {
      switch (message.type) {
        case MeshMessageType.crisisAlert:
          // Show Red Alert UI immediately
          await _handleCrisisAlert(message);
          break;

        case MeshMessageType.drillScheduled:
          // Handle drill scheduled notification
          await _handleDrillScheduled(message);
          break;

        case MeshMessageType.drillStart:
          // Handle drill start
          await _handleDrillStart(message);
          break;

        case MeshMessageType.drillEnd:
          // Handle drill end
          await _handleDrillEnd(message);
          break;

        case MeshMessageType.userStatusUpdate:
          // Handle user status update
          await _handleUserStatusUpdate(message);
          break;

        case MeshMessageType.alertCancel:
          // Handle alert cancellation
          await _handleAlertCancel(message);
          break;

        case MeshMessageType.drillAck:
          // Handle drill acknowledgment
          if (kDebugMode) {
            print('✅ Mesh Relay: Drill acknowledgment received');
          }
          break;

        default:
          if (kDebugMode) {
            print('⚠️ Mesh Relay: Unknown message type: ${message.type}');
          }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling message type ${message.type}: $e');
      }
      // Continue processing even if handler fails
    }
  }

  /// Handle crisis alert message
  Future<void> _handleCrisisAlert(MeshMessage message) async {
    try {
      final alertData = message.payload;
      final alertType = alertData['alertType'] as String? ?? 'emergency';
      final alertId = alertData['alertId'] as String? ?? message.msgId;
      
      if (kDebugMode) {
        final location = alertData['location'] as String?;
        final severity = alertData['severity'] as String? ?? 'high';
        print('🚨 Mesh Relay: Crisis alert received via mesh - Type: $alertType, ID: $alertId, Location: $location, Severity: $severity');
      }
      
      // Note: UI navigation is handled by MeshMessageHandler (similar to SocketEventHandler)
      // This service focuses on processing and relaying messages
      // The message will be emitted through MeshService.onMessage stream
      // which UI components can listen to
      
      if (_crisisAlertService != null) {
        // Cache the alert for offline scenarios
        try {
          // CrisisAlertService can handle caching
          // Navigation will be handled by mesh message handler
        } catch (e) {
          if (kDebugMode) {
            print('⚠️ Mesh Relay: Error caching crisis alert: $e');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling crisis alert: $e');
      }
    }
  }
  
  /// Handle drill scheduled message
  Future<void> _handleDrillScheduled(MeshMessage message) async {
    try {
      final drillData = message.payload;
      final drillId = drillData['drillId'] as String? ?? drillData['_id'] as String?;
      final drillType = drillData['type'] as String? ?? drillData['drillType'] as String? ?? 'drill';
      
      if (kDebugMode) {
        final scheduledAt = drillData['scheduledAt'] as String?;
        print('📅 Mesh Relay: Drill scheduled via mesh - Type: $drillType, ID: $drillId, Scheduled: $scheduledAt');
      }
      // UI will be handled by mesh message handler listening to onMessage stream
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling drill scheduled: $e');
      }
    }
  }
  
  /// Handle drill start message
  Future<void> _handleDrillStart(MeshMessage message) async {
    try {
      final drillData = message.payload;
      final drillId = drillData['drillId'] as String?;
      
      if (kDebugMode) {
        print('🚨 Mesh Relay: Drill started via mesh - ID: $drillId');
      }
      // UI will be handled by mesh message handler
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling drill start: $e');
      }
    }
  }
  
  /// Handle drill end message
  Future<void> _handleDrillEnd(MeshMessage message) async {
    try {
      final drillData = message.payload;
      final drillId = drillData['drillId'] as String?;
      
      if (kDebugMode) {
        print('✅ Mesh Relay: Drill ended via mesh - ID: $drillId');
      }
      // UI will be handled by mesh message handler
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling drill end: $e');
      }
    }
  }
  
  /// Handle user status update message
  Future<void> _handleUserStatusUpdate(MeshMessage message) async {
    try {
      final statusData = message.payload;
      final userId = statusData['userId'] as String?;
      final status = statusData['status'] as String?;
      
      if (kDebugMode) {
        print('👤 Mesh Relay: User status update via mesh - User: $userId, Status: $status');
      }
      // UI will be handled by mesh message handler
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling user status update: $e');
      }
    }
  }
  
  /// Handle alert cancel message
  Future<void> _handleAlertCancel(MeshMessage message) async {
    try {
      final cancelData = message.payload;
      final alertId = cancelData['alertId'] as String?;
      
      if (kDebugMode) {
        print('❌ Mesh Relay: Alert cancelled via mesh - ID: $alertId');
      }
      // UI will be handled by mesh message handler
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error handling alert cancel: $e');
      }
    }
  }

  /// Relay message to connected peers
  /// Phase 5.4: Decrement TTL, add jitter, and broadcast
  Future<void> _relayMessage(MeshMessage message) async {
    try {
      // Decrement TTL and increment hops
      final relayedMessage = message.decrementTTL();
      
      if (kDebugMode) {
        print('🔄 Mesh Relay: Relaying message ${message.msgId} (TTL: ${relayedMessage.ttl}, Hops: ${relayedMessage.hops})');
      }

      // Add random jitter to avoid collisions (50-200ms)
      final random = Random();
      final jitter = random.nextInt(150) + 50; // 50-200ms
      
      if (kDebugMode) {
        print('⏱️ Mesh Relay: Adding ${jitter}ms jitter before relay');
      }
      
      await Future<void>.delayed(Duration(milliseconds: jitter));

      final security = _securityService;
      if (security == null || relayedMessage.schoolId.isEmpty) return;
      final MeshMessage signedRelayedMessage;
      try {
        final signature = await security.signMessageAsync(relayedMessage);
        if (signature.isEmpty) return;
        signedRelayedMessage = relayedMessage.copyWith(signature: signature);
      } catch (e) {
        if (kDebugMode) {
          debugPrint('Mesh relay rejected: signing failed');
        }
        return;
      }

      // Broadcast via send message callback
      if (_sendMessageCallback != null) {
        final success = await _sendMessageCallback!(signedRelayedMessage);
        
        if (success) {
          if (kDebugMode) {
            print('✅ Mesh Relay: Message ${message.msgId} relayed successfully');
          }
        } else {
          if (kDebugMode) {
            print('⚠️ Mesh Relay: Failed to relay message ${message.msgId} (no peers connected)');
          }
        }
      } else {
        if (kDebugMode) {
          print('⚠️ Mesh Relay: Cannot relay - send message callback not available');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ Mesh Relay: Error relaying message ${message.msgId}: $e');
      }
      rethrow;
    }
  }

  /// Get relay statistics
  Map<String, dynamic> getStatistics() {
    return {
      'deduplicator': _deduplicator.getStatistics(),
      'sendCallbackAvailable': _sendMessageCallback != null,
    };
  }
}

