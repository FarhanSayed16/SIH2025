import 'dart:async';
import 'dart:convert'; // Added for JSON parsing
import 'dart:math';
import 'package:flame/components.dart';
// Removed flame/effects.dart as we are doing manual blink
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flame/parallax.dart';
import 'package:flame_audio/flame_audio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../managers/game_manager.dart';

// ---------------------------------------------------------------------------
// QUIZ DATA MODEL
// ---------------------------------------------------------------------------
class QuizQuestion {
  final int id;
  final String topic;
  final String question;
  final Map<String, dynamic> options;
  final String answer;
  final String explanation;

  QuizQuestion({
    required this.id,
    required this.topic,
    required this.question,
    required this.options,
    required this.answer,
    required this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      id: (json['id'] is int)
          ? json['id'] as int
          : (json['id'] != null ? int.tryParse(json['id'].toString()) ?? 0 : 0),
      topic: (json['topic'] is String)
          ? json['topic'] as String
          : (json['topic']?.toString() ?? ''),
      question: (json['question'] is String)
          ? json['question'] as String
          : (json['question']?.toString() ?? ''),
      options: (json['options'] is Map)
          ? Map<String, dynamic>.from(json['options'] as Map)
          : <String, dynamic>{},
      answer: (json['answer'] is String)
          ? json['answer'] as String
          : (json['answer']?.toString() ?? ''),
      explanation: (json['explanation'] is String)
          ? json['explanation'] as String
          : (json['explanation']?.toString() ?? ''),
    );
  }
}

enum GameMode { menu, endless, story }

enum PlayerState { running, jumping, dead }

