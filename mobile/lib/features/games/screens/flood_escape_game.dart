import 'dart:async';
import 'dart:convert'; // Added for JSON parsing
import 'dart:math';
import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
// Removed flame/effects.dart to avoid OpacityProvider conflicts
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flame/parallax.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flame_audio/flame_audio.dart';
import '../../../managers/game_manager.dart';

// --- ENUMS ---
enum PlayerState { running, jumping, dead, idle }

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
          : (json['options'] != null ? Map<String, dynamic>.from({}) : {}),
      answer: (json['answer'] is String)
          ? json['answer'] as String
          : (json['answer']?.toString() ?? ''),
      explanation: (json['explanation'] is String)
          ? json['explanation'] as String
          : (json['explanation']?.toString() ?? ''),
    );
  }
}

// ============================================================================
// 1. MAIN GAME CLASS
// ============================================================================
class FloodEscapeGame extends FlameGame
    with HasCollisionDetection, KeyboardEvents {
  late PlayerComponent _player;
  late WaterWallComponent _waterWall;
  late TileManager _tileManager;
  late TextComponent _levelText;
  late TextComponent _timeText;
  late TextComponent _livesText; // Added Lives HUD

  // Environment & Audio
  ParallaxComponent? _currentParallax;
  RectangleComponent? _darkOverlay;

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
  final List<String> _recentlyPlayed = [];

  // Game State
  bool isGameOver = false;
  double timeSurvived = 0;
  double levelGoalTime = 30;
  int currentLevel = 1;
  double waterSpeed = 60.0;
  int score = 0;
  int collectablesCount = 0; // Added for Extra Life Logic

  // Physics
  final double gravity = 1000.0;
  final double jumpForce = -550.0;
  final double moveSpeed = 250.0;

  @override
  Future<void> onLoad() async {
    await super.onLoad();

    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    camera.viewfinder.anchor = Anchor.center;

    try {
      FlameAudio.bgm.initialize();
    } catch (e) {
      // Audio might already be initialized, safe to ignore
    }

    // Initialize HUD components immediately
    _initHUD();

    await _initializeGame();
  }

  void _initHUD() {
    // FIX: Check language for Font. Pixel fonts often crash/don't render Hindi/Marathi.
    String? hudFont =
        GameManager().selectedLanguage == 'English' ? 'PixelGame' : null;

    final textPaint = TextPaint(
      style: TextStyle(
        color: Colors.white,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily:
            hudFont, // Use system font for non-English to prevent black screen
        shadows: const [Shadow(blurRadius: 4, color: Colors.black)],
      ),
    );

    _levelText = TextComponent(
      text: 'Level: 1',
      position: Vector2(size.x / 2, 40),
      anchor: Anchor.center,
      textRenderer: textPaint,
    );

    _timeText = TextComponent(
      text: 'Time: 0',
      position: Vector2(size.x / 2, 80),
      anchor: Anchor.center,
      textRenderer: textPaint
          .copyWith((style) => style.copyWith(color: Colors.yellowAccent)),
    );

    // Added Lives Text
    _livesText = TextComponent(
      text: 'Lives: 0',
      position: Vector2(size.x - 20, 40),
      anchor: Anchor.topRight,
      textRenderer: textPaint
          .copyWith((style) => style.copyWith(color: Colors.greenAccent)),
    );

    // Add to viewport immediately
    camera.viewport.add(_levelText);
    camera.viewport.add(_timeText);
    camera.viewport.add(_livesText);
  }

  Future<void> _initializeGame() async {
    // Clear existing components
    world.removeAll(world.children);

    // FIX: Reset Camera Position so tiles don't get culled immediately
    camera.viewfinder.position = Vector2(0, 0);

    await _changeEnvironment();

    // Add Components
    _tileManager = TileManager();
    _player = PlayerComponent();
    _waterWall = WaterWallComponent();

    // Order matters: Tiles first (back), Player (middle), Water (front)
    world.add(_tileManager);
    world.add(_player);
    world.add(_waterWall);

    _startLevel(currentLevel);
  }

  String _getRandomMusic() {
    if (_musicTracks.isEmpty) return '';
    if (_recentlyPlayed.length >= _musicTracks.length - 1) {
      _recentlyPlayed.clear();
    }
    List<String> available =
        _musicTracks.where((t) => !_recentlyPlayed.contains(t)).toList();
    if (available.isEmpty) available = List.from(_musicTracks);

    String selected = available[Random().nextInt(available.length)];
    _recentlyPlayed.add(selected);
    return selected;
  }

  Future<void> _changeEnvironment() async {
    if (_currentParallax != null) _currentParallax!.removeFromParent();
    if (_darkOverlay != null) _darkOverlay!.removeFromParent();

    int bgIndex = Random().nextInt(11) + 1;
    try {
      _currentParallax = await loadParallaxComponent(
        [ParallaxImageData('Background/l-bg$bgIndex.png')],
        baseVelocity: Vector2(0, -15),
        repeat: ImageRepeat.repeatY,
        fill: LayerFill.width,
      );
      _darkOverlay = RectangleComponent(
        size: size,
        paint: Paint()..color = Colors.black.withOpacity(0.3),
        priority: -9,
      );

      camera.backdrop.add(_currentParallax!);
      camera.backdrop.add(_darkOverlay!);
    } catch (e) {
      debugPrint('BG Load Error: $e');
      camera.backdrop.add(RectangleComponent(
          size: size, paint: Paint()..color = Colors.blueGrey));
    }

    if (_musicTracks.isNotEmpty) {
      try {
        // Force stop if playing to clear the MediaPlayer state
        if (FlameAudio.bgm.isPlaying) {
          await FlameAudio.bgm.stop();
        }

        // Add a tiny delay to let the Android native player release the 'DrmState'
        await Future.delayed(const Duration(milliseconds: 100));

        String track = _getRandomMusic();
        await FlameAudio.bgm.play(track, volume: 0.5);
      } catch (e) {
        debugPrint('Audio Error: $e');
      }
    }
  }

  void _startLevel(int level) {
    currentLevel = level;
    timeSurvived = 0;
    collectablesCount = 0; // Reset lives on new level start

    double extraTime = (level - 1) * 5.0;
    if (level > 25) extraTime = (24 * 5.0) + ((level - 25) * 10.0);
    levelGoalTime = 30.0 + extraTime;
    waterSpeed = 40.0 + (level * 3.0);

    isGameOver = false;
    resumeEngine();
  }

  void restartLevel() async {
    isGameOver = false;
    overlays.remove('GameOverMenu');
    overlays.remove('LevelCompleteMenu');
    overlays.remove('QuizMenu'); // Ensure Quiz is removed

    await _initializeGame();

    resumeEngine();
  }

  void startQuiz() {
    overlays.remove('LevelCompleteMenu');
    overlays.add('QuizMenu');
  }

  void nextLevel() async {
    GameManager().completeLevel(currentLevel);
    GameManager().advanceToNextLevel();
    currentLevel++;

    overlays.remove('LevelCompleteMenu');
    overlays.remove('QuizMenu'); // Ensure Quiz is removed

    await _initializeGame();

    resumeEngine();
  }

  void collectItem() {
    collectablesCount++;
  }

  // New visual effect when a life is used to save the player
  void showLifeSavedEffect() {
    // Just a simple floating text effect
    final textPaint = TextPaint(
      style: const TextStyle(
        color: Colors.redAccent,
        fontSize: 40,
        fontWeight: FontWeight.bold,
        shadows: [Shadow(blurRadius: 4, color: Colors.black)],
      ),
    );

    final lifeMsg = TextComponent(
      text: '-1 Life!',
      // Use screen coordinates (Viewport) to ensure visibility
      position: Vector2(size.x / 2, size.y / 2 - 100),
      anchor: Anchor.center,
      textRenderer: textPaint,
      priority: 20,
    );

    // Add to VIEWPORT instead of viewfinder/world to prevent it moving with camera
    camera.viewport.add(lifeMsg);

    // Manual simple timer to remove the text
    final timer = TimerComponent(
      period: 1.0,
      removeOnFinish: true,
      onTick: () {
        lifeMsg.removeFromParent();
      },
    );
    camera.viewport.add(timer);
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (isGameOver) return;

    timeSurvived += dt;

    // Feature 2: Gradually increase water speed
    // Increase speed by 2.0 units per second to maintain thrill
    waterSpeed += 7.5 * dt;

    // Score is now exactly equal to seconds survived
    score = timeSurvived.toInt();

    // SAFE ACCESS TO HUD
    if (isMounted && camera.viewport.children.contains(_timeText)) {
      // Just showing raw seconds now
      _timeText.text =
          "${GameManager().getTrans('Time')}: $score / ${levelGoalTime.toInt()}";
      _levelText.text = "${GameManager().getTrans('Level')}: $currentLevel";

      // FIX: TRANSLATED LIVES TEXT
      String livesLabel = GameManager().getTrans('Lives');
      _livesText.text = '$livesLabel: $collectablesCount';
    }

    // Camera Tracking (Up AND Down)
    if (_player.isMounted) {
      // We removed the 'if' check so it follows the player in both directions
      double targetY = _player.position.y - 200;
      camera.viewfinder.position = Vector2(0, targetY);
    }

    if (timeSurvived >= levelGoalTime) {
      gameLevelComplete();
    }
  }

  void gameLevelComplete() {
    if (isGameOver) return;
    isGameOver = true;
    pauseEngine();
    FlameAudio.bgm.stop();
    GameManager().updateScores(score + 10, score);
    overlays.add('LevelCompleteMenu');
  }

  void gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    pauseEngine();
    FlameAudio.bgm.stop();
    GameManager().updateScores(score, score);
    overlays.add('GameOverMenu');
  }

  // --- PUBLIC INPUT HANDLERS ---
  void onLeftPressed() {
    if (!isGameOver && _player.isMounted) _player.moveLeft();
  }

  void onRightPressed() {
    if (!isGameOver && _player.isMounted) _player.moveRight();
  }

  void onJumpPressed() {
    if (!isGameOver && _player.isMounted) _player.jump();
  }

  void onStopMove() {
    if (!isGameOver && _player.isMounted) _player.stopMove();
  }

  @override
  void onRemove() {
    FlameAudio.bgm.stop();
    super.onRemove();
  }
}

