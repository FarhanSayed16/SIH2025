import 'package:flutter/material.dart';
import '../managers/game_manager.dart';
// FIX: Import games correctly from the sibling 'games' folder
import '../games/punjab_safety_game.dart';
import '../games/school_safety_quiz_game.dart';

class LanguageSelectionScreen extends StatelessWidget {
  final String gameType; // 'punjab' or 'quiz'
  
  const LanguageSelectionScreen({super.key, required this.gameType});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.orange.shade50,
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0, 
        iconTheme: const IconThemeData(color: Colors.black)
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('🌪️', style: TextStyle(fontSize: 60)),
              const SizedBox(height: 20),
              const Text(
                'Select Language / भाषा चुनें',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 40),
              _buildOption(context, 'English', 'en'),
              const SizedBox(height: 16),
              _buildOption(context, 'हिंदी (Hindi)', 'hi'),
              const SizedBox(height: 16),
              _buildOption(context, 'मराठी (Marathi)', 'mr'),
              const SizedBox(height: 16),
              _buildOption(context, 'ਪੰਜਾਬੀ (Punjabi)', 'pa'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOption(BuildContext context, String label, String code) {
    return SizedBox(
      width: 200,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        ),
        onPressed: () {
          // 1. Start the game session with the specific game type
          GameManager().startNewGame(code, gameType);
          
          // 2. Navigate to the correct game screen based on gameType
          Widget nextScreen;
          if (gameType == 'quiz') {
            nextScreen = const SchoolSafetyQuizScreen(isResume: false);
          } else {
            nextScreen = const PunjabSafetyGameScreen(isResume: false);
          }

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => nextScreen),
          );
        },
        child: Text(label, style: const TextStyle(fontSize: 18)),
      ),
    );
  }
}