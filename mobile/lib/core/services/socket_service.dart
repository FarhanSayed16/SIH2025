import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:async';
import '../config/env.dart';
import '../constants/app_constants.dart';
import '../constants/socket_events.dart'; // Phase 4.0

/// Socket Service - Handles Socket.io connections with reconnection logic
class SocketService {
  IO.Socket? _socket;
  bool _isConnected = false;
  bool _isConnecting = false;
  String? _currentToken;
  String? _currentSchoolId;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;

  // Callbacks
  Function(String)? onConnectCallback;
  Function(String)? onDisconnectCallback;
  Function(String, dynamic)? onEventCallback;
  Function(String)? onErrorCallback;

  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;

  /// Connect to Socket.io server
  void connect(String token) {
    if (_isConnecting || (_isConnected && _currentToken == token)) {
      return;
    }

    _currentToken = token;
    _isConnecting = true;
    _reconnectAttempts = 0;

    try {
      _socket?.disconnect();
      _socket?.dispose();

      _socket = IO.io(
        Env.socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling']) // Add polling as fallback
            .setAuth({
              'token': token
            }) // Use auth instead of extraHeaders for Socket.io v4
            .setTimeout(AppConstants.socketTimeout.inMilliseconds)
            .enableReconnection()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .build(),
      );

      _setupEventListeners();
    } catch (e) {
      _isConnecting = false;
      onErrorCallback?.call('Connection error: $e');
    }
  }

  /// Setup default event listeners
  void _setupDefaultListeners() {
    // Default listeners can be added here if needed
  }

  /// Setup event listeners
  void _setupEventListeners() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _isConnected = true;
      _isConnecting = false;
      _reconnectAttempts = 0;
      onConnectCallback?.call('Connected to server');

      // Explicitly join room after connection
      if (_currentSchoolId != null) {
        print('🔄 Joining room: school:$_currentSchoolId');
        joinRoom(_currentSchoolId!);
      } else {
        print('⚠️ No school ID available to join room');
      }

      // Listen for room join confirmation
      _socket!.on('JOINED_ROOM', (data) {
        print('✅ Joined room: $data');
      });

      // Start heartbeat
      _startHeartbeat();

      // Setup default event listeners
      _setupDefaultListeners();
    });

    _socket!.onDisconnect((reason) {
      _isConnected = false;
      _isConnecting = false;
      _stopHeartbeat();
      onDisconnectCallback?.call((reason as String?) ?? 'Disconnected');

      // Attempt reconnection with exponential backoff
      if (_currentToken != null) {
        _scheduleReconnect();
      }
    });

    _socket!.onError((error) {
      _isConnecting = false;
      onErrorCallback?.call('Socket error: $error');
    });

    _socket!.onConnectError((error) {
      _isConnecting = false;
      onErrorCallback?.call('Connection error: $error');
      _scheduleReconnect();
    });
  }

  /// Schedule reconnection with exponential backoff
  void _scheduleReconnect() {
    _reconnectTimer?.cancel();

    if (_reconnectAttempts >= AppConstants.maxSocketReconnectAttempts) {
      onErrorCallback?.call('Max reconnection attempts reached');
      return;
    }

    final delay = Duration(
      milliseconds: (AppConstants.connectionRetryDelay.inMilliseconds *
              (1 << _reconnectAttempts))
          .clamp(
        1000,
        30000,
      ),
    );

    _reconnectTimer = Timer(delay, () {
      _reconnectAttempts++;
      if (_currentToken != null) {
        connect(_currentToken!);
      }
    });
  }

  /// Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_isConnected) {
        emit(SocketEvents.clientHeartbeat,
            {'timestamp': DateTime.now().toIso8601String()});
      }
    });
  }

  /// Stop heartbeat
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  /// Join a room
  void joinRoom(String schoolId) {
    _currentSchoolId = schoolId;
    if (_socket != null && _isConnected) {
      _socket!.emit(SocketEvents.joinRoom, {'schoolId': schoolId});
    }
  }

  /// Listen to an event
  void on(String event, Function(dynamic) handler) {
    if (_socket != null) {
      _socket!.on(event, (data) {
        handler(data);
        onEventCallback?.call(event, data);
      });
    }
  }

  /// Remove event listener
  void off(String event) {
    _socket?.off(event);
  }

  /// Emit an event
  void emit(String event, Map<String, dynamic> data) {
    if (_socket != null && _isConnected) {
      _socket!.emit(event, data);
    }
  }

  /// Disconnect
  void disconnect() {
    _reconnectTimer?.cancel();
    _stopHeartbeat();
    _currentToken = null;
    _currentSchoolId = null;
    _reconnectAttempts = 0;
    _isConnecting = false;
    _isConnected = false;

    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
  }

  /// Dispose all resources
  void dispose() {
    disconnect();
  }
}
