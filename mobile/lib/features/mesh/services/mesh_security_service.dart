/// Phase 5.3: Mesh Security Service
/// Handles HMAC signatures, AES-GCM encryption, and key management for mesh messages

import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_endpoints.dart';
import '../models/mesh_message.dart';
import 'package:flutter/foundation.dart';

/// Phase 5.3: Mesh Security Service
/// Manages mesh message security: HMAC signing and AES-GCM encryption
class MeshSecurityService {
  final ApiService _apiService;
  static const _secureStorage = FlutterSecureStorage();

  // Versioned cache excludes older entries without server school validation.
  static const String _meshKeyPrefix = 'mesh_key_v3_';
  static const String _meshKeyTimestampPrefix = 'mesh_key_timestamp_v3_';

  static const String _meshKeyExpiryPrefix = 'mesh_key_expiry_v3_';

  // Key expiration: 7 days
  static const Duration keyExpiration = Duration(days: 7);

  MeshSecurityService({
    ApiService? apiService,
  }) : _apiService = apiService ?? ApiService();

  /// Get mesh key for a school (from secure storage or server)
  Future<String> getMeshKey(String schoolId) async {
    if (schoolId.isEmpty) {
      throw ArgumentError.value(schoolId, 'schoolId', 'School is required');
    }
    final cachedKey = await _getCachedKey(schoolId);
    if (cachedKey != null) return cachedKey;

    final key = await _fetchMeshKeyFromServer(schoolId);
    await _cacheKey(schoolId, key.key, key.expiresAt);
    return key.key;
  }

  /// Fetch a key authorized by the server for this school.
  Future<({String key, DateTime expiresAt})> _fetchMeshKeyFromServer(String schoolId) async {
    final response = await _apiService.get(ApiEndpoints.meshKey);
    final body = response.data as Map<String, dynamic>?;
    final data = body?['data'] as Map<String, dynamic>? ?? body;
    final meshKey = data?['meshKey'];
    if (data?['schoolId'] != schoolId ||
        meshKey is! String ||
        !_isValidKey(meshKey)) {
      throw StateError('No valid authorized mesh key for this school');
    }
    final expiresAt = DateTime.tryParse(data?['expiresAt']?.toString() ?? '');
    if (expiresAt == null || !expiresAt.isAfter(DateTime.now())) {
      throw StateError('Mesh key is expired or missing expiry');
    }
    return (key: meshKey, expiresAt: expiresAt);
  }

  bool _isValidKey(String key) {
    try {
      return base64.decode(key).length >= 32;
    } on FormatException {
      return false;
    }
  }

  /// Get cached key if still valid
  Future<String?> _getCachedKey(String schoolId) async {
    try {
      final keyStorageKey = '$_meshKeyPrefix$schoolId';
      final timestampKey = '$_meshKeyTimestampPrefix$schoolId';

      final cachedKey = await _secureStorage.read(key: keyStorageKey);
      final timestampStr = await _secureStorage.read(key: timestampKey);

      if (cachedKey == null || timestampStr == null) {
        return null;
      }

      final expiry = DateTime.tryParse(await _secureStorage.read(key: '$_meshKeyExpiryPrefix$schoolId') ?? '');
      final timestamp = DateTime.parse(timestampStr);
      final age = DateTime.now().difference(timestamp);

      // Check if key is still valid (not expired)
      if (expiry == null || !expiry.isAfter(DateTime.now()) || age.isNegative || age >= keyExpiration || !_isValidKey(cachedKey)) {
        // Key expired, remove it
        await _secureStorage.delete(key: keyStorageKey);
        await _secureStorage.delete(key: timestampKey);
        return null;
      }

      return cachedKey;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error reading cached key');
      }
      return null;
    }
  }

  /// Cache key securely
  Future<void> _cacheKey(String schoolId, String key, DateTime expiresAt) async {
    try {
      final keyStorageKey = '$_meshKeyPrefix$schoolId';
      final timestampKey = '$_meshKeyTimestampPrefix$schoolId';

      await _secureStorage.write(key: keyStorageKey, value: key);
      await _secureStorage.write(key: '$_meshKeyExpiryPrefix$schoolId', value: expiresAt.toIso8601String());
      await _secureStorage.write(
        key: timestampKey,
        value: DateTime.now().toIso8601String(),
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error caching key');
      }
    }
  }

  /// Refresh/rotate mesh key from server
  Future<void> refreshKey(String schoolId) async {
    try {
      // Remove cached key
      final keyStorageKey = '$_meshKeyPrefix$schoolId';
      final timestampKey = '$_meshKeyTimestampPrefix$schoolId';
      await _secureStorage.delete(key: keyStorageKey);
      await _secureStorage.delete(key: timestampKey);

      // Fetch new key
      final newKey = await _fetchMeshKeyFromServer(schoolId);
      await _cacheKey(schoolId, newKey.key, newKey.expiresAt);

      if (kDebugMode) {
        debugPrint('✅ Mesh Security: Key refreshed for school $schoolId');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error refreshing key');
      }
      rethrow;
    }
  }

  /// Sign message with HMAC (async version with key)
  Future<String> signMessageAsync(MeshMessage message) async {
    final meshKey = await getMeshKey(message.schoolId);
    final envelope = message.toJson()..remove('signature');
    final signaturePayload = jsonEncode(_canonicalize(envelope));
    final hmac = Hmac(sha256, base64.decode(meshKey));
    return 'v2:${base64.encode(hmac.convert(utf8.encode(signaturePayload)).bytes)}';
  }

  // Stable field order authenticates the payload and envelope, not just its ID.
  dynamic _canonicalize(dynamic value) {
    if (value is Map) {
      final keys = value.keys.cast<String>().toList()..sort();
      return {for (final key in keys) key: _canonicalize(value[key])};
    }
    if (value is List) return value.map(_canonicalize).toList();
    return value;
  }

  /// Verify message signature
  Future<bool> verifySignature(MeshMessage message, String signature) async {
    try {
      if (signature.isEmpty) {
        return false;
      }

      // Recompute signature
      final expectedSignature = await signMessageAsync(message);

      // Constant-time comparison to prevent timing attacks
      return _constantTimeEquals(signature, expectedSignature);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error verifying signature');
      }
      return false;
    }
  }

  /// Constant-time string comparison (prevents timing attacks)
  bool _constantTimeEquals(String a, String b) {
    if (a.length != b.length) {
      return false;
    }

    int result = 0;
    for (int i = 0; i < a.length; i++) {
      result |= a.codeUnitAt(i) ^ b.codeUnitAt(i);
    }
    return result == 0;
  }

  /// Encrypt payload with AES-GCM
  Future<String> encryptPayload(
      Map<String, dynamic> payload, String schoolId) async {
    try {
      final meshKey = await getMeshKey(schoolId);
      final keyBytes = base64.decode(meshKey);

      // Use first 32 bytes for AES-256 key
      final key = encrypt.Key(
          keyBytes.length >= 32 ? keyBytes.sublist(0, 32) : keyBytes);

      // Generate random IV (12 bytes for GCM)
      final iv = encrypt.IV.fromSecureRandom(12);

      // Create encryptor
      final encrypter =
          encrypt.Encrypter(encrypt.AES(key, mode: encrypt.AESMode.gcm));

      // Encrypt payload JSON
      final payloadJson = jsonEncode(payload);
      final encrypted = encrypter.encrypt(payloadJson, iv: iv);

      // Return: base64(iv + encrypted_data)
      final combined = <int>[...iv.bytes, ...encrypted.bytes];
      return base64.encode(combined);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error encrypting payload');
      }
      rethrow;
    }
  }

  /// Decrypt payload with AES-GCM
  Future<Map<String, dynamic>> decryptPayload(
      String encryptedPayload, String schoolId) async {
    try {
      final meshKey = await getMeshKey(schoolId);
      final keyBytes = base64.decode(meshKey);

      // Use first 32 bytes for AES-256 key
      final key = encrypt.Key(
          keyBytes.length >= 32 ? keyBytes.sublist(0, 32) : keyBytes);

      // Decode combined IV + encrypted data
      final combined = base64.decode(encryptedPayload);

      // Extract IV (first 12 bytes) and encrypted data
      final iv = encrypt.IV(combined.sublist(0, 12));
      final encryptedBytes = combined.sublist(12);
      final encrypted = encrypt.Encrypted(encryptedBytes);

      // Create decryptor
      final encrypter =
          encrypt.Encrypter(encrypt.AES(key, mode: encrypt.AESMode.gcm));

      // Decrypt
      final decrypted = encrypter.decrypt(encrypted, iv: iv);

      // Parse JSON
      final payload = jsonDecode(decrypted) as Map<String, dynamic>;
      return payload;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error decrypting payload');
      }
      rethrow;
    }
  }

  /// Create signed and optionally encrypted mesh message
  Future<MeshMessage> createSecureMessage({
    required String msgId,
    required String type,
    required String schoolId,
    required String source,
    required Map<String, dynamic> payload,
    bool encryptPayload = false,
  }) async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;

    // Create base message
    var message = MeshMessage(
      msgId: msgId,
      type: type,
      schoolId: schoolId,
      source: source,
      payload: payload,
      timestamp: timestamp,
      ttl: 3,
      hops: 0,
      encrypted: encryptPayload,
    );

    // Encrypt payload if requested
    Map<String, dynamic> finalPayload = payload;
    if (encryptPayload) {
      final encryptedPayloadStr = await this.encryptPayload(payload, schoolId);
      finalPayload = {'encrypted': encryptedPayloadStr};
    }

    // Create message with encrypted payload
    message =
        message.copyWith(payload: finalPayload, encrypted: encryptPayload);

    // Sign message
    final signature = await signMessageAsync(message);
    message = message.copyWith(signature: signature);

    return message;
  }

  /// Verify and decrypt received message
  Future<MeshMessage?> verifyAndDecryptMessage(MeshMessage message) async {
    try {
      // Verify signature
      if (message.signature == null || message.signature!.isEmpty) {
        if (kDebugMode) {
          debugPrint('⚠️ Mesh Security: Message missing signature');
        }
        return null;
      }

      final isValid = await verifySignature(message, message.signature!);
      if (!isValid) {
        if (kDebugMode) {
          debugPrint(
              '⚠️ Mesh Security: Invalid signature for message ${message.msgId}');
        }
        return null;
      }

      // Decrypt payload if encrypted
      Map<String, dynamic> decryptedPayload = message.payload;
      if (message.encrypted) {
        final encryptedStr = message.payload['encrypted'] as String?;
        if (encryptedStr == null) {
          if (kDebugMode) {
            debugPrint(
                '⚠️ Mesh Security: Encrypted flag set but no encrypted data');
          }
          return null;
        }

        decryptedPayload = await decryptPayload(encryptedStr, message.schoolId);
      }

      // Return message with decrypted payload
      return message.copyWith(
        payload: decryptedPayload,
        encrypted: false, // Mark as decrypted
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('⚠️ Mesh Security: Error verifying/decrypting message');
      }
      return null;
    }
  }
}