// ============================================================================
// 2. PLAYER COMPONENT
// ============================================================================
class PlayerComponent extends SpriteAnimationGroupComponent<PlayerState>
    with HasGameReference<FloodEscapeGame>, CollisionCallbacks {
  Vector2 velocity = Vector2.zero();
  bool isOnGround = false;
  // FIX: Added explicit flag for Platform collision
  bool isOnPlatform = false;

  String charType = 'Boy';
  late RectangleHitbox hitbox;

  // Double Jump Logic
  int jumpCount = 0;
  final int maxJumps = 2; // Allow double jump

  // Manual Blink State
  bool _isBlinking = false;
  double _blinkTimer = 0.0;

  PlayerComponent() : super(size: Vector2(48, 64), anchor: Anchor.center);

  @override
  Future<void> onLoad() async {
    String rawChar = GameManager().selectedCharacter;

    if (rawChar == 'Boy') {
      charType = 'Boy';
    } else {
      charType = 'Girl';
    }

    final running = await _loadAnim('Running', 5);
    final jumping = await _loadAnim('jump', 4);
    final death = await _loadAnim('death', 3);
    final idle = await _loadAnim('idle', 1);

    animations = {
      PlayerState.running: running,
      PlayerState.jumping: jumping,
      PlayerState.dead: death,
      PlayerState.idle: idle,
    };
    current = PlayerState.idle;

    hitbox = RectangleHitbox(size: Vector2(30, 50), position: Vector2(9, 14));
    add(hitbox);

    reset();
  }

  Future<SpriteAnimation> _loadAnim(String action, int amount) async {
    try {
      final spriteImage =
          await game.images.load('Player/$charType/$action.png');
      final spriteSheet = SpriteAnimationData.sequenced(
        amount: amount,
        stepTime: 0.1,
        textureSize:
            Vector2(spriteImage.width / amount, spriteImage.height.toDouble()),
      );
      return SpriteAnimation.fromFrameData(spriteImage, spriteSheet);
    } catch (e) {
      // Prevents crash if asset missing
      return SpriteAnimation.spriteList([], stepTime: 1);
    }
  }

  void reset() {
    position = Vector2(0, 50); // Start above first tile
    velocity = Vector2.zero();
    current = PlayerState.jumping;
    isOnGround = false;
    isOnPlatform = false;
    jumpCount = 0;
    _isBlinking = false;
    paint.color = paint.color.withOpacity(1.0);
    if (scale.x < 0) flipHorizontally();
  }

  void moveLeft() {
    velocity.x = -game.moveSpeed;
    if (scale.x > 0) flipHorizontally();
    if (isOnGround) current = PlayerState.running;
  }

  void moveRight() {
    velocity.x = game.moveSpeed;
    if (scale.x < 0) flipHorizontally();
    if (isOnGround) current = PlayerState.running;
  }

  void stopMove() {
    velocity.x = 0;
    if (isOnGround) current = PlayerState.idle;
  }

  void jump() {
    if (jumpCount < maxJumps) {
      velocity.y = game.jumpForce;
      jumpCount++;
      isOnGround = false;
      isOnPlatform = false; // Detach from platform on jump
      current = PlayerState.jumping;
    }
  }

  // Visual Blink Effect - Manual Implementation
  void blink() {
    _isBlinking = true;
    _blinkTimer = 0.0;
  }

  @override
  void update(double dt) {
    super.update(dt);

    // --- Physics ---
    // Apply Gravity ONLY if not on ground (Floor or Platform)
    if (!isOnGround && !isOnPlatform) {
      velocity.y += game.gravity * dt;
    }

    position += velocity * dt;

    double limit = game.size.x / 2;
    if (position.x > limit) position.x = -limit;
    if (position.x < -limit) position.x = limit;

    // --- Ground Level Check ---
    double groundLevel = game.size.y - 96; // This is the invisible floor

    // Only reset isOnGround if we are NOT on a platform
    if (!isOnPlatform) {
      if (position.y >= groundLevel) {
        // We hit the very bottom floor (unlikely in flood game, but safety net)
        // Actually, in Flood Escape, bottom is death usually, but let's keep logic consistent
        // If we want bottom to be death, we remove this.
        // But code had it, so I keep it as safety.
      } else {
        isOnGround = false;
        if (current != PlayerState.dead) current = PlayerState.jumping;
      }
    }

    // --- Water Collision ---
    if (game.world.contains(game._waterWall)) {
      // Check if player is submerged in water
      if (position.y > game._waterWall.position.y + 75) {
        if (game.collectablesCount > 0 && !_isBlinking) {
          // Extra Life Save Logic for Water Hazard
          // Bounce player up slightly to save them
          velocity.y = game.jumpForce * 1.5;
          game.collectablesCount--;
          blink();
          game.showLifeSavedEffect();
        } else if (!_isBlinking) {
          // Only die if not blinking (invincible)
          game.gameOver();
        }
      }
    }

    // --- Manual Blink Logic ---
    if (_isBlinking) {
      _blinkTimer += dt;
      if (_blinkTimer < 1.5) {
        // Blink for 1.5 seconds
        // Toggle opacity roughly every 0.1s
        double t = _blinkTimer * 10;
        bool visible = t.toInt() % 2 == 0;
        paint.color = paint.color.withOpacity(visible ? 1.0 : 0.2);
      } else {
        _isBlinking = false;
        paint.color = paint.color.withOpacity(1.0);
      }
    }
  }

  @override
  void onCollision(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollision(intersectionPoints, other);

    if (other is TileComponent) {
      bool isFalling = velocity.y > 0;
      // Increased tolerance for landing detection
      bool isAbove = (position.y + height / 2) < (other.position.y + 20);

      if (isFalling && isAbove) {
        isOnGround = true;
        isOnPlatform = true; // Mark as on platform
        jumpCount = 0; // Reset jumps on land
        velocity.y = 0;
        // Snap to top of tile
        position.y = (other.position.y - other.height / 2) - height / 2;

        if (velocity.x == 0)
          current = PlayerState.idle;
        else
          current = PlayerState.running;
      }
    }
  }

  // FIX: Handle walking off a platform
  @override
  void onCollisionEnd(PositionComponent other) {
    super.onCollisionEnd(other);
    if (other is TileComponent) {
      isOnPlatform = false;
      isOnGround = false;
      // Gravity will kick in on next update
    }
  }
}

