/// Phase 3.2.3: Earthquake Shake Game Screen
/// Drop, Cover, Hold Challenge

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../utils/game_score_helper.dart';
import '../services/sound_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import 'dart:async';

class EarthquakeShakeGameScreen extends ConsumerStatefulWidget {
  final bool isGroupMode;
  final String? groupActivityId;
  final List<String>? studentIds;

  const EarthquakeShakeGameScreen({
    super.key,
    this.isGroupMode = false,
    this.groupActivityId,
    this.studentIds,
  });

  @override
  ConsumerState<EarthquakeShakeGameScreen> createState() =>
      _EarthquakeShakeGameScreenState();
}

class _EarthquakeShakeGameScreenState
    extends ConsumerState<EarthquakeShakeGameScreen>
    with SingleTickerProviderStateMixin {
  final GameService _gameService = GameService();
  final GameSoundService _soundService = GameSoundService();

  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  int _countdown = 5;
  bool _isCountingDown = true;
  bool _isShaking = false;
  bool _isGameOver = false;

  final List<String> _sequence = ['Drop', 'Cover', 'Hold'];
  final List<String> _userSequence = [];
  int _currentStep = 0;
  int _score = 100;
  int _startTime = 0;

  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();

    // Setup shake animation
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );

    _shakeAnimation = Tween<double>(begin: 0, end: 10).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.easeInOut),
    );

    _startCountdown();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() {
          _countdown--;
        });

        // Phase 3.2.3: Haptic feedback and sound
        HapticFeedback.mediumImpact();
        _soundService.playSuccess();
      } else {
        timer.cancel();
        setState(() {
          _isCountingDown = false;
          _isShaking = true;
          _startTime = DateTime.now().millisecondsSinceEpoch;
        });
        // Phase 3.2.3: Play earthquake sound
        _soundService.playError(); // Use error sound for earthquake effect
        _startShakeAnimation();
      }
    });
  }

  void _startShakeAnimation() {
    _shakeController.repeat(reverse: true);

    // Stop shaking after 10 seconds
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() {
          _isShaking = false;
        });
        _shakeController.stop();
        _shakeController.reset();
        _finishGame();
      }
    });
  }

  void _handleButtonPress(String action) {
    if (_isCountingDown || _isGameOver) return;

    setState(() {
      if (_currentStep < _sequence.length) {
        final expected = _sequence[_currentStep];

        if (action == expected) {
          _userSequence.add(action);
          _currentStep++;

          // Phase 3.2.3: Success feedback with sound
          HapticFeedback.heavyImpact();
          _soundService.playSuccess();

          if (_currentStep >= _sequence.length) {
            // Completed correctly
            _soundService.playLevelComplete();
            _finishGame();
          }
        } else {
          // Wrong action - penalty
          _score -= 20;
          _score = _score.clamp(0, 100);

          // Phase 3.2.3: Error feedback with sound
          HapticFeedback.lightImpact();
          _soundService.playError();

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('❌ Wrong! Expected: $expected'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 1),
            ),
          );
        }
      }
    });
  }

  Future<void> _finishGame() async {
    if (_isGameOver) return;

    setState(() {
      _isGameOver = true;
      _isShaking = false;
    });

    _shakeController.stop();
    _countdownTimer?.cancel();

    final endTime = DateTime.now().millisecondsSinceEpoch;
    final timeTaken = ((endTime - _startTime) / 1000).round();

    // Get userId from auth provider
    final userId = ref.read(authProvider).user?.id;

    final gameScore = GameScore(
      userId: userId,
      gameType: 'earthquake-shake',
      score: _score,
      maxScore: 100,
      level: 1,
      difficulty: 'easy',
      isGroupMode: widget.isGroupMode,
      groupActivityId: widget.groupActivityId,
      itemsCorrect: _userSequence.length,
      itemsIncorrect: _sequence.length - _userSequence.length,
      timeTaken: timeTaken,
      completedAt: DateTime.now(),
    );

    try {
      // Phase: Games Scoring & Preparedness Integration
      // Use unified GameScoreHelper to submit score and update all related state
      final gameScoreHelper = GameScoreHelper(
        gameService: _gameService,
        ref: ref,
        context: context,
      );

      await gameScoreHelper.submitScoreAndUpdate(gameScore);

      if (mounted) {
        _showGameOverDialog(gameScore, timeTaken);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting score: $e')),
        );
      }
    }
  }

  void _showGameOverDialog(GameScore? submittedScore, int timeTaken) {
    final completedCorrectly = _userSequence.length == _sequence.length;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(completedCorrectly ? 'Great Job! 🎉' : 'Keep Practicing!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Final Score: $_score',
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('Time: ${timeTaken}s'),
            Text(
                'Steps Completed: ${_userSequence.length}/${_sequence.length}'),
            if (submittedScore != null && submittedScore.xpEarned > 0)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  'XP Earned: ${submittedScore.xpEarned}',
                  style: TextStyle(
                      color: Colors.green[700], fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _countdown = 5;
                _isCountingDown = true;
                _isShaking = false;
                _isGameOver = false;
                _userSequence.clear();
                _currentStep = 0;
                _score = 100;
              });
              _startCountdown();
            },
            child: const Text('Play Again'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _countdownTimer?.cancel();
    // Don't dispose singleton GameSoundService - it's shared across all game screens
    // The service will handle its own cleanup when the app closes
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Earthquake Shake'),
      ),
      body: AnimatedBuilder(
        animation: _shakeAnimation,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(
              _isShaking ? _shakeAnimation.value : 0,
              _isShaking ? _shakeAnimation.value * 0.5 : 0,
            ),
            child: Column(
              children: [
                // Score Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.orange[50],
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          Text('Score',
                              style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            '$_score',
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange[700],
                                ),
                          ),
                        ],
                      ),
                      if (_isCountingDown)
                        Column(
                          children: [
                            Text('Get Ready!',
                                style: Theme.of(context).textTheme.bodySmall),
                            Text(
                              '$_countdown',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red[700],
                                  ),
                            ),
                          ],
                        ),
                      if (!_isCountingDown && !_isGameOver)
                        Column(
                          children: [
                            Text('Step',
                                style: Theme.of(context).textTheme.bodySmall),
                            Text(
                              '${_currentStep + 1}/${_sequence.length}',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ],
                        ),
                    ],
                  ),
                ),

                // Game Area
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_isCountingDown)
                          Column(
                            children: [
                              Icon(
                                Icons.warning,
                                size: 100,
                                color: Colors.orange[700],
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Earthquake Starting!',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          )
                        else if (_isShaking && !_isGameOver)
                          Column(
                            children: [
                              Icon(
                                Icons.vibration,
                                size: 100,
                                color: Colors.red[700],
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'EARTHQUAKE!',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.red[700],
                                    ),
                              ),
                              const SizedBox(height: 32),
                              if (_currentStep < _sequence.length)
                                Text(
                                  'Tap: ${_sequence[_currentStep]}',
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                            ],
                          )
                        else if (_isGameOver)
                          const Text('Game Over'),
                      ],
                    ),
                  ),
                ),

                // Action Buttons
                if (!_isCountingDown && _isShaking && !_isGameOver)
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _ActionButton(
                          label: 'DROP',
                          icon: Icons.arrow_downward,
                          color: Colors.blue,
                          onPressed: () => _handleButtonPress('Drop'),
                        ),
                        _ActionButton(
                          label: 'COVER',
                          icon: Icons.security,
                          color: Colors.orange,
                          onPressed: () => _handleButtonPress('Cover'),
                        ),
                        _ActionButton(
                          label: 'HOLD',
                          icon: Icons.lock,
                          color: Colors.green,
                          onPressed: () => _handleButtonPress('Hold'),
                        ),
                      ],
                    ),
                  ),

                // Instructions
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue[50],
                  child: Column(
                    children: [
                      if (_isCountingDown)
                        Text(
                          'Get ready! Follow the sequence when shaking starts.',
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        )
                      else if (_isShaking)
                        Text(
                          'Remember: Drop, Cover, Hold!',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                          textAlign: TextAlign.center,
                        )
                      else
                        const SizedBox.shrink(),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 32),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