// ---------------------------------------------------------------------------
// 1. THE MAIN GAME CLASS
// ---------------------------------------------------------------------------
class SchoolRunnerGame extends FlameGame
    with TapCallbacks, HasCollisionDetection {
  late PlayerComponent _player;
  late FireComponent _fire;
  late ChunkManager _chunkManager;
  late GroundBlock _staticGround;

  // Environment & Audio Management
  ParallaxComponent? _currentParallax;
  RectangleComponent? _darkOverlay;
  double _environmentTimer = 0;

  final List<String> _musicTracks = [
    'bg_music1.mp3',
    'bg_music2.mp3',
    'bg_music3.mp3',
    'bg_music4.mp3',
    'bg_music5.mp3',
    'bg_music6.mp3',
    'bg_music7.mp3',
    'bg_music8.mp3',
  ];

  // HUD Components
  late TextComponent _levelText;
  late TextComponent _timeText;
  late TextComponent _collectableText;

  GameMode currentMode = GameMode.menu;
  bool isGameOver = false;

  double timeSurvived = 0;
  double levelGoalTime = 30; // change to show to SIH jury
  int collectablesCount = 0;
  int score = 0;

  // Physics Constants
  final double gravity = 1600.0;
  final double jumpForce = -750.0;
  final double runSpeedBase = 350.0;
  double currentRunSpeed = 350.0;

  final bool startInEndless;

  SchoolRunnerGame({required this.startInEndless});

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    _initializeGameMode();

    try {
      FlameAudio.bgm.initialize();
    } catch (e) {
      // Ignore if already initialized
    }
    _changeEnvironment();

    _staticGround =
        GroundBlock(position: Vector2(0, 1000 - 100), size: Vector2(1000, 100));
    add(_staticGround);

    _chunkManager = ChunkManager();
    add(_chunkManager);

    _player = PlayerComponent();
    add(_player);

    _fire = FireComponent();
    add(_fire);

    _setupHUD();

    resumeEngine();
  }

  Future<void> _changeEnvironment() async {
    if (_currentParallax != null) {
      _currentParallax!.removeFromParent();
    }
    if (_darkOverlay != null) {
      _darkOverlay!.removeFromParent();
    }

    int bgIndex = Random().nextInt(11) + 1;
    try {
      _currentParallax = await loadParallaxComponent(
        [ParallaxImageData('Background/bg$bgIndex.png')],
        baseVelocity: Vector2(50, 0),
        velocityMultiplierDelta: Vector2(1.2, 1.0),
        repeat: ImageRepeat.repeat,
        fill: LayerFill.height,
      );
      _currentParallax!.priority = -10;
      add(_currentParallax!);

      _darkOverlay = RectangleComponent(
        size: size,
        paint: Paint()..color = Colors.black.withOpacity(0.35),
        priority: -9,
      );
      add(_darkOverlay!);
    } catch (e) {
      add(RectangleComponent(
          size: size,
          paint: Paint()..color = const Color(0xFFE0F7FA),
          priority: -10));
    }

    if (_musicTracks.isNotEmpty) {
      try {
        if (FlameAudio.bgm.isPlaying) {
          await FlameAudio.bgm.stop();
        }
        String nextTrack = _musicTracks[Random().nextInt(_musicTracks.length)];
        await Future.delayed(const Duration(milliseconds: 100));

        try {
          await FlameAudio.bgm.play(nextTrack, volume: 0.5);
        } catch (e) {
          debugPrint('BGM Play Error: $e');
        }
      } catch (e) {
        debugPrint('Audio Error: $e');
      }
    }
  }

  void _initializeGameMode() {
    if (startInEndless) {
      currentMode = GameMode.endless;
      levelGoalTime = double.infinity;
    } else {
      currentMode = GameMode.story;
      int level = GameManager().currentLevelSelected;
      if (level <= 0) level = 1;
      levelGoalTime = GameManager().getLevelSurvivalTime(level);
    }

    currentRunSpeed = runSpeedBase;
    timeSurvived = 0;
    _environmentTimer = 0;
    score = 0;
    collectablesCount = 0;
    isGameOver = false;
  }

  void restartGame() {
    _initializeGameMode();
    _player.reset();
    _chunkManager.reset();
    _changeEnvironment();

    overlays.remove('GameOverMenu');
    overlays.remove('GameWinMenu');
    overlays.remove('QuizMenu');

    resumeEngine();
  }

  void startNextLevel() {
    GameManager().advanceToNextLevel();
    _initializeGameMode();
    _player.reset();
    _chunkManager.reset();
    _changeEnvironment();

    overlays.remove('GameWinMenu');
    overlays.remove('QuizMenu');
    resumeEngine();
  }

  // Trigger the quiz overlay
  void startQuiz() {
    overlays.remove('GameWinMenu');
    overlays.add('QuizMenu');
  }

  // New visual effect when a life is used to save the player
  void showLifeSavedEffect() {
    // Just a simple floating text effect
    final textPaint = TextPaint(
      style: const TextStyle(
        color: Colors.redAccent,
        fontSize: 40,
        fontWeight: FontWeight.bold,
        fontFamily: 'PixelGame',
        shadows: [Shadow(blurRadius: 4, color: Colors.black)],
      ),
    );

    final lifeMsg = TextComponent(
      text: '-1 Life!',
      position: Vector2(size.x / 2, size.y / 2 - 100),
      anchor: Anchor.center,
      textRenderer: textPaint,
    );

    add(lifeMsg);

    // Manual simple movement/fade logic for the text message
    // (Avoiding Effects API to prevent any potential conflicts for now)
    final timer = TimerComponent(
      period: 1.0,
      removeOnFinish: true,
      onTick: () {
        lifeMsg.removeFromParent();
      },
    );
    add(timer);
  }

  @override
  void onGameResize(Vector2 size) {
    super.onGameResize(size);
    if (isLoaded) {
      _staticGround.position.y = size.y - 100;
      _staticGround.size.x = size.x;

      if (_darkOverlay != null) {
        _darkOverlay!.size = size;
      }

      _timeText.position = Vector2(size.x / 2, 40);
      _levelText.position = Vector2(size.x / 2, 100);
      _collectableText.position = Vector2(size.x - 40, 40);

      _fire.size.y = size.y;

      if (_player.isOnGround) {
        _player.position.y = size.y - 100;
      }
    }
  }

  void _setupHUD() {
    String? fontFamily =
        GameManager().selectedLanguage == 'English' ? 'PixelGame' : null;

    final textPaint = TextPaint(
        style: TextStyle(
            color: Colors.white,
            fontSize: 35,
            fontWeight: FontWeight.bold,
            fontFamily: fontFamily,
            shadows: const [Shadow(blurRadius: 4, color: Colors.black)]));

    final bgPaint = Paint()..color = Colors.black87;

    _timeText = TextComponent(
      text: '0s',
      anchor: Anchor.topCenter,
      position: Vector2(size.x / 2, 40),
      textRenderer: textPaint.copyWith((style) => style.copyWith(
            color: Colors.white,
            background: bgPaint,
          )),
    );
    add(_timeText);

    _levelText = TextComponent(
      text: '',
      anchor: Anchor.topCenter,
      position: Vector2(size.x / 2, 100),
      textRenderer: textPaint.copyWith((style) => style.copyWith(
          color: Colors.yellowAccent, background: bgPaint, fontSize: 28)),
    );
    add(_levelText);

    _collectableText = TextComponent(
      text: 'Lives: 0',
      anchor: Anchor.topRight,
      position: Vector2(size.x - 40, 40),
      textRenderer: textPaint.copyWith((style) => style.copyWith(
            color: Colors.greenAccent,
            background: bgPaint,
          )),
    );
    add(_collectableText);
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (isGameOver) return;

    timeSurvived += dt;
    _environmentTimer += dt;

    if (currentMode == GameMode.endless && _environmentTimer >= 60.0) {
      _environmentTimer = 0;
      _changeEnvironment();
    }

    // UPDATE HUD TEXT
    String levelLabel = GameManager().getTrans('Level');
    String endlessLabel = GameManager().getTrans('Endless');
    _levelText.text = startInEndless
        ? endlessLabel
        : '$levelLabel ${GameManager().currentLevelSelected}';

    String displayTime;
    String surviveLabel = GameManager().getTrans('Survival');
    if (levelGoalTime.isInfinite) {
      displayTime = '$surviveLabel: ${timeSurvived.toInt()}s';
    } else {
      displayTime = '${timeSurvived.toInt()} / ${levelGoalTime.toInt()} s';
    }
    _timeText.text = displayTime;

    _collectableText.text = 'Lives: $collectablesCount';

    // FIX: TRANSLATION FOR LIVES
    String livesLabel =
        GameManager().getTrans('Lives'); // Use the translation key
    _collectableText.text = '$livesLabel: $collectablesCount';

    // WIN CONDITION
    if (currentMode == GameMode.story && timeSurvived >= levelGoalTime) {
      gameLevelComplete();
    }

    // SPEED UP
    if (currentMode == GameMode.endless && currentRunSpeed < 800) {
      currentRunSpeed += 10 * dt;
    }

    score = timeSurvived.toInt();
  }

  void collectItem() {
    collectablesCount++;
  }

  void gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    _player.current = PlayerState.dead;

    Future.delayed(const Duration(milliseconds: 500), () {
      pauseEngine();
      GameManager().updateScores(score, score);
      overlays.add('GameOverMenu');
    });
  }

  void gameLevelComplete() {
    if (isGameOver) return;
    isGameOver = true;
    pauseEngine();

    if (currentMode == GameMode.story) {
      GameManager().completeLevel(GameManager().currentLevelSelected);
    }

    GameManager().updateScores(score + 10, score);
    overlays.add('GameWinMenu');
  }

  @override
  void onTapDown(TapDownEvent event) {
    super.onTapDown(event);
    if (!isGameOver) {
      _player.jump();
    }
  }

  @override
  void onRemove() {
    FlameAudio.bgm.stop();
    super.onRemove();
  }
}