// ============================================================================
// 3. TILE MANAGER
// ============================================================================
class TileManager extends Component with HasGameReference<FloodEscapeGame> {
  // Optimized Gaps for playability
  final double _minYGap = 100;
  final double _maxYGap = 160;
  double _lastSpawnY = 200;
  final List<Component> _activeItems = [];

  @override
  void onLoad() {
    reset();
  }

  void reset() {
    for (final t in _activeItems) t.removeFromParent();
    _activeItems.clear();

    _lastSpawnY = 200;

    // Initial Safe Platform
    _addTile(0, 200, 300);

    while (_lastSpawnY > -game.size.y) {
      _spawnNextTile();
    }
  }

  void _spawnNextTile() {
    double gap = _minYGap + Random().nextDouble() * (_maxYGap - _minYGap);
    _lastSpawnY -= gap;

    double screenHalf = game.size.x / 2;
    double xMin = -screenHalf + 70;
    double xMax = screenHalf - 70;
    double x = xMin + Random().nextDouble() * (xMax - xMin);

    double w = 100 + Random().nextDouble() * 60;

    _addTile(x, _lastSpawnY, w);

    // Spawn Collectable (Jacket) on tile with low chance
    if (Random().nextDouble() < 0.10) {
      // 10% chance
      _addCollectable(x, _lastSpawnY - 40); // 40px above tile
    }
  }

