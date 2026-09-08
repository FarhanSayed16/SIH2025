import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kavach/core/services/api_service.dart';
import 'package:kavach/core/services/connectivity_service.dart';
import 'package:kavach/features/mesh/models/mesh_message.dart';
import 'package:kavach/features/mesh/services/mesh_offline_queue.dart';
import 'package:kavach/features/mesh/services/mesh_security_service.dart';
import 'package:kavach/features/mesh/services/mesh_sync_service.dart';

class _Api extends Fake implements ApiService {
  Map<String, dynamic> body = {};
  bool fail = false;
  int requests = 0;

  Response<dynamic> _respond(String path) {
    requests++;
    if (fail) throw StateError('Server unavailable');
    return Response(
      data: body,
      statusCode: 200,
      requestOptions: RequestOptions(path: path),
    );
  }

  @override
  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async => _respond(path);

  @override
  Future<Response<dynamic>> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async => _respond(path);
}

class _Connectivity extends Fake implements ConnectivityService {
  Completer<bool>? pending;
  @override
  Future<bool> checkOnline() async => pending == null ? true : pending!.future;
}

MeshMessage _message(String id) => MeshMessage(
  msgId: id,
  type: 'SOS',
  schoolId: 'school',
  source: 'mesh',
  payload: {'status': 'help'},
  timestamp: 1,
);

class _Queue extends Fake implements MeshOfflineQueue {
  final messages = [
    _message('accepted'),
    _message('duplicate'),
    _message('failed'),
  ];
  final marked = <String>[];
  final removed = <String>[];

