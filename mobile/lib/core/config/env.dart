import 'package:flutter/foundation.dart' show kReleaseMode;
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment configuration loader
class Env {
  /// Initialize environment variables
  static Future<void> load() async {
    await dotenv.load(fileName: '.env');
  }

  /// Base URL for API (no trailing slash).
  /// Default: http://localhost:3000
  /// Can be changed to port forwarding URL when needed (via .env file)
  static String get baseUrl {
    final url = dotenv.env['BASE_URL'] ?? 'http://localhost:3000';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// Socket.io URL (no trailing slash).
  /// Default: http://localhost:3000
  static String get socketUrl {
    final url = dotenv.env['SOCKET_URL'] ?? dotenv.env['BASE_URL'] ?? 'http://localhost:3000';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  /// API Version
  static String get apiVersion {
    return dotenv.env['API_VERSION'] ?? 'v1';
  }

  /// Environment (development/production)
  static String get environment {
    return dotenv.env['ENVIRONMENT'] ?? 'development';
  }

  /// Check if in development mode
  static bool get isDevelopment => environment == 'development';

  /// Check if in production mode
  static bool get isProduction => environment == 'production';

  /// Full API base URL (backend uses /api, not /api/v1)
  static String get apiBaseUrl => '$baseUrl/api';

  /// Gemini API Key for AI features.
  /// In release/profile builds, only uses GEMINI_API_KEY from .env (no fallback).
  /// In debug builds, falls back to a dev key if .env is not set.
  static String get geminiApiKey {
    final envKey = dotenv.env['GEMINI_API_KEY'];
    if (envKey != null && envKey.isNotEmpty) {
      return envKey;
    }
    // Production: never expose a hardcoded key
    if (kReleaseMode) {
      return '';
    }
    // Debug only: allow dev without .env (set GEMINI_API_KEY in .env for production)
    return 'AIzaSyD-tHB35vQ1gha3pwMIQ8naeTqLAS9mpsE';
  }
}