  void _addTile(double x, double y, double w) {
    final tile = TileComponent(position: Vector2(x, y), size: Vector2(w, 20));
    game.world.add(tile);
    _activeItems.add(tile);
  }

  void _addCollectable(double x, double y) {
    final jacket = CollectableComponent(position: Vector2(x, y));
    game.world.add(jacket);
    _activeItems.add(jacket);
  }

  @override
  void update(double dt) {
    super.update(dt);

    final double spawnThreshold =
        game.camera.viewfinder.position.y - game.size.y;
    while (_lastSpawnY > spawnThreshold) {
      _spawnNextTile();
    }

    final double cleanupThreshold =
        game.camera.viewfinder.position.y + game.size.y * 2;
    _activeItems.removeWhere((item) {
      if (item is PositionComponent && item.position.y > cleanupThreshold) {
        item.removeFromParent();
        return true;
      }
      return false;
    });
  }
}

class TileComponent extends PositionComponent
    with HasGameReference<FloodEscapeGame> {
  TileComponent({required Vector2 position, required Vector2 size})
      : super(position: position, size: size, anchor: Anchor.center);

  @override
  Future<void> onLoad() async {
    add(RectangleComponent(
      size: size,
      paint: Paint()..color = Colors.grey.shade800,
    ));
    add(RectangleComponent(
      size: Vector2(size.x, 5),
      paint: Paint()..color = Colors.greenAccent,
    ));
    add(RectangleHitbox(isSolid: true));
  }
}

