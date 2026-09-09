import 'package:flutter/material.dart';
import '../managers/game_manager.dart';
import '../features/games/screens/flood_escape_game.dart'; // Import the new game
import '../core/design/design_system.dart';

class JumperSetupScreen extends StatefulWidget {
  const JumperSetupScreen({super.key});

  @override
  State<JumperSetupScreen> createState() => _JumperSetupScreenState();
}

class _JumperSetupScreenState extends State<JumperSetupScreen> {
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
      backgroundColor: Colors.blue.shade50, // Different color for distinction
      appBar: AppBar(
          title: const Text('Flood Escape Setup'),
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
                _buildMiniStat(
                    _getTrans('HighScore'), '${GameManager().floodHighScore}'),
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
                            // Reset char to ensure logic stays consistent if language swaps
                            _selectedChar = null;
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
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
              ),
              onPressed: (_selectedLang != null && _selectedChar != null)
                  ? () {
                      // Save Settings
                      // FIX: We rely on _selectedChar being the internal key ("Boy" or "Girl")
                      GameManager()
                          .setRunnerSettings(_selectedLang!, _selectedChar!);

                      // Go to Game
                      Navigator.push(
                        context,
                        MaterialPageRoute<dynamic>(
                            builder: (context) => const FloodEscapeWidget()),
                      ).then((_) => setState(() {}));
                    }
                  : null,
              child: const Text('START ESCAPE',
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
                color: Colors.blueAccent,
                fontFamily: 'PixelGame')),
      ],
    );
  }

  Widget _buildCharCard(String internalKey, IconData icon) {
    // FIX: Translate the name for DISPLAY ONLY
    String displayName = _getTrans(internalKey);

    // Check against internal key to maintain selection logic
    bool isSelected = _selectedChar == internalKey;

    return GestureDetector(
      // FIX: Set the INTERNAL key ("Boy"/"Girl") when tapped, not the translated string
      onTap: () => setState(() => _selectedChar = internalKey),
      child: Container(
        width: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade100 : Colors.white,
          border: Border.all(
              color: isSelected ? Colors.blueAccent : Colors.grey, width: 2),
          borderRadius: AppBorders.borderRadiusLg,
        ),
        child: Column(
          children: [
            Icon(icon,
                size: 60, color: isSelected ? Colors.blueAccent : Colors.grey),
            const SizedBox(height: 8),
            Text(displayName,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.blueAccent : Colors.black,
                    fontFamily: 'PixelGame')),
          ],
        ),
      ),
    );
  }
}
