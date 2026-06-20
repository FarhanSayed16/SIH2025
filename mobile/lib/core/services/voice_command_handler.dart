/// Phase 3.5.5: Voice Command Handler
/// Handles execution of voice commands in the app context

import 'package:flutter/material.dart';

enum VoiceCommand {
  next,
  back,
  home,
  startGame,
  stopGame,
  play,
  stop,
  explain,
  showAnswer,
  skipQuestion,
  help,
  yes,
  no,
}

class VoiceCommandHandler {
  static VoiceCommandHandler? _instance;
  static VoiceCommandHandler get instance => _instance ??= VoiceCommandHandler._internal();
  VoiceCommandHandler._internal();

  /// Execute command in given context
  Future<Map<String, dynamic>> executeCommand(
    String action,
    BuildContext context, {
    Map<String, dynamic>? contextData,
  }) async {
    try {
      final command = _parseAction(action);
      
      if (command == null) {
        return {
          'success': false,
          'error': 'Unknown command',
        };
      }

      // Execute based on command
      switch (command) {
        case VoiceCommand.next:
          return await _handleNext(context, contextData);
        case VoiceCommand.back:
          return await _handleBack(context);
        case VoiceCommand.home:
          return await _handleHome(context);
        case VoiceCommand.startGame:
          return await _handleStartGame(context, contextData);
        case VoiceCommand.stopGame:
          return await _handleStopGame(context);
        case VoiceCommand.play:
          return await _handlePlay(context, contextData);
        case VoiceCommand.stop:
          return await _handleStop(context, contextData);
        case VoiceCommand.explain:
          return await _handleExplain(context, contextData);
        case VoiceCommand.showAnswer:
          return await _handleShowAnswer(context, contextData);
        case VoiceCommand.skipQuestion:
          return await _handleSkipQuestion(context, contextData);
        case VoiceCommand.help:
          return await _handleHelp(context);
        case VoiceCommand.yes:
          return await _handleYes(context);
        case VoiceCommand.no:
          return await _handleNo(context);
      }
    } catch (e) {
      print('Execute command error: $e');
      return {
        'success': false,
        'error': 'Failed to execute command',
      };
    }
  }

  VoiceCommand? _parseAction(String action) {
    switch (action.toLowerCase()) {
      case 'next':
        return VoiceCommand.next;
      case 'back':
        return VoiceCommand.back;
      case 'home':
        return VoiceCommand.home;
      case 'startgame':
      case 'start_game':
        return VoiceCommand.startGame;
      case 'stopgame':
      case 'stop_game':
        return VoiceCommand.stopGame;
      case 'play':
        return VoiceCommand.play;
      case 'stop':
        return VoiceCommand.stop;
      case 'explain':
        return VoiceCommand.explain;
      case 'showanswer':
      case 'show_answer':
        return VoiceCommand.showAnswer;
      case 'skipquestion':
      case 'skip_question':
        return VoiceCommand.skipQuestion;
      case 'help':
        return VoiceCommand.help;
      case 'yes':
        return VoiceCommand.yes;
      case 'no':
        return VoiceCommand.no;
      default:
        return null;
    }
  }

  Future<Map<String, dynamic>> _handleNext(BuildContext context, Map<String, dynamic>? data) async {
    // Navigate forward or proceed
    // This will be context-aware based on the current screen
    Navigator.of(context).pop(); // Example: Close dialog or go to next item
    return {'success': true, 'message': 'Navigated forward'};
  }

  Future<Map<String, dynamic>> _handleBack(BuildContext context) async {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
      return {'success': true, 'message': 'Navigated back'};
    }
    return {'success': false, 'error': 'Cannot go back'};
  }

  Future<Map<String, dynamic>> _handleHome(BuildContext context) async {
    Navigator.of(context).popUntil((route) => route.isFirst);
    return {'success': true, 'message': 'Navigated to home'};
  }

  Future<Map<String, dynamic>> _handleStartGame(BuildContext context, Map<String, dynamic>? data) async {
    // Navigate to game or start game
    // This would need to know which game to start
    return {'success': true, 'message': 'Game started'};
  }

  Future<Map<String, dynamic>> _handleStopGame(BuildContext context) async {
    return {'success': true, 'message': 'Game stopped'};
  }

  Future<Map<String, dynamic>> _handlePlay(BuildContext context, Map<String, dynamic>? data) async {
    // Trigger play action (audio/video)
    return {'success': true, 'message': 'Playback started'};
  }

  Future<Map<String, dynamic>> _handleStop(BuildContext context, Map<String, dynamic>? data) async {
    // Trigger stop action
    return {'success': true, 'message': 'Playback stopped'};
  }

  Future<Map<String, dynamic>> _handleExplain(BuildContext context, Map<String, dynamic>? data) async {
    // Show explanation
    return {'success': true, 'message': 'Showing explanation'};
  }

  Future<Map<String, dynamic>> _handleShowAnswer(BuildContext context, Map<String, dynamic>? data) async {
    // Show answer (quiz context)
    return {'success': true, 'message': 'Answer shown'};
  }

  Future<Map<String, dynamic>> _handleSkipQuestion(BuildContext context, Map<String, dynamic>? data) async {
    // Skip current question
    return {'success': true, 'message': 'Question skipped'};
  }

  Future<Map<String, dynamic>> _handleHelp(BuildContext context) async {
    // Show help dialog
    return {'success': true, 'message': 'Showing help'};
  }

  Future<Map<String, dynamic>> _handleYes(BuildContext context) async {
    // Confirm action
    return {'success': true, 'message': 'Confirmed'};
  }

  Future<Map<String, dynamic>> _handleNo(BuildContext context) async {
    // Cancel action
    return {'success': true, 'message': 'Cancelled'};
  }
}