class CollectableComponent extends SpriteComponent
    with HasGameReference<FloodEscapeGame>, CollisionCallbacks {
  double _bobTime = 0;
  final double _startY;

  CollectableComponent({required Vector2 position})
      : _startY = position.y,
        super(position: position, size: Vector2(40, 40), anchor: Anchor.center);

  @override
  Future<void> onLoad() async {
    try {
      sprite = await game.loadSprite('object to collect/jacket.png');
    } catch (e) {
      // Fallback
      add(RectangleComponent(
          size: size, paint: Paint()..color = Colors.orange));
    }
    add(RectangleHitbox());
  }

  @override
  void update(double dt) {
    super.update(dt);
    _bobTime += dt * 3;
    position.y = _startY + sin(_bobTime) * 5;
  }

  @override
  void onCollision(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollision(intersectionPoints, other);
    if (other is PlayerComponent) {
      game.collectItem();
      removeFromParent();
    }
  }
}

// ============================================================================
// 4. WATER WALL (FIXED POSITION & HORIZONTAL)
// ============================================================================
class WaterWallComponent extends PositionComponent
    with HasGameReference<FloodEscapeGame> {
  WaterWallComponent() : super(anchor: Anchor.topCenter, priority: 10);

  @override
  Future<void> onLoad() async {
    // Horizontal water wall: 3000 width x 500 height
    size = Vector2(750, 500);

    try {
      // Try loading sprite (ensure path matches assets)
      final sprite = await game.loadSprite('Water wall/water.png');
      add(SpriteComponent(
        sprite: sprite,
        size: size,
        anchor: Anchor
            .topCenter, // Anchor at top-center so position aligns with top edge
      ));
    } catch (e) {
      // Fallback if image fails
      add(RectangleComponent(
          size: size,
          paint: Paint()..color = Colors.blue.withOpacity(0.7),
          anchor: Anchor.topCenter));
    }
    reset();
  }

  void reset() {
    // Start position below the initial platform
    // Position at (0, 600). Since anchor is TopCenter, this means the TOP of the water is at Y=600.
    // Everything below Y=600 is water.
    position = Vector2(450, 600);
  }

  @override
  void update(double dt) {
    super.update(dt);
    // Water rises (Y decreases)
    position.y -= game.waterSpeed * dt;
  }
}

