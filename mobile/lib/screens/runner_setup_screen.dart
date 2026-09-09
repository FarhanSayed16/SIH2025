import 'package:flutter/material.dart';
import '../managers/game_manager.dart';
import '../features/games/screens/school_runner_game.dart';
import '../core/design/design_system.dart';

class RunnerSetupScreen extends StatefulWidget {
  const RunnerSetupScreen({super.key});

  @override
  State<RunnerSetupScreen> createState() => _RunnerSetupScreenState();
}

class _RunnerSetupScreenState extends State<RunnerSetupScreen> {
  String? _selectedLang;
  String? _selectedChar;

  final List<String> _languages = ['English', 'Hindi', 'Marathi', 'Punjabi'];

  // Helper to translate UI elements in this screen instantly
  String _getTrans(String key) {
    if (_selectedLang == null) return key;
    return GameManager.translations[_selectedLang]?[key] ?? key;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.orange.shade50,
      appBar: AppBar(
          title: const Text('Game Setup'),
          backgroundColor: Colors.transparent,
          elevation: 0),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // STATS DISPLAY (Updates when build runs)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // FIX: Use specific runner high score, not global high score
                _buildMiniStat(
                    _getTrans('HighScore'), '${GameManager().runnerHighScore}'),
                _buildMiniStat(
                    _getTrans('MaxLevel'), '${GameManager().maxLevelUnlocked}'),
              ],
            ),
            const Divider(height: 30),

            const Text('1. Choose Language',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'PixelGame')),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              children: _languages
                  .map((lang) => ChoiceChip(
                        label: Text(lang),
                        selected: _selectedLang == lang,
                        onSelected: (val) {
                          setState(() {
                            _selectedLang = lang;
                            // Also Update GameManager immediately so translations work locally
                            GameManager().selectedLanguage = lang;
                          });
                        },
                      ))
                  .toList(),
            ),

            const SizedBox(height: 30),

            const Text('2. Choose Character',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'PixelGame')),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildCharCard('Boy', Icons.boy),
                _buildCharCard('Girl', Icons.girl),
              ],
            ),

            const Spacer(),

            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: Colors.deepOrange,
                foregroundColor: Colors.white,
              ),
              onPressed: (_selectedLang != null && _selectedChar != null)
                  ? () {
                      // Save Settings
                      GameManager()
                          .setRunnerSettings(_selectedLang!, _selectedChar!);

                      // Go to Mode Selection
                      // FIX: Added .then() to force a refresh when the user returns from the game
                      Navigator.push(
                        context,
                        MaterialPageRoute<dynamic>(
                            builder: (context) =>
                                const SchoolRunnerWidget(isEndless: false)),
                      ).then((_) => setState(() {}));
                    }
                  : null,
              child: const Text('CONTINUE',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'PixelGame')),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.grey, fontSize: 12, fontFamily: 'PixelGame')),
        Text(value,
            style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.deepOrange,
                fontFamily: 'PixelGame')),
      ],
    );
  }

  Widget _buildCharCard(String key, IconData icon) {
    // Translated name based on selection
    String name = _getTrans(key);

    // We check against the Translated Name to see if it's selected
    bool isSelected = _selectedChar == name;

    return GestureDetector(
      onTap: () => setState(() => _selectedChar = name),
      child: Container(
        width: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange.shade100 : Colors.white,
          border: Border.all(
              color: isSelected ? Colors.deepOrange : Colors.grey, width: 2),
          borderRadius: AppBorders.borderRadiusLg,
        ),
        child: Column(
          children: [
            Icon(icon,
                size: 60, color: isSelected ? Colors.deepOrange : Colors.grey),
            const SizedBox(height: 8),
            Text(name,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.deepOrange : Colors.black,
                    fontFamily: 'PixelGame')),
          ],
        ),
      ),
    );
  }
}
