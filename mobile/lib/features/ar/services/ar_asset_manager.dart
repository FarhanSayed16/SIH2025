/// Phase 5.7: AR Asset Manager
/// Handles loading and caching of AR assets from CDN

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import '../../../core/services/storage_service.dart';

/// AR Asset Manager
/// Loads assets from CDN and caches them locally for offline access
class ARAssetManager {
  final StorageService _storageService;
  static const String _assetsBaseUrl = 'https://assets.kavach.app/ar';
  static const String _cacheBoxName = 'arAssetsCache';
  
  // Cache directory
  Directory? _cacheDir;

  ARAssetManager({StorageService? storageService})
      : _storageService = storageService ?? StorageService();

  /// Initialize asset manager
  Future<void> initialize() async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      _cacheDir = Directory(path.join(appDir.path, 'ar_assets_cache'));
      if (!(await _cacheDir!.exists())) {
        await _cacheDir!.create(recursive: true);
      }
      if (kDebugMode) {
        print('✅ AR Asset Manager: Initialized cache at ${_cacheDir!.path}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error initializing cache: $e');
      }
    }
  }

  /// Get full asset URL
  String getAssetUrl(String assetName) {
    return '$_assetsBaseUrl/$assetName';
  }

  /// Load asset from URL or cache
  /// Returns the asset as bytes
  Future<Uint8List?> loadAsset(String assetUrl) async {
    try {
      // Check local cache first
      final cached = await _getCachedAsset(assetUrl);
      if (cached != null) {
        if (kDebugMode) {
          print('✅ AR Asset Manager: Loaded from cache: $assetUrl');
        }
        return cached;
      }

      // Download from CDN
      if (kDebugMode) {
        print('📥 AR Asset Manager: Downloading from CDN: $assetUrl');
      }
      final response = await http.get(Uri.parse(assetUrl));
      
      if (response.statusCode == 200) {
        final bytes = response.bodyBytes;
        
        // Cache locally
        await _cacheAsset(assetUrl, bytes);
        
        if (kDebugMode) {
          print('✅ AR Asset Manager: Downloaded and cached: $assetUrl');
        }
        return bytes;
      } else {
        if (kDebugMode) {
          print('⚠️ AR Asset Manager: Failed to download asset: ${response.statusCode}');
        }
        return null;
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error loading asset: $e');
      }
      return null;
    }
  }

  /// Load asset by name (uses default base URL)
  Future<Uint8List?> loadAssetByName(String assetName) async {
    return await loadAsset(getAssetUrl(assetName));
  }

  /// Preload multiple assets for offline use
  Future<void> preloadAssets(List<String> assetUrls) async {
    if (kDebugMode) {
      print('📥 AR Asset Manager: Preloading ${assetUrls.length} assets...');
    }
    
    for (final url in assetUrls) {
      try {
        await loadAsset(url);
      } catch (e) {
        if (kDebugMode) {
          print('⚠️ AR Asset Manager: Error preloading $url: $e');
        }
      }
    }
    
    if (kDebugMode) {
      print('✅ AR Asset Manager: Preloading complete');
    }
  }

  /// Get cached asset if available
  Future<Uint8List?> _getCachedAsset(String assetUrl) async {
    if (_cacheDir == null) return null;
    
    try {
      final fileName = _getCacheFileName(assetUrl);
      final file = File(path.join(_cacheDir!.path, fileName));
      
      if (await file.exists()) {
        return await file.readAsBytes();
      }
      return null;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error reading cache: $e');
      }
      return null;
    }
  }

  /// Cache asset locally
  Future<void> _cacheAsset(String assetUrl, Uint8List bytes) async {
    if (_cacheDir == null) return;
    
    try {
      final fileName = _getCacheFileName(assetUrl);
      final file = File(path.join(_cacheDir!.path, fileName));
      
      await file.writeAsBytes(bytes);
      
      if (kDebugMode) {
        print('💾 AR Asset Manager: Cached asset: $fileName');
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error caching asset: $e');
      }
    }
  }

  /// Get cache file name from URL
  String _getCacheFileName(String assetUrl) {
    // Use URL hash as filename to avoid special characters
    final hash = assetUrl.hashCode.toString().replaceAll('-', '');
    final extension = path.extension(assetUrl);
    return 'asset_$hash$extension';
  }

  /// Clear all cached assets
  Future<void> clearCache() async {
    if (_cacheDir == null) return;
    
    try {
      if (await _cacheDir!.exists()) {
        await _cacheDir!.delete(recursive: true);
        await _cacheDir!.create(recursive: true);
        
        if (kDebugMode) {
          print('🗑️ AR Asset Manager: Cache cleared');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error clearing cache: $e');
      }
    }
  }

  /// Get cache size in bytes
  Future<int> getCacheSize() async {
    if (_cacheDir == null || !(await _cacheDir!.exists())) {
      return 0;
    }
    
    try {
      int totalSize = 0;
      await for (final entity in _cacheDir!.list(recursive: true)) {
        if (entity is File) {
          totalSize += await entity.length();
        }
      }
      return totalSize;
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error calculating cache size: $e');
      }
      return 0;
    }
  }

  /// Get list of cached assets
  Future<List<String>> getCachedAssets() async {
    if (_cacheDir == null || !(await _cacheDir!.exists())) {
      return [];
    }
    
    try {
      final files = await _cacheDir!.list().toList();
      return files
          .whereType<File>()
          .map((file) => path.basename(file.path))
          .toList();
    } catch (e) {
      if (kDebugMode) {
        print('⚠️ AR Asset Manager: Error listing cached assets: $e');
      }
      return [];
    }
  }
}

/// Default AR asset URLs
class ARAssets {
  static const String arrow = 'arrow.glb';
  static const String safeZone = 'safe_zone.glb';
  static const String fireParticle = 'fire_particle.glb';
  static const String waypoint = 'waypoint.glb';
  
  /// Get all default asset URLs
  static List<String> get defaultAssets => [
    arrow,
    safeZone,
    fireParticle,
    waypoint,
  ];
}