  @override
  Future<List<MeshMessage>> getUnsyncedMessages({int? limit}) async =>
      List.of(messages.take(limit ?? messages.length));
  @override
  Future<void> markAsSynced(String msgId) async => marked.add(msgId);
  @override
  Future<void> removeMessage(String msgId) async {
    removed.add(msgId);
    messages.removeWhere((message) => message.msgId == msgId);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Authorized mesh keys', () {
    setUp(() => FlutterSecureStorage.setMockInitialValues({}));

    test(
      'server expiry is preserved and expired cached keys cannot sign offline',
      () async {
        final expiry = DateTime.now().add(const Duration(minutes: 5));
        final key = base64Encode(List<int>.filled(32, 42));
        final api = _Api()
          ..body = {
            'data': {
              'schoolId': 'school',
              'meshKey': key,
              'expiresAt': expiry.toIso8601String(),
            },
          };
        final service = MeshSecurityService(apiService: api);
        expect(await service.getMeshKey('school'), key);
        expect(
          await const FlutterSecureStorage().read(
            key: 'mesh_key_expiry_v3_school',
          ),
          expiry.toIso8601String(),
        );

        await const FlutterSecureStorage().write(
          key: 'mesh_key_expiry_v3_school',
          value: DateTime.now()
              .subtract(const Duration(seconds: 1))
              .toIso8601String(),
        );
        api.fail = true;
        await expectLater(
          service.signMessageAsync(_message('message')),
          throwsStateError,
        );
        expect(api.requests, 2);
        expect(
          await const FlutterSecureStorage().read(key: 'mesh_key_v3_school'),
          isNull,
        );
      },
    );

    test(
      'missing or expired server expiry cannot create a key cache',
      () async {
        final api = _Api();
        final service = MeshSecurityService(apiService: api);
        for (final expiry in [
          null,
          DateTime.now().subtract(const Duration(seconds: 1)).toIso8601String(),
        ]) {
          api.body = {
            'data': {
              'schoolId': 'school',
              'meshKey': base64Encode(List<int>.filled(32, 42)),
              if (expiry != null) 'expiresAt': expiry,
            },
          };
          await expectLater(service.getMeshKey('school'), throwsStateError);
          expect(await const FlutterSecureStorage().readAll(), isEmpty);
        }
      },
    );

    test(
      'signatures authenticate payload values independent of map field order',
      () async {
        final api = _Api()
          ..body = {
            'data': {
              'schoolId': 'school',
              'meshKey': base64Encode(List<int>.filled(32, 42)),
              'expiresAt': DateTime.now()
                  .add(const Duration(hours: 1))
                  .toIso8601String(),
            },
          };
        final service = MeshSecurityService(apiService: api);
        final original = _message('message').copyWith(
          payload: {
            'status': 'help',
            'location': {'floor': 2, 'room': 'A'},
          },
        );
        final signature = await service.signMessageAsync(original);
        expect(signature, startsWith('v2:'));
        expect(
          await service.verifySignature(
            original.copyWith(
              payload: {
                'location': {'room': 'A', 'floor': 2},
                'status': 'help',
              },
            ),
            signature,
          ),
          true,
        );
        expect(
          await service.verifySignature(
            original.copyWith(
              payload: {
                'status': 'safe',
                'location': {'floor': 2, 'room': 'A'},
              },
            ),
            signature,
          ),
          false,
        );
        expect(
          await service.verifySignature(
            original.copyWith(source: 'admin'),
            signature,
          ),
          false,
        );
      },
    );

    test(
      'repeated encryption uses fresh nonces and decrypts the original payload',
      () async {
        final api = _Api()
          ..body = {
            'data': {
              'schoolId': 'school',
              'meshKey': base64Encode(List<int>.filled(32, 42)),
              'expiresAt': DateTime.now()
                  .add(const Duration(hours: 1))
                  .toIso8601String(),
            },
          };
        final service = MeshSecurityService(apiService: api);
        final payload = {'status': 'help', 'room': 'A'};
        final first = await service.encryptPayload(payload, 'school');
        final second = await service.encryptPayload(payload, 'school');
        expect(
          base64Decode(first).take(12).toList(),
          isNot(base64Decode(second).take(12).toList()),
        );
        expect(await service.decryptPayload(first, 'school'), payload);
        expect(await service.decryptPayload(second, 'school'), payload);
      },
    );

    test('missing server key never produces a local signature', () async {
      final api = _Api()
        ..body = {
          'data': {'schoolId': 'school'},
        };
      final service = MeshSecurityService(apiService: api);
      await expectLater(
        service.signMessageAsync(_message('message')),
        throwsStateError,
      );
      expect(
        await service.verifySignature(_message('message'), 'untrusted'),
        false,
      );
      expect(await const FlutterSecureStorage().readAll(), isEmpty);
    });

    test(
      'invalid cached keys are removed and cannot permit offline signing',
      () async {
        FlutterSecureStorage.setMockInitialValues({
          'mesh_key_v3_school': 'invalid-base64!',
          'mesh_key_timestamp_v3_school': DateTime.now().toIso8601String(),
          'mesh_key_expiry_v3_school': DateTime.now()
              .add(const Duration(hours: 1)).toIso8601String(),
        });
        final api = _Api()..fail = true;
        await expectLater(
          MeshSecurityService(
            apiService: api,
          ).signMessageAsync(_message('message')),
          throwsStateError,
        );
        expect(api.requests, 1);
        expect(await const FlutterSecureStorage().read(key: 'mesh_key_v3_school'), isNull);
        expect(await const FlutterSecureStorage().read(key: 'mesh_key_timestamp_v3_school'), isNull);
      },
    );

    test(
      'keys for another school are rejected; authorized keys can be cached',
      () async {
        final key = base64Encode(List<int>.filled(32, 42));
        final api = _Api()
          ..body = {
            'data': {
              'schoolId': 'other-school',
              'meshKey': key,
              'expiresAt': DateTime.now()
                  .add(const Duration(hours: 1))
                  .toIso8601String(),
            },
          };
        final service = MeshSecurityService(apiService: api);
        await expectLater(service.getMeshKey('school'), throwsStateError);
        expect(await const FlutterSecureStorage().readAll(), isEmpty);
        api.body = {
          'data': {
            'schoolId': 'school',
            'meshKey': key,
            'expiresAt': DateTime.now()
                .add(const Duration(hours: 1))
                .toIso8601String(),
          },
        };
        final signature = await service.signMessageAsync(_message('message'));
        api.fail = true;
        expect(
          await service.verifySignature(_message('message'), signature),
          true,
        );
        expect(api.requests, 2);
      },
    );
  });

  group('Mesh delivery acknowledgments', () {
    test('mixed acknowledgments remove only explicitly accepted IDs', () async {
      final api = _Api()
        ..body = {
          'data': {
            'syncResults': {
              'synced': 1,
              'duplicates': 1,
              'failed': 1,
              'acknowledgedIds': ['accepted', 'duplicate', 'unrelated'],
            },
          },
        };
      final queue = _Queue();
      final result = await MeshSyncService(
        apiService: api,
        connectivityService: _Connectivity(),
        offlineQueue: queue,
      ).syncOfflineMessages();
      expect(result['success'], false);
      expect(queue.marked, ['accepted', 'duplicate']);
      expect(queue.removed, ['accepted', 'duplicate']);
      expect(queue.messages.map((message) => message.msgId), ['failed']);
    });

    for (final failRequest in [false, true]) {
      test(
        failRequest
            ? 'request failure retains every queued message'
            : 'aggregate success without IDs retains every queued message',
        () async {
          final api = _Api()
            ..fail = failRequest
            ..body = {
              'data': {
                'syncResults': {'synced': 3, 'failed': 0},
              },
            };
          final queue = _Queue();
          final service = MeshSyncService(
            apiService: api,
            connectivityService: _Connectivity(),
            offlineQueue: queue,
          );
          expect((await service.syncOfflineMessages())['success'], false);
          expect(queue.removed, isEmpty);
          expect(queue.marked, isEmpty);
          expect(queue.messages, hasLength(3));
        },
      );
    }

    test(
      'concurrent sync is blocked while connectivity is still pending',
      () async {
        final connection = _Connectivity()..pending = Completer<bool>();
        final api = _Api()
          ..body = {
            'data': {
              'syncResults': {
                'acknowledgedIds': ['accepted', 'duplicate', 'failed'],
              },
            },
          };
        final queue = _Queue();
        final service = MeshSyncService(
          apiService: api,
          connectivityService: connection,
          offlineQueue: queue,
        );
        final first = service.syncOfflineMessages();
        expect(
          (await service.syncOfflineMessages())['message'],
          'Sync already in progress',
        );
        expect(api.requests, 0);
        connection.pending!.complete(true);
        expect((await first)['success'], true);
        expect(api.requests, 1);
        expect(queue.messages, isEmpty);
        expect((await service.syncOfflineMessages())['success'], true);
      },
    );
  });
}
