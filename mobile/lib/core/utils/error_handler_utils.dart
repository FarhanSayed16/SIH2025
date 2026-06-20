/// Phase 101.9.4: Error Handling Utilities
/// Utilities for user-friendly error handling and messaging

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// Error handler utilities
class ErrorHandlerUtils {
  /// Get user-friendly error message
  static String getUserFriendlyMessage(dynamic error) {
    if (error is String) {
      return error;
    }

    final errorString = error.toString().toLowerCase();

    // Network errors
    if (errorString.contains('network') || errorString.contains('connection')) {
      return 'Network connection failed. Please check your internet connection.';
    }

    if (errorString.contains('timeout') || errorString.contains('timed out')) {
      return 'Request timed out. Please try again.';
    }

    if (errorString.contains('socket') || errorString.contains('failed host lookup')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    // HTTP errors
    if (error is http.Response) {
      switch (error.statusCode) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication failed. Please login again.';
        case 403:
          return 'Access denied. You don\'t have permission for this action.';
        case 404:
          return 'Resource not found.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return 'An error occurred. Please try again.';
      }
    }

    // Generic errors
    if (errorString.contains('exception')) {
      return errorString.replaceFirst('exception:', '').trim();
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /// Check if error is network-related
  static bool isNetworkError(dynamic error) {
    final errorString = error.toString().toLowerCase();
    return errorString.contains('network') ||
        errorString.contains('connection') ||
        errorString.contains('timeout') ||
        errorString.contains('socket') ||
        errorString.contains('failed host lookup');
  }

  /// Check if error is authentication-related
  static bool isAuthError(dynamic error) {
    if (error is http.Response) {
      return error.statusCode == 401 || error.statusCode == 403;
    }
    final errorString = error.toString().toLowerCase();
    return errorString.contains('unauthorized') ||
        errorString.contains('authentication') ||
        errorString.contains('token');
  }

  /// Get error icon based on error type
  static IconData getErrorIcon(dynamic error) {
    if (isNetworkError(error)) {
      return Icons.wifi_off;
    }
    if (isAuthError(error)) {
      return Icons.lock_outline;
    }
    return Icons.error_outline;
  }

  /// Get error color based on error type
  static Color getErrorColor(dynamic error) {
    if (isNetworkError(error)) {
      return Colors.orange;
    }
    if (isAuthError(error)) {
      return Colors.red;
    }
    return Colors.red;
  }
}

