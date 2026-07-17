import 'package:google_generative_ai/google_generative_ai.dart';
import '../features/games/models/game_models.dart'; // GameResponse is now here

class GameManager {
  static final GameManager _instance = GameManager._internal();
  factory GameManager() => _instance;
  GameManager._internal();

  // Global Stats
  int highScore = 0;
  int totalGamesPlayed = 0;
  int lifetimeScore = 0;

  // Specific Game High Scores
  int _runnerHighScore = 0;
  int _floodHighScore = 0;

  int get runnerHighScore => _runnerHighScore;
  int get floodHighScore => _floodHighScore;

  // Level Progression
  int maxLevelUnlocked = 1; 
  int currentLevelSelected = 0; // 0 = Endless

  // New Game Settings
  String selectedLanguage = 'English'; 
  String selectedCharacter = 'Boy'; 

  GameSession? currentSession;

  // --- TRANSLATION DATA ---
  static Map<String, Map<String, String>> translations = {
    'English': {
      'Boy': 'Boy', 'Girl': 'Girl', 
      'Level': 'Level', 'Endless': 'Endless',
      'Time': 'Time', 'Items': 'Items', 
      'Score': 'Score', 'HighScore': 'High Score', 'MaxLevel': 'Max Level',
      'GameOver': 'CAUGHT BY FIRE!', 'Win': 'LEVEL CLEARED!',
      'TryAgain': 'TRY AGAIN', 'Exit': 'EXIT TO MENU', 'Continue': 'CONTINUE',
      'Survival': 'Survive', 'ScoreBonus': 'Score Bonus','Lives':'Lives',
    },
    'Hindi': {
      'Boy': 'लड़का', 'Girl': 'लड़की', 
      'Level': 'स्तर', 'Endless': 'अनंत',
      'Time': 'समय', 'Items': 'वस्तुएं', 
      'Score': 'स्कोर', 'HighScore': 'उच्च स्कोर', 'MaxLevel': 'अधिकतम स्तर',
      'GameOver': 'आग ने पकड़ लिया!', 'Win': 'स्तर पूरा हुआ!',
      'TryAgain': 'फिर से कोशिश करें', 'Exit': 'मेनू पर जाएं', 'Continue': 'जारी रखें',
      'Survival': 'जीवित रहें', 'ScoreBonus': 'स्कोर बोनस','Lives':'ज़िंदगियाँ',
    },
    'Marathi': {
      'Boy': 'मुलगा', 'Girl': 'मुलगी', 
      'Level': 'स्तर', 'Endless': 'अनंत',
      'Time': 'वेळ', 'Items': 'वस्तू', 
      'Score': 'गुण', 'HighScore': 'उच्च गुण', 'MaxLevel': 'कमाल स्तर',
      'GameOver': 'आगीने पकडले!', 'Win': 'स्तर पूर्ण!',
      'TryAgain': 'पुन्हा प्रयत्न करा', 'Exit': 'मेनूवर जा', 'Continue': 'पुढे सुरू ठेवा',
      'Survival': 'टिकून राहा', 'ScoreBonus': 'गुण बोनस','Lives':'जीवन',
    },
    'Punjabi': {
      'Boy': 'ਮੁੰਡਾ', 'Girl': 'ਕੁੜੀ', 
      'Level': 'ਪੱਧਰ', 'Endless': 'ਅੰਤਹੀਣ',
      'Time': 'ਸਮਾਂ', 'Items': 'ਚੀਜ਼ਾਂ', 
      'Score': 'ਅੰਕ', 'HighScore': 'ਉੱਚ ਸਕੋਰ', 'MaxLevel': 'ਵੱਧ ਤੋਂ ਵੱਧ ਪੱਧਰ',
      'GameOver': 'ਅੱਗ ਨੇ ਫੜ ਲਿਆ!', 'Win': 'ਪੱਧਰ ਪੂਰਾ!',
      'TryAgain': 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ', 'Exit': 'ਮੇਨੂ ਤੇ ਜਾਓ', 'Continue': 'ਜਾਰੀ ਰੱਖੋ',
      'Survival': 'ਬਚੋ', 'ScoreBonus': 'ਅੰਕ ਬੋਨਸ','Lives':'ਜੀਵਨ',
    },
  };

  String getTrans(String key) {
    // Default to English if language not found or key not found
    return translations[selectedLanguage]?[key] ?? translations['English']![key] ?? key;
  }

  void startNewGame(String lang, String gameType) {
    totalGamesPlayed++;
    lifetimeScore += 1; 
    // Always create a session to track the gameType for high score logic
    currentSession = GameSession(languageCode: lang, gameType: gameType);
  }

  void playWebGame() {
    totalGamesPlayed++;
    lifetimeScore += 1; 
  }
  
  void setRunnerSettings(String lang, String char) {
    selectedLanguage = lang;
    selectedCharacter = char;
  }

  // --- LEVEL LOGIC ---
  void completeLevel(int level) {
    // Unlock next level if we just beat the highest unlocked one
    if (level >= maxLevelUnlocked) {
      maxLevelUnlocked = level + 1;
    }
    // Award Level Completion Points
    updateScores(10, 0); 
  }
  
  void advanceToNextLevel() {
    currentLevelSelected++;
  }

  double getLevelSurvivalTime(int level) {
    if (level <= 0) return double.infinity; // Endless
    
    double baseTime = 30.0;
    if (level <= 25) {
      return baseTime + ((level - 1) * 5);
    } else {
      double timeAt25 = baseTime + (24 * 5); 
      return timeAt25 + ((level - 25) * 10);
    }
  }

  void clearSession() {
    currentSession = null;
  }

  void updateScores(int roundScore, int currentTotalScore) {
    lifetimeScore += roundScore;
    if (currentTotalScore > highScore) {
      highScore = currentTotalScore;
    }

    // Update specific game high scores
    if (currentSession?.gameType == 'runner' && currentTotalScore > _runnerHighScore) {
      _runnerHighScore = currentTotalScore;
    }
    if (currentSession?.gameType == 'jumper' && currentTotalScore > _floodHighScore) {
      _floodHighScore = currentTotalScore;
    }
  }
}

// ... (Keep GameSession and TurnHistoryItem classes unchanged)
class GameSession {
  final String languageCode;
  final String gameType;
  final List<TurnHistoryItem> history = [];
  GameResponse? currentScenarioData;
  String? persistentTitle;
  String? persistentDescription;
  int totalScore = 0;
  bool isGameOver = false;
  bool isLoading = false;
  String? errorMessage;
  ChatSession? chatSession;
  GameSession({required this.languageCode, required this.gameType});
}

class TurnHistoryItem {
  final String question;
  final String userAnswer;
  final String evaluation;
  final int score;
  final String explanation;
  final String source;
  TurnHistoryItem({required this.question, required this.userAnswer, required this.evaluation, required this.score, required this.explanation, required this.source});
}