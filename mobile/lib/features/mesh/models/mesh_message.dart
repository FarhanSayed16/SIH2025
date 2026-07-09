/// Phase 5.1: Mesh Message Model
/// Represents a message sent through the mesh network

import 'dart:convert';

class MeshMessage {
  final String msgId;
  final String type;
  final String schoolId;
  final String source; // device|admin|ndma|mesh|teacher|iot|ai
  final Map<String, dynamic> payload;
  final int timestamp;
  final int ttl; // Time To Live - number of hops remaining
  final int hops; // Number of hops this message has traveled
  final String? signature; // HMAC signature for verification
  final bool encrypted;

  MeshMessage({
    required this.msgId,
    required this.type,
    required this.schoolId,
    required this.source,
    required this.payload,
    required this.timestamp,
    this.ttl = 3, // Default 3 hops
    this.hops = 0,
    this.signature,
    this.encrypted = false,
  });

  /// Create from JSON
  factory MeshMessage.fromJson(Map<String, dynamic> json) {
    return MeshMessage(
      msgId: json['msgId'] as String,
      type: json['type'] as String,
      schoolId: json['schoolId'] as String,
      source: json['source'] as String,
      payload: json['payload'] is Map
          ? Map<String, dynamic>.from(json['payload'] as Map)
          : json['payload'] as Map<String, dynamic>,
      timestamp: json['timestamp'] as int,
      ttl: json['ttl'] as int? ?? 3,
      hops: json['hops'] as int? ?? 0,
      signature: json['signature'] as String?,
      encrypted: json['encrypted'] as bool? ?? false,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'msgId': msgId,
      'type': type,
      'schoolId': schoolId,
      'source': source,
      'payload': payload,
      'timestamp': timestamp,
      'ttl': ttl,
      'hops': hops,
      if (signature != null) 'signature': signature,
      'encrypted': encrypted,
    };
  }

  /// Encode to JSON string for transmission
  String encode() {
    return jsonEncode(toJson());
  }

  /// Decode from JSON string
  factory MeshMessage.decode(String jsonString) {
    final decoded = jsonDecode(jsonString);
    return MeshMessage.fromJson(decoded as Map<String, dynamic>);
  }

  /// Create a copy with updated fields
  MeshMessage copyWith({
    String? msgId,
    String? type,
    String? schoolId,
    String? source,
    Map<String, dynamic>? payload,
    int? timestamp,
    int? ttl,
    int? hops,
    String? signature,
    bool? encrypted,
  }) {
    return MeshMessage(
      msgId: msgId ?? this.msgId,
      type: type ?? this.type,
      schoolId: schoolId ?? this.schoolId,
      source: source ?? this.source,
      payload: payload ?? this.payload,
      timestamp: timestamp ?? this.timestamp,
      ttl: ttl ?? this.ttl,
      hops: hops ?? this.hops,
      signature: signature ?? this.signature,
      encrypted: encrypted ?? this.encrypted,
    );
  }

  /// Decrement TTL (for relay)
  MeshMessage decrementTTL() {
    return copyWith(
      ttl: ttl > 0 ? ttl - 1 : 0,
      hops: hops + 1,
    );
  }

  /// Check if message should be relayed
  bool shouldRelay() {
    return ttl > 0;
  }

  /// Message size in bytes (approximate)
  int get sizeInBytes {
    return encode().length;
  }

  @override
  String toString() {
    return 'MeshMessage(msgId: $msgId, type: $type, ttl: $ttl, hops: $hops)';
  }
}

/// Supported mesh message types
class MeshMessageType {
  static const String crisisAlert = 'CRISIS_ALERT';
  static const String drillScheduled = 'DRILL_SCHEDULED';
  static const String drillStart = 'DRILL_START';
  static const String drillEnd = 'DRILL_END';
  static const String drillAck = 'DRILL_ACK';
  static const String userStatusUpdate = 'USER_STATUS_UPDATE';
  static const String alertCancel = 'ALERT_CANCEL';
  
  static const List<String> all = [
    crisisAlert,
    drillScheduled,
    drillStart,
    drillEnd,
    drillAck,
    userStatusUpdate,
    alertCancel,
  ];
}

/// Message source types
class MeshMessageSource {
  static const String device = 'device';
  static const String admin = 'admin';
  static const String ndma = 'ndma';
  static const String mesh = 'mesh'; // Relayed through mesh
  static const String teacher = 'teacher';
  static const String iot = 'iot';
  static const String ai = 'ai';
}