// ---------------------------------------------------------------------------
// 2. PLAYER COMPONENT
// ---------------------------------------------------------------------------
// CHANGED: Extends PositionComponent instead of SpriteAnimationGroupComponent for safety
class PlayerComponent extends PositionComponent
    with HasGameReference<SchoolRunnerGame> {
  // We use a child SpriteAnimationGroupComponent to handle animations
  SpriteAnimationGroupComponent<PlayerState>? _animationComponent;

  double yVelocity = 0;
  bool isOnGround = false;
  String charType = 'Boy';

  // Stuck state
  bool isStuck = false;
  final double defaultX = 175.0;

  // Manual Blink State
  bool _isBlinking = false;
  double _blinkTimer = 0.0;

  // Track Current State Manually since we are wrapper
  PlayerState _current = PlayerState.running;

  // Getter and Setter for current state
  PlayerState get current => _current;

  set current(PlayerState value) {
    if (_current != value) {
      _current = value;
      // Force update the child animation component immediately
      if (_animationComponent != null) {
        _animationComponent!.current = _current;
      }
    }
  }

  PlayerComponent() : super(size: Vector2(46, 64), anchor: Anchor.bottomLeft);

  @override
  Future<void> onLoad() async {
    String rawChar = GameManager().selectedCharacter;
    if (['Boy', 'लड़का', 'मुलगा', 'ਮੁੰਡਾ'].contains(rawChar)) {
      charType = 'Boy';
    } else {
      charType = 'Girl';
    }

    try {
      Future<SpriteAnimation> spriteAnimation(String action, int amount) async {
        final spriteImage =
            await game.images.load('Player/$charType/$action.png');
        final spriteSheet = SpriteAnimationData.sequenced(
          amount: amount,
          stepTime: 0.08,
          textureSize: Vector2(
              spriteImage.width / amount, spriteImage.height.toDouble()),
        );
        return SpriteAnimation.fromFrameData(spriteImage, spriteSheet);
      }

      final running = await spriteAnimation('Running', 5);
      final jumping = await spriteAnimation('jump', 4);
      final death = await spriteAnimation('death', 3);

      _animationComponent = SpriteAnimationGroupComponent<PlayerState>(
        animations: {
          PlayerState.running: running,
          PlayerState.jumping: jumping,
          PlayerState.dead: death,
        },
        current: PlayerState.running,
        size: size,
      );
      add(_animationComponent!);
    } catch (e) {
      debugPrint('Animation Load Error: $e');
      // Fallback: Blue Box
      add(RectangleComponent(size: size, paint: Paint()..color = Colors.blue));
    }

    reset();
  }

  void reset() {
    position = Vector2(defaultX, game.size.y - 96);
    yVelocity = 0;
    // Set field directly to avoid triggering setter logic unnecessarily if unchanged, but setter is fine too
    current = PlayerState.running;

    isOnGround = true;
    isStuck = false;
    _isBlinking = false;
    // Reset opacity
    if (_animationComponent != null) {
      _animationComponent!.paint.color =
          _animationComponent!.paint.color.withOpacity(1.0);
    }
  }

  void hitObstacle() {
    isStuck = true;
  }

  void blink() {
    _isBlinking = true;
    _blinkTimer = 0.0;
  }

  @override
  void update(double dt) {
    super.update(dt);

    // --- Physics ---
    yVelocity += game.gravity * dt;
    position.y += yVelocity * dt;

    double groundLevel = game.size.y - 96;

    if (position.y >= groundLevel) {
      position.y = groundLevel;
      yVelocity = 0;
      isOnGround = true;
      if (current != PlayerState.dead) {
        if (current != PlayerState.running) current = PlayerState.running;
      }
    } else {
      isOnGround = false;
      if (current != PlayerState.dead) {
        if (current != PlayerState.jumping) current = PlayerState.jumping;
      }
    }

    // --- Stuck Logic ---
    if (current != PlayerState.dead) {
      if (isStuck) {
        position.x -= game.currentRunSpeed * dt;
      } else if (position.x < defaultX) {
        position.x += (game.currentRunSpeed * 0.5) * dt;
        if (position.x > defaultX) position.x = defaultX;
      }
    }

    // --- Manual Blink Logic ---
    if (_isBlinking && _animationComponent != null) {
      _blinkTimer += dt;
      if (_blinkTimer < 1.0) {
        double t = _blinkTimer * 10;
        bool visible = t.toInt() % 2 == 0;
        _animationComponent!.paint.color =
            _animationComponent!.paint.color.withOpacity(visible ? 1.0 : 0.2);
      } else {
        _isBlinking = false;
        _animationComponent!.paint.color =
            _animationComponent!.paint.color.withOpacity(1.0);
      }
    }
  }

  void jump() {
    if (isOnGround && current != PlayerState.dead) {
      yVelocity = game.jumpForce;
      isOnGround = false;
      current = PlayerState.jumping;
      isStuck = false;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. FIRE COMPONENT
// ---------------------------------------------------------------------------
// CHANGED: Extends PositionComponent instead of SpriteComponent
class FireComponent extends PositionComponent
    with HasGameReference<SchoolRunnerGame> {
  @override
  Future<void> onLoad() async {
    size = Vector2(290, game.size.y);
    position = Vector2(-150, 0);
    priority = 20;

    try {
      final sprite = await game.loadSprite('Fire Wall/fire.png');
      add(SpriteComponent(sprite: sprite, size: size));
    } catch (e) {
      // Fallback
      add(RectangleComponent(
          size: size, paint: Paint()..color = Colors.orange.withOpacity(0.5)));
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    position.x = -100 + 15 * sin(game.currentTime() * 5);

    if (toRect().overlaps(game._player.toRect().deflate(75))) {
      game.gameOver();
    }
  }
}

// ---------------------------------------------------------------------------
// 4. CHUNK MANAGER
// ---------------------------------------------------------------------------
class ChunkManager extends Component with HasGameReference<SchoolRunnerGame> {
  double _timer = 0;
  double _nextSpawnSeconds = 0;

  @override
  void onLoad() {
    reset();
  }

  void reset() {
    game.children
        .whereType<ObstacleComponent>()
        .forEach((e) => e.removeFromParent());
    game.children
        .whereType<CollectableComponent>()
        .forEach((e) => e.removeFromParent());

    _timer = 0;
    _nextSpawnSeconds = 0;

    double startX = 600;
    for (int i = 0; i < 3; i++) {
      spawnRandomItem(startX);
      startX += 600 + Random().nextInt(400);
    }
  }

  @override
  void update(double dt) {
    super.update(dt);

    _timer += dt;

    if (_timer >= _nextSpawnSeconds) {
      spawnRandomItem(game.size.x + 100);
      _timer = 0;

      double minGap = 500.0;
      double maxGap = 1000.0;
      double desiredGap = minGap + Random().nextInt((maxGap - minGap).toInt());

      _nextSpawnSeconds = desiredGap / game.currentRunSpeed;
    }
  }

  void spawnRandomItem(double xPos) {
    double spawnY = game.size.y;
    // Lower spawn rate for Lives (10% chance)
    if (Random().nextDouble() < 0.155) {
      game.add(CollectableComponent(startPosition: Vector2(xPos, spawnY - 95)));
    } else {
      int obIndex = Random().nextInt(10) + 1;
      game.add(ObstacleComponent(
          typeIndex: obIndex, startPosition: Vector2(xPos, spawnY - 95)));
    }
  }
}

// ---------------------------------------------------------------------------
// 5. VISUAL COMPONENTS
// ---------------------------------------------------------------------------
class GroundBlock extends PositionComponent
    with HasGameReference<SchoolRunnerGame> {
  GroundBlock({required Vector2 position, required Vector2 size})
      : super(position: position, size: size, priority: 2);

  @override
  Future<void> onLoad() async {
    add(RectangleComponent(
        size: size, paint: Paint()..color = Colors.grey.shade800));
    add(RectangleComponent(
        size: Vector2(size.x, 8), paint: Paint()..color = Colors.greenAccent));
  }
}

// CHANGED: Extends PositionComponent instead of SpriteComponent
class ObstacleComponent extends PositionComponent
    with HasGameReference<SchoolRunnerGame> {
  final int typeIndex;
  final Vector2 startPosition;

  ObstacleComponent({required this.typeIndex, required this.startPosition})
      : super(
            size: Vector2(60, 60),
            position: startPosition,
            anchor: Anchor.bottomLeft);

  @override
  Future<void> onLoad() async {
    priority = 5;
    try {
      final sprite = await game.loadSprite('obsticles/ob$typeIndex.png');
      add(SpriteComponent(sprite: sprite, size: size));
    } catch (e) {
      add(RectangleComponent(size: size, paint: Paint()..color = Colors.red));
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    position.x -= game.currentRunSpeed * dt;

    if (position.x < -100) removeFromParent();

    // Extra Life Logic
    if (!game.isGameOver &&
        toRect().overlaps(game._player.toRect().deflate(15))) {
      if (game.collectablesCount > 0) {
        // USE EXTRA LIFE
        game.collectablesCount--;
        game._player.blink(); // Triggers manual blink
        game.showLifeSavedEffect();
        removeFromParent(); // Destroy obstacle
      } else {
        // NO LIVES - GET STUCK
        game._player.hitObstacle();
        removeFromParent();
      }
    }
  }
}

// CHANGED: Extends PositionComponent instead of SpriteComponent
class CollectableComponent extends PositionComponent
    with HasGameReference<SchoolRunnerGame> {
  final Vector2 startPosition;
  double bobTime = 0;

  CollectableComponent({required this.startPosition})
      : super(
            size: Vector2(40, 40),
            position: startPosition,
            anchor: Anchor.center);

  @override
  Future<void> onLoad() async {
    priority = 6;
    try {
      final sprite = await game.loadSprite('object to collect/fire_exi.png');
      add(SpriteComponent(sprite: sprite, size: size));
    } catch (e) {
      add(RectangleComponent(
          size: size, paint: Paint()..color = Colors.yellow));
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    position.x -= game.currentRunSpeed * dt;

    bobTime += dt * 5;
    position.y = startPosition.y + sin(bobTime) * 10;

    if (position.x < -100) removeFromParent();

    if (!game.isGameOver && toRect().overlaps(game._player.toRect())) {
      game.collectItem();
      removeFromParent();
    }
  }
}

// ---------------------------------------------------------------------------
// 6. QUIZ WIDGET OVERLAY
// ---------------------------------------------------------------------------
class QuizMenu extends StatefulWidget {
  final SchoolRunnerGame game;
  const QuizMenu({Key? key, required this.game}) : super(key: key);

  @override
  State<QuizMenu> createState() => _QuizMenuState();
}

class _QuizMenuState extends State<QuizMenu> {
  List<QuizQuestion> questionQueue = [];
  QuizQuestion? currentQuestion;
  int currentQuestionIndex = 0;

  final int questionsToAsk = 2;

  bool isLoading = true;
  bool answered = false;
  bool isCorrect = false;
  String? selectedOption;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadRandomQuestion();
  }

  Future<void> _loadRandomQuestion() async {
    if (!mounted) return;
    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    String langCode = 'eng';
    String selectedLang = GameManager().selectedLanguage;

    if (selectedLang == 'Hindi' || selectedLang == 'हिंदी')
      langCode = 'hin';
    else if (selectedLang == 'Marathi' || selectedLang == 'मराठी')
      langCode = 'mar';
    else if (selectedLang == 'Punjabi' || selectedLang == 'ਪੰਜਾਬੀ')
      langCode = 'pun';

    String fileName = 'assets/quiz/quiz_$langCode.json';

    // Safety timeout to prevent freezing indefinitely
    try {
      await _loadQuizFile(fileName).timeout(const Duration(seconds: 3));
    } catch (e) {
      debugPrint('Error loading $fileName: $e');

      // If error, try English fallback
      if (langCode != 'eng') {
        try {
          await _loadQuizFile('assets/quiz/quiz_eng.json')
              .timeout(const Duration(seconds: 2));
        } catch (e2) {
          _handleLoadError(e2.toString());
        }
      } else {
        _handleLoadError(e.toString());
      }
    } finally {
      // ENSURE Loading stops in all cases
      if (mounted && isLoading) {
        setState(() {
          isLoading = false;
        });
        if (currentQuestion == null && errorMessage.isEmpty) {
          errorMessage = 'Unknown error loading quiz.';
        }
      }
    }
  }

  Future<void> _loadQuizFile(String path) async {
    try {
      final String response = await rootBundle.loadString(path);
      final decoded = json.decode(response);
      final List<dynamic> data =
          (decoded is List) ? decoded : [];

      if (data.isNotEmpty) {
        final random = Random();
        final Set<int> pickedIndices = {};

        int count = min(questionsToAsk, data.length);

        // Safety break counter to prevent infinite loops if something weird happens
        int safetyLoop = 0;
        while (pickedIndices.length < count && safetyLoop < 1000) {
          pickedIndices.add(random.nextInt(data.length));
          safetyLoop++;
        }

        final List<QuizQuestion> loadedQuestions = pickedIndices
            .map((i) => QuizQuestion.fromJson(data[i] as Map<String, dynamic>))
            .toList();

        if (mounted) {
          setState(() {
            questionQueue = loadedQuestions;
            currentQuestionIndex = 0;
            if (questionQueue.isNotEmpty) {
              currentQuestion = questionQueue[currentQuestionIndex];
            }
          });
        }
      } else {
        throw Exception('Empty Quiz File');
      }
    } catch (e) {
      throw e; // Re-throw to be caught by timeout or main catcher
    }
  }

  void _handleLoadError(String error) {
    if (!mounted) return;
    setState(() {
      isLoading = false;
      errorMessage = 'Error loading quiz. Check assets.\n\n$error';
    });
  }

  void _checkAnswer(String optionKey) {
    if (answered || currentQuestion == null) return;

    setState(() {
      selectedOption = optionKey;
      answered = true;
      isCorrect = (optionKey == currentQuestion!.answer);
    });
  }

  void _handleCompletion() {
    if (isCorrect) {
      if (currentQuestionIndex < questionQueue.length - 1) {
        setState(() {
          currentQuestionIndex++;
          currentQuestion = questionQueue[currentQuestionIndex];
          answered = false;
          selectedOption = null;
          isCorrect = false;
        });
      } else {
        widget.game.startNextLevel();
      }
    } else {
      widget.game.restartGame();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: Colors.yellowAccent));
    }

    if (currentQuestion == null || errorMessage.isNotEmpty) {
      return Center(
          child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.red)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Quiz Error',
                style: TextStyle(
                    color: Colors.redAccent,
                    fontSize: 20,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text(
                errorMessage.isNotEmpty
                    ? errorMessage
                    : 'Could not load question.',
                style: const TextStyle(color: Colors.white70),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
                onPressed: () => widget.game.startNextLevel(),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
                child: const Text('Skip Quiz',
                    style: TextStyle(color: Colors.black)))
          ],
        ),
      ));
    }

    String progressText =
        'Question ${currentQuestionIndex + 1} / ${questionQueue.length}';

    return Center(
      child: Container(
        width: 600,
        height: 350,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.95),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.blueAccent, width: 2),
        ),
        child: Column(
          children: [
            Text(
              progressText,
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 5),
            Text(
              'Topic: ${currentQuestion!.topic}',
              style: const TextStyle(
                  color: Colors.blueAccent,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Expanded(
              flex: 2,
              child: Center(
                child: SingleChildScrollView(
                  child: Text(
                    currentQuestion!.question,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            if (!answered) ...[
              Expanded(
                flex: 3,
                child: GridView.count(
                  crossAxisCount: 2,
                  childAspectRatio: 3.5,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  children: currentQuestion!.options.entries.map((entry) {
                    return ElevatedButton(
                      onPressed: () => _checkAnswer(entry.key),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey.shade800,
                        foregroundColor: Colors.white,
                      ),
                      child: Text('${entry.key}. ${entry.value}',
                          textAlign: TextAlign.center),
                    );
                  }).toList(),
                ),
              ),
            ] else ...[
              Expanded(
                flex: 4,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isCorrect
                        ? Colors.green.withOpacity(0.2)
                        : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: isCorrect ? Colors.green : Colors.red),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        isCorrect ? 'CORRECT!' : 'WRONG!',
                        style: TextStyle(
                            color: isCorrect
                                ? Colors.greenAccent
                                : Colors.redAccent,
                            fontSize: 24,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        currentQuestion!.explanation,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 14),
                      ),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: _handleCompletion,
                        style: ElevatedButton.styleFrom(
                            backgroundColor:
                                isCorrect ? Colors.green : Colors.orange,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 40, vertical: 15)),
                        child: Text(isCorrect
                            ? (currentQuestionIndex < questionQueue.length - 1
                                ? 'NEXT QUESTION'
                                : 'NEXT LEVEL')
                            : 'REPLAY LEVEL'),
                      )
                    ],
                  ),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 7. FLUTTER WIDGET WRAPPER
// ---------------------------------------------------------------------------
class SchoolRunnerWidget extends StatefulWidget {
  final bool isEndless;
  const SchoolRunnerWidget({super.key, required this.isEndless});

  @override
  State<SchoolRunnerWidget> createState() => _SchoolRunnerWidgetState();
}

class _SchoolRunnerWidgetState extends State<SchoolRunnerWidget> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    FlameAudio.bgm.stop();

    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String? fontFamily =
        GameManager().selectedLanguage == 'English' ? 'PixelGame' : null;

    return Scaffold(
      body: GameWidget(
        game: SchoolRunnerGame(startInEndless: widget.isEndless),
        overlayBuilderMap: {
          'QuizMenu': (context, SchoolRunnerGame game) {
            return QuizMenu(game: game);
          },
          'GameOverMenu': (context, SchoolRunnerGame game) {
            return Center(
              child: SingleChildScrollView(
                child: Container(
                  width: 400,
                  padding: const EdgeInsets.all(25),
                  decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.redAccent, width: 3)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(GameManager().getTrans('GameOver'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.redAccent,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              fontFamily: fontFamily)),
                      const SizedBox(height: 15),
                      Text("${GameManager().getTrans('Score')}: ${game.score}",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontFamily: fontFamily)),
                      const SizedBox(height: 30),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton(
                            onPressed: () {
                              game.restartGame();
                            },
                            style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 30, vertical: 15)),
                            child: Text(GameManager().getTrans('TryAgain'),
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontFamily: fontFamily)),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text(GameManager().getTrans('Exit'),
                                style: TextStyle(
                                    color: Colors.white70,
                                    fontFamily: fontFamily)),
                          )
                        ],
                      )
                    ],
                  ),
                ),
              ),
            );
          },
          'GameWinMenu': (context, SchoolRunnerGame game) {
            return Center(
              child: SingleChildScrollView(
                child: Container(
                  width: 400,
                  padding: const EdgeInsets.all(25),
                  decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.greenAccent, width: 3)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(GameManager().getTrans('Win'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.greenAccent,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              fontFamily: fontFamily)),
                      const SizedBox(height: 15),
                      Text("${GameManager().getTrans('ScoreBonus')}: +10",
                          style: const TextStyle(
                              color: Colors.yellow, fontSize: 20)),
                      const SizedBox(height: 30),
                      ElevatedButton(
                        onPressed: () {
                          game.startQuiz();
                        },
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 30, vertical: 15)),
                        child: Text(GameManager().getTrans('Continue'),
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: fontFamily)),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }
        },
      ),
    );
  }
}
