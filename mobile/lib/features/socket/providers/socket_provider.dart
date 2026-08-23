import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/services/connectivity_service.dart';
import '../../../core/services/storage_service.dart';

/// Socket state
class SocketState {
  final bool isConnected;
  final bool isConnecting;
  final String? error;
  final bool isOffline;
  final String? currentSchoolId;

  SocketState({
    this.isConnected = false,
    this.isConnecting = false,
    this.error,
    this.isOffline = false,
    this.currentSchoolId,
  });

  SocketState copyWith({
    bool? isConnected,
    bool? isConnecting,
    String? error,
    bool? isOffline,
    String? currentSchoolId,
  }) {
    return SocketState(
      isConnected: isConnected ?? this.isConnected,
      isConnecting: isConnecting ?? this.isConnecting,
      error: error,
      isOffline: isOffline ?? this.isOffline,
      currentSchoolId: currentSchoolId ?? this.currentSchoolId,
    );
  }
}

/// Socket notifier
class SocketNotifier extends StateNotifier<SocketState> {
  final SocketService _socketService;
  final ConnectivityService _connectivityService;

  SocketNotifier(this._socketService, this._connectivityService)
      : super(SocketState()) {
    _setupCallbacks();
    _setupConnectivityListener();
  }

  void _setupCallbacks() {
    _socketService.onConnectCallback = (message) {
      state = state.copyWith(
        isConnected: true,
        isConnecting: false,
        error: null,
      );
    };

    _socketService.onDisconnectCallback = (reason) {
      state = state.copyWith(
        isConnected: false,
        isConnecting: false,
      );
    };

    _socketService.onErrorCallback = (error) {
      state = state.copyWith(error: error);
    };
  }

  void _setupConnectivityListener() {
    _connectivityService.onOnline = (isOnline) {
      if (isOnline && !state.isConnected) {
        // Reconnect socket when online
        connect();
      }
      state = state.copyWith(isOffline: !isOnline);
    };

    _connectivityService.onOffline = (isOffline) {
      if (isOffline) {
        // Disconnect socket when offline
        _socketService.disconnect();
        state = state.copyWith(
          isConnected: false,
          isOffline: true,
        );
      }
    };
  }

  /// Connect to socket
  Future<void> connect() async {
    final storageService = StorageService();
    final token = await storageService.getAccessToken();
    
    if (token == null) {
      state = state.copyWith(error: 'No authentication token');
      return;
    }

    state = state.copyWith(isConnecting: true, error: null, isOffline: false);
    _socketService.connect(token);
  }

  /// Join school room
  void joinRoom(String schoolId) {
    _socketService.joinRoom(schoolId);
    state = state.copyWith(currentSchoolId: schoolId);
  }

  /// Disconnect
  void disconnect() {
    _socketService.disconnect();
    state = SocketState();
  }

  /// Listen to socket event
  void on(String event, void Function(dynamic) handler) {
    _socketService.on(event, handler);
  }

  /// Emit socket event
  void emit(String event, Map<String, dynamic> data) {
    _socketService.emit(event, data);
  }

  /// Acknowledge drill
  void acknowledgeDrill(String drillId, String userId) {
    emit('DRILL_ACK', {
      'drillId': drillId,
      'userId': userId,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }
}

/// Socket service provider
final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

/// Connectivity service provider
final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  service.initialize();
  return service;
});

/// Socket state provider
final socketProvider = StateNotifierProvider<SocketNotifier, SocketState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  final connectivityService = ref.watch(connectivityServiceProvider);
  return SocketNotifier(socketService, connectivityService);
});

