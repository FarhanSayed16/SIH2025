/// Phase 5.1: Mesh Networking Test Screen
/// Test P2P connections and message transmission

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/mesh_service.dart';
import '../models/mesh_message.dart';
import '../models/mesh_peer.dart';
import '../../../core/services/connectivity_service.dart';
import '../../auth/providers/auth_provider.dart';

/// Mesh test screen state provider
final meshTestProvider = StateNotifierProvider<MeshTestNotifier, MeshTestState>((ref) {
  return MeshTestNotifier(MeshService(), ref);
});

class MeshTestState {
  final bool isAdvertising;
  final bool isDiscovering;
  final List<MeshPeer> connectedPeers;
  final List<MeshPeer> discoveredPeers;
  final List<MeshMessage> receivedMessages;
  final String? error;
  final bool isOnline;

  MeshTestState({
    this.isAdvertising = false,
    this.isDiscovering = false,
    this.connectedPeers = const [],
    this.discoveredPeers = const [],
    this.receivedMessages = const [],
    this.error,
    this.isOnline = true,
  });

  MeshTestState copyWith({
    bool? isAdvertising,
    bool? isDiscovering,
    List<MeshPeer>? connectedPeers,
    List<MeshPeer>? discoveredPeers,
    List<MeshMessage>? receivedMessages,
    String? error,
    bool? isOnline,
  }) {
    return MeshTestState(
      isAdvertising: isAdvertising ?? this.isAdvertising,
      isDiscovering: isDiscovering ?? this.isDiscovering,
      connectedPeers: connectedPeers ?? this.connectedPeers,
      discoveredPeers: discoveredPeers ?? this.discoveredPeers,
      receivedMessages: receivedMessages ?? this.receivedMessages,
      error: error,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}

class MeshTestNotifier extends StateNotifier<MeshTestState> {
  final MeshService _meshService;
  final Ref _ref;
  StreamSubscription<MeshMessage>? _messageSubscription;
  StreamSubscription<MeshPeer>? _peerFoundSubscription;
  StreamSubscription<String>? _peerLostSubscription;
  StreamSubscription<String>? _errorSubscription;

  MeshTestNotifier(this._meshService, this._ref) : super(MeshTestState()) {
    _setupListeners();
    _checkConnectivity();
  }

  void _setupListeners() {
    _messageSubscription = _meshService.onMessage.listen((message) {
      state = state.copyWith(
        receivedMessages: [...state.receivedMessages, message],
      );
    });

    _peerFoundSubscription = _meshService.onPeerFound.listen((peer) {
      state = state.copyWith(
        connectedPeers: _meshService.connectedPeers,
        discoveredPeers: _meshService.discoveredPeers,
      );
    });

    _peerLostSubscription = _meshService.onPeerLost.listen((peerId) {
      state = state.copyWith(
        connectedPeers: _meshService.connectedPeers,
        discoveredPeers: _meshService.discoveredPeers,
      );
    });

    _errorSubscription = _meshService.onError.listen((error) {
      state = state.copyWith(error: error);
    });
  }

  Future<void> _checkConnectivity() async {
    final connectivityService = ConnectivityService();
    connectivityService.initialize();
    final isOnline = await connectivityService.checkOnline();
    state = state.copyWith(isOnline: isOnline);
  }

  Future<void> startAdvertising() async {
    final success = await _meshService.startAdvertising();
    state = state.copyWith(
      isAdvertising: success,
      error: success ? null : 'Failed to start advertising',
    );
  }

  Future<void> stopAdvertising() async {
    await _meshService.stopAdvertising();
    state = state.copyWith(isAdvertising: false);
  }

  Future<void> startDiscovery() async {
    final success = await _meshService.startDiscovery();
    state = state.copyWith(
      isDiscovering: success,
      error: success ? null : 'Failed to start discovery',
    );
  }

  Future<void> stopDiscovery() async {
    await _meshService.stopDiscovery();
    state = state.copyWith(isDiscovering: false);
  }

  Future<void> sendTestCrisisAlert() async {
    final authState = _ref.read(authProvider);
    final schoolId = authState.user?.institutionId ?? 'test-school';
    
    final message = MeshMessage(
      msgId: DateTime.now().millisecondsSinceEpoch.toString(),
      type: MeshMessageType.crisisAlert,
      schoolId: schoolId,
      source: MeshMessageSource.device,
      payload: {
        'alertType': 'fire',
        'severity': 'high',
        'location': {
          'lat': 0.0,
          'lng': 0.0,
        },
        'title': 'Test Fire Alert',
        'description': 'This is a test crisis alert sent via mesh network',
      },
      timestamp: DateTime.now().millisecondsSinceEpoch,
      ttl: 3,
    );

    final success = await _meshService.sendMessage(message);
    if (!success) {
      state = state.copyWith(error: 'Failed to send message');
    }
  }

  Future<void> stopAll() async {
    await _meshService.stopAll();
    state = state.copyWith(
      isAdvertising: false,
      isDiscovering: false,
      connectedPeers: [],
      discoveredPeers: [],
    );
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _peerFoundSubscription?.cancel();
    _peerLostSubscription?.cancel();
    _errorSubscription?.cancel();
    super.dispose();
  }
}

/// Mesh Test Screen Widget
class MeshTestScreen extends ConsumerStatefulWidget {
  const MeshTestScreen({super.key});

  @override
  ConsumerState<MeshTestScreen> createState() => _MeshTestScreenState();
}

class _MeshTestScreenState extends ConsumerState<MeshTestScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(meshTestProvider);
    final notifier = ref.read(meshTestProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mesh Networking Test (Phase 5.1)'),
        backgroundColor: Colors.blue.shade900,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Cards
            _buildStatusCard(context, state),
            
            const SizedBox(height: 16),
            
            // Controls
            _buildControlsSection(context, state, notifier),
            
            const SizedBox(height: 16),
            
            // Connected Peers
            _buildPeersSection(context, state),
            
            const SizedBox(height: 16),
            
            // Received Messages
            _buildMessagesSection(context, state),
            
            const SizedBox(height: 16),
            
            // Error Display
            if (state.error != null)
              _buildErrorCard(context, state.error!),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context, MeshTestState state) {
    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mesh Status',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  state.isAdvertising ? Icons.cast : Icons.cast_connected,
                  color: state.isAdvertising ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text('Advertising: ${state.isAdvertising ? "ON" : "OFF"}'),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  state.isDiscovering ? Icons.search : Icons.search_off,
                  color: state.isDiscovering ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text('Discovery: ${state.isDiscovering ? "ON" : "OFF"}'),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  state.isOnline ? Icons.wifi : Icons.wifi_off,
                  color: state.isOnline ? Colors.blue : Colors.red,
                ),
                const SizedBox(width: 8),
                Text('Internet: ${state.isOnline ? "ONLINE" : "OFFLINE"}'),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Connected Peers: ${state.connectedPeers.length}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlsSection(
    BuildContext context,
    MeshTestState state,
    MeshTestNotifier notifier,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Controls',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            
            // Advertising controls
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: state.isAdvertising
                        ? null
                        : () => notifier.startAdvertising(),
                    icon: const Icon(Icons.cast),
                    label: const Text('Start Advertising'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: state.isAdvertising
                        ? () => notifier.stopAdvertising()
                        : null,
                    icon: const Icon(Icons.stop),
                    label: const Text('Stop Advertising'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Discovery controls
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: state.isDiscovering
                        ? null
                        : () => notifier.startDiscovery(),
                    icon: const Icon(Icons.search),
                    label: const Text('Start Discovery'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: state.isDiscovering
                        ? () => notifier.stopDiscovery()
                        : null,
                    icon: const Icon(Icons.stop),
                    label: const Text('Stop Discovery'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Send test alert
            ElevatedButton.icon(
              onPressed: state.connectedPeers.isEmpty
                  ? null
                  : () => notifier.sendTestCrisisAlert(),
              icon: const Icon(Icons.warning),
              label: const Text('Send Test CRISIS_ALERT'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Stop all
            OutlinedButton.icon(
              onPressed: () => notifier.stopAll(),
              icon: const Icon(Icons.stop_circle),
              label: const Text('Stop All'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPeersSection(BuildContext context, MeshTestState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Connected Peers (${state.connectedPeers.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            if (state.connectedPeers.isEmpty)
              const Text('No peers connected')
            else
              ...state.connectedPeers.map((peer) => ListTile(
                    leading: const Icon(Icons.devices),
                    title: Text(peer.name ?? peer.peerId),
                    subtitle: Text(
                      'ID: ${peer.peerId.substring(0, 8)}...\n'
                      'Connected: ${peer.connectionDuration.inSeconds}s',
                    ),
                    trailing: Icon(
                      Icons.check_circle,
                      color: Colors.green,
                    ),
                  )),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesSection(BuildContext context, MeshTestState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Received Messages (${state.receivedMessages.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            if (state.receivedMessages.isEmpty)
              const Text('No messages received yet')
            else
              SizedBox(
                height: 200,
                child: ListView.builder(
                  itemCount: state.receivedMessages.length,
                  itemBuilder: (context, index) {
                    final message = state.receivedMessages[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: Colors.green.shade50,
                      child: ListTile(
                        leading: const Icon(Icons.message, color: Colors.green),
                        title: Text(
                          message.type,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Text(
                          'TTL: ${message.ttl}, Hops: ${message.hops}\n'
                          'Source: ${message.source}',
                        ),
                        isThreeLine: true,
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, String error) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            const Icon(Icons.error, color: Colors.red),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                error,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

