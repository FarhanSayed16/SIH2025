/// Phase 3.4.0: Sync Queue Models
/// Models for sync queue items and conflict resolution

class SyncQueueItem {
  final String id;
  final String dataType; // 'quiz', 'drill', 'game', 'module'
  final int priority; // 1 = highest, 10 = lowest
  final String status; // 'pending', 'processing', 'synced', 'failed', 'conflict'
  final Map<String, dynamic> payload;
  final int retryCount;
  final int maxRetries;
  final DateTime? lastAttemptAt;
  final DateTime? syncedAt;
  final String? error;
  final ConflictData? conflictData;
  final SyncMetadata? metadata;
  final DateTime createdAt;
  final DateTime updatedAt;

  SyncQueueItem({
    required this.id,
    required this.dataType,
    this.priority = 5,
    this.status = 'pending',
    required this.payload,
    this.retryCount = 0,
    this.maxRetries = 3,
    this.lastAttemptAt,
    this.syncedAt,
    this.error,
    this.conflictData,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    final payloadData = json['payload'];
    final conflictDataJson = json['conflictData'];
    final metadataJson = json['metadata'];
    
    return SyncQueueItem(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      dataType: (json['dataType'] ?? '').toString(),
      priority: json['priority'] is int 
          ? json['priority'] as int
          : (json['priority'] != null ? int.tryParse(json['priority'].toString()) ?? 5 : 5),
      status: (json['status'] ?? 'pending').toString(),
      payload: payloadData is Map 
          ? Map<String, dynamic>.from(payloadData) 
          : <String, dynamic>{},
      retryCount: json['retryCount'] is int 
          ? json['retryCount'] as int
          : (json['retryCount'] != null ? int.tryParse(json['retryCount'].toString()) ?? 0 : 0),
      maxRetries: json['maxRetries'] is int 
          ? json['maxRetries'] as int
          : (json['maxRetries'] != null ? int.tryParse(json['maxRetries'].toString()) ?? 3 : 3),
      lastAttemptAt: json['lastAttemptAt'] != null 
          ? DateTime.parse(json['lastAttemptAt'].toString()) 
          : null,
      syncedAt: json['syncedAt'] != null 
          ? DateTime.parse(json['syncedAt'].toString()) 
          : null,
      error: json['error']?.toString(),
      conflictData: conflictDataJson != null && conflictDataJson is Map
          ? ConflictData.fromJson(Map<String, dynamic>.from(conflictDataJson))
          : null,
      metadata: metadataJson != null && metadataJson is Map
          ? SyncMetadata.fromJson(Map<String, dynamic>.from(metadataJson))
          : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'].toString()) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'].toString()) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dataType': dataType,
      'priority': priority,
      'status': status,
      'payload': payload,
      'retryCount': retryCount,
      'maxRetries': maxRetries,
      'lastAttemptAt': lastAttemptAt?.toIso8601String(),
      'syncedAt': syncedAt?.toIso8601String(),
      'error': error,
      'conflictData': conflictData?.toJson(),
      'metadata': metadata?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  SyncQueueItem copyWith({
    String? id,
    String? dataType,
    int? priority,
    String? status,
    Map<String, dynamic>? payload,
    int? retryCount,
    int? maxRetries,
    DateTime? lastAttemptAt,
    DateTime? syncedAt,
    String? error,
    ConflictData? conflictData,
    SyncMetadata? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SyncQueueItem(
      id: id ?? this.id,
      dataType: dataType ?? this.dataType,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      payload: payload ?? this.payload,
      retryCount: retryCount ?? this.retryCount,
      maxRetries: maxRetries ?? this.maxRetries,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      syncedAt: syncedAt ?? this.syncedAt,
      error: error ?? this.error,
      conflictData: conflictData ?? this.conflictData,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class ConflictData {
  final Map<String, dynamic>? serverData;
  final Map<String, dynamic>? localData;
  final String? resolution; // 'server-wins', 'client-wins', 'merge', 'manual'

  ConflictData({
    this.serverData,
    this.localData,
    this.resolution,
  });

  factory ConflictData.fromJson(Map<String, dynamic> json) {
    final serverDataJson = json['serverData'];
    final localDataJson = json['localData'];
    
    return ConflictData(
      serverData: serverDataJson != null && serverDataJson is Map
          ? Map<String, dynamic>.from(serverDataJson)
          : null,
      localData: localDataJson != null && localDataJson is Map
          ? Map<String, dynamic>.from(localDataJson)
          : null,
      resolution: json['resolution']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (serverData != null) 'serverData': serverData,
      if (localData != null) 'localData': localData,
      if (resolution != null) 'resolution': resolution,
    };
  }
}

class SyncMetadata {
  final String? deviceId;
  final String? appVersion;
  final String? syncVersion;
  final DateTime? createdAt;

  SyncMetadata({
    this.deviceId,
    this.appVersion,
    this.syncVersion,
    this.createdAt,
  });

  factory SyncMetadata.fromJson(Map<String, dynamic> json) {
    return SyncMetadata(
      deviceId: json['deviceId']?.toString(),
      appVersion: json['appVersion']?.toString(),
      syncVersion: (json['syncVersion'] ?? '1.0').toString(),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'].toString()) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (deviceId != null) 'deviceId': deviceId,
      if (appVersion != null) 'appVersion': appVersion,
      if (syncVersion != null) 'syncVersion': syncVersion,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
    };
  }

  SyncMetadata copyWith({
    String? deviceId,
    String? appVersion,
    String? syncVersion,
    DateTime? createdAt,
  }) {
    return SyncMetadata(
      deviceId: deviceId ?? this.deviceId,
      appVersion: appVersion ?? this.appVersion,
      syncVersion: syncVersion ?? this.syncVersion,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class SyncQueueStatus {
  final int pending;
  final int processing;
  final int synced;
  final int failed;
  final int conflict;
  final int total;
  final List<ConflictItem> conflicts;

  SyncQueueStatus({
    this.pending = 0,
    this.processing = 0,
    this.synced = 0,
    this.failed = 0,
    this.conflict = 0,
    this.total = 0,
    this.conflicts = const [],
  });

  factory SyncQueueStatus.fromJson(Map<String, dynamic> json) {
    final queue = json['queue'] ?? json;
    final conflictsList = queue['conflicts'];
    
    int _parseInt(dynamic value) {
      if (value is int) return value;
      if (value != null) return int.tryParse(value.toString()) ?? 0;
      return 0;
    }
    
    return SyncQueueStatus(
      pending: _parseInt(queue['pending']),
      processing: _parseInt(queue['processing']),
      synced: _parseInt(queue['synced']),
      failed: _parseInt(queue['failed']),
      conflict: _parseInt(queue['conflict']),
      total: _parseInt(queue['total']),
      conflicts: conflictsList != null && conflictsList is List
          ? (conflictsList)
              .map((c) => c is Map 
                  ? ConflictItem.fromJson(Map<String, dynamic>.from(c))
                  : ConflictItem(id: '', dataType: ''))
              .toList()
          : [],
    );
  }

  bool get hasPending => pending > 0;
  bool get hasConflicts => conflict > 0;
}

class ConflictItem {
  final String id;
  final String dataType;
  final String? error;
  final DateTime? createdAt;

  ConflictItem({
    required this.id,
    required this.dataType,
    this.error,
    this.createdAt,
  });

  factory ConflictItem.fromJson(Map<String, dynamic> json) {
    return ConflictItem(
      id: (json['id'] ?? '').toString(),
      dataType: (json['dataType'] ?? '').toString(),
      error: json['error']?.toString(),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'].toString()) 
          : null,
    );
  }
}

