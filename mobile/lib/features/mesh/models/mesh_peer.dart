/// Phase 5.1: Mesh Peer Model
/// Represents a peer device in the mesh network

class MeshPeer {
  final String peerId; // Unique identifier for the peer
  final String? name; // Optional display name
  final String? deviceId; // Device identifier
  final DateTime connectedAt;
  final MeshPeerStatus status;
  final int? signalStrength; // RSSI value if available

  MeshPeer({
    required this.peerId,
    this.name,
    this.deviceId,
    DateTime? connectedAt,
    this.status = MeshPeerStatus.connected,
    this.signalStrength,
  }) : connectedAt = connectedAt ?? DateTime.now();

  /// Create from JSON
  factory MeshPeer.fromJson(Map<String, dynamic> json) {
    return MeshPeer(
      peerId: json['peerId'] as String,
      name: json['name'] as String?,
      deviceId: json['deviceId'] as String?,
      connectedAt: json['connectedAt'] != null
          ? DateTime.parse(json['connectedAt'] as String)
          : null,
      status: MeshPeerStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => MeshPeerStatus.connected,
      ),
      signalStrength: json['signalStrength'] as int?,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'peerId': peerId,
      if (name != null) 'name': name,
      if (deviceId != null) 'deviceId': deviceId,
      'connectedAt': connectedAt.toIso8601String(),
      'status': status.name,
      if (signalStrength != null) 'signalStrength': signalStrength,
    };
  }

  /// Create a copy with updated fields
  MeshPeer copyWith({
    String? peerId,
    String? name,
    String? deviceId,
    DateTime? connectedAt,
    MeshPeerStatus? status,
    int? signalStrength,
  }) {
    return MeshPeer(
      peerId: peerId ?? this.peerId,
      name: name ?? this.name,
      deviceId: deviceId ?? this.deviceId,
      connectedAt: connectedAt ?? this.connectedAt,
      status: status ?? this.status,
      signalStrength: signalStrength ?? this.signalStrength,
    );
  }

  /// Connection duration
  Duration get connectionDuration {
    return DateTime.now().difference(connectedAt);
  }

  @override
  String toString() {
    return 'MeshPeer(peerId: $peerId, name: $name, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MeshPeer && other.peerId == peerId;
  }

  @override
  int get hashCode => peerId.hashCode;
}

/// Peer connection status
enum MeshPeerStatus {
  connecting,
  connected,
  disconnecting,
  disconnected,
  error,
}