// ============================================================================
// 5. QUIZ MENU OVERLAY
// ============================================================================
class QuizMenu extends StatefulWidget {
  final FloodEscapeGame game;
  const QuizMenu({Key? key, required this.game}) : super(key: key);

  @override
  State<QuizMenu> createState() => _QuizMenuState();
}

class _QuizMenuState extends State<QuizMenu> {
  // CHANGED: Use a List/Queue for questions
  List<QuizQuestion> questionQueue = [];
  QuizQuestion? currentQuestion;
  int currentQuestionIndex = 0;

  // CONFIG: How many questions to ask per level
  final int questionsToAsk =
      2; // Change this number to increase/decrease questions

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

    if (selectedLang == 'Hindi' || selectedLang == 'हिंदी') {
      langCode = 'hin';
    } else if (selectedLang == 'Marathi' || selectedLang == 'मराठी') {
      langCode = 'mar';
    } else if (selectedLang == 'Punjabi' || selectedLang == 'ਪੰਜਾਬੀ') {
      langCode = 'pun';
    }

    String fileName = 'assets/quiz/quiz_$langCode.json';

    try {
      await _loadQuizFile(fileName);
    } catch (e) {
      debugPrint('Error loading $fileName: $e');
      try {
        await _loadQuizFile('assets/quiz/quiz_eng.json');
      } catch (e2) {
        if (mounted) {
          setState(() {
            // Fallback to a single hardcoded question if files fail
            questionQueue = [_getHardcodedFallbackQuestion()];
            currentQuestion = questionQueue.first;
            isLoading = false;
          });
        }
      }
    }
  }

  QuizQuestion _getHardcodedFallbackQuestion() {
    return QuizQuestion(
        id: 999,
        topic: 'Safety (Offline Mode)',
        question:
            'Which of the following is essential for a heatwave emergency kit?',
        options: {
          'A': 'Woolen clothes',
          'B': 'Water bottle and ORS',
          'C': 'Hot coffee',
          'D': 'Heavy blanket'
        },
        answer: 'B',
        explanation:
            'Hydration is key during a heatwave. Always carry water and ORS.');
  }

  Future<void> _loadQuizFile(String path) async {
    final String response = await rootBundle.loadString(path);
    final decoded = json.decode(response);
    final List<dynamic> data =
        (decoded is List) ? decoded : [];

    if (data.isNotEmpty) {
      final random = Random();
      final Set<int> pickedIndices = {};

      // Ensure we don't try to pick more questions than available
      int count = min(questionsToAsk, data.length);

      while (pickedIndices.length < count) {
        pickedIndices.add(random.nextInt(data.length));
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
          isLoading = false;
        });
      }
    } else {
      throw Exception('Empty Quiz File');
    }
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
      // Check if there are more questions in the queue
      if (currentQuestionIndex < questionQueue.length - 1) {
        // Load next question
        setState(() {
          currentQuestionIndex++;
          currentQuestion = questionQueue[currentQuestionIndex];
          answered = false;
          selectedOption = null;
          isCorrect = false;
        });
      } else {
        // All questions answered correctly -> Next Level
        widget.game.nextLevel();
      }
    } else {
      // Wrong answer -> Restart Level
      widget.game.restartLevel();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: Colors.yellowAccent));
    }

    if (currentQuestion == null) {
      return Center(
          child: ElevatedButton(
              onPressed: () => widget.game.nextLevel(),
              child: const Text('Skip Quiz (Error)')));
    }

    // Calculate progress (e.g., "Question 1 / 3")
    String progressText =
        'Question ${currentQuestionIndex + 1} / ${questionQueue.length}';

    return Center(
      child: Container(
        width: 320,
        height: 550, // Taller for portrait mode
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.95),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.blueAccent, width: 2),
        ),
        child: Column(
          children: [
            // Progress Indicator
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
              textAlign: TextAlign.center,
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
                        fontSize: 18,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),

            if (!answered) ...[
              Expanded(
                flex: 4,
                child: ListView(
                  children: currentQuestion!.options.entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: ElevatedButton(
                        onPressed: () => _checkAnswer(entry.key),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade800,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: Text('${entry.key}. ${entry.value}',
                            textAlign: TextAlign.center),
                      ),
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
                      Expanded(
                        child: SingleChildScrollView(
                          child: Text(
                            currentQuestion!.explanation,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 14),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: _handleCompletion,
                        style: ElevatedButton.styleFrom(
                            backgroundColor:
                                isCorrect ? Colors.green : Colors.orange,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 12)),
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

// ============================================================================
// 6. FLUTTER WIDGET WRAPPER
// ============================================================================
class FloodEscapeWidget extends StatefulWidget {
  const FloodEscapeWidget({super.key});

  @override
  State<FloodEscapeWidget> createState() => _FloodEscapeWidgetState();
}

class _FloodEscapeWidgetState extends State<FloodEscapeWidget> {
  late FloodEscapeGame _game;

  @override
  void initState() {
    super.initState();
    _game = FloodEscapeGame();
  }

  @override
  void dispose() {
    FlameAudio.bgm.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String? fontFamily =
        GameManager().selectedLanguage == 'English' ? 'PixelGame' : null;

    return Scaffold(
      body: Stack(
        children: [
          // 1. The Game Layer
          GameWidget(
            game: _game,
            overlayBuilderMap: {
              'QuizMenu': (context, FloodEscapeGame game) {
                return QuizMenu(game: game);
              },
              'GameOverMenu': (context, FloodEscapeGame game) => _buildMenu(
                  context,
                  'GAME OVER',
                  'Restart Level',
                  Colors.red,
                  () => game.restartLevel(),
                  fontFamily,
                  score: game.score),
              'LevelCompleteMenu': (context, FloodEscapeGame game) =>
                  _buildMenu(
                      context,
                      'LEVEL CLEAR!',
                      'Continue', // Changed text to indicate Quiz next
                      Colors.green,
                      () => game
                          .startQuiz(), // Calls startQuiz instead of nextLevel
                      fontFamily,
                      score: game.score),
            },
          ),

          // 2. CONTROLS (Simple Buttons)
          Positioned(
            bottom: 40,
            left: 20,
            child: Row(
              children: [
                _buildControlBtn(Icons.arrow_back, () {
                  _game.onLeftPressed();
                }, () {
                  _game.onStopMove();
                }),
                const SizedBox(width: 20),
                _buildControlBtn(Icons.arrow_forward, () {
                  _game.onRightPressed();
                }, () {
                  _game.onStopMove();
                }),
              ],
            ),
          ),
          Positioned(
            bottom: 40,
            right: 20,
            child: _buildJumpBtn(Icons.arrow_upward, () {
              _game.onJumpPressed();
            }),
          ),
        ],
      ),
    );
  }

  // Updated Menu Builder with Score Panel
  Widget _buildMenu(BuildContext context, String title, String btnText,
      Color color, VoidCallback onAction, String? font,
      {required int score}) {
    return Center(
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(30),
        decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color, width: 4),
            boxShadow: [
              BoxShadow(
                  color: color.withOpacity(0.5),
                  blurRadius: 20,
                  spreadRadius: 2)
            ]),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title,
                style: TextStyle(
                    color: color,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    fontFamily: font)),
            const SizedBox(height: 20),

            // --- HIGH SCORE PANEL ---
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
              decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white24)),
              child: Column(
                children: [
                  Text('SCORE',
                      style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontFamily: font)),
                  const SizedBox(height: 5),
                  Text('$score',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          fontFamily: font)),
                ],
              ),
            ),
            // ------------------------

            const SizedBox(height: 30),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: color,
                padding:
                    const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                elevation: 5,
              ),
              onPressed: onAction,
              child: Text(btnText,
                  style: TextStyle(
                      fontSize: 20, color: Colors.white, fontFamily: font)),
            ),
            const SizedBox(height: 15),
            TextButton(
              onPressed: () {
                FlameAudio.bgm.stop();
                Navigator.pop(context);
              },
              child: Text('Exit to Menu',
                  style: TextStyle(color: Colors.white70, fontFamily: font)),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildControlBtn(
      IconData icon, VoidCallback onPressed, VoidCallback onReleased) {
    return GestureDetector(
      onTapDown: (_) => onPressed(),
      onTapUp: (_) => onReleased(),
      onTapCancel: onReleased,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.5),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: Icon(icon, size: 40, color: Colors.black),
      ),
    );
  }

  Widget _buildJumpBtn(IconData icon, VoidCallback onPressed) {
    return GestureDetector(
      onTapDown: (_) => onPressed(),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.5),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: Icon(icon, size: 40, color: Colors.black),
      ),
    );
  }
}
