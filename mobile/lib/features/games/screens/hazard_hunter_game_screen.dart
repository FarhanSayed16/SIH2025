/// Phase 3.2.2: Hazard Hunter Game Screen
/// Spot the Danger - Tap hazards in images

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../utils/game_score_helper.dart';
import '../../../features/auth/providers/auth_provider.dart';

class HazardHunterGameScreen extends ConsumerStatefulWidget {
  final bool isGroupMode;
  final String? groupActivityId;
  final List<String>? studentIds;

  const HazardHunterGameScreen({
    super.key,
    this.isGroupMode = false,
    this.groupActivityId,
    this.studentIds,
  });

  @override
  ConsumerState<HazardHunterGameScreen> createState() =>
      _HazardHunterGameScreenState();
}

class _HazardHunterGameScreenState
    extends ConsumerState<HazardHunterGameScreen> {
  final GameService _gameService = GameService();

  List<HazardItem> _hazards = [];
  final Set<String> _foundHazards = {};
  int _score = 0;
  int _tapsCorrect = 0;
  int _tapsWrong = 0;
  bool _isLoading = true;
  bool _isGameOver = false;
  int _currentLevel = 1;
  String _currentDifficulty = 'easy';
  String? _currentImageUrl;

  // Phase 3.2.2: Fallback sample hazards if backend unavailable
  final List<HazardItem> _sampleHazards = [];

  @override
  void initState() {
    super.initState();
    _loadHazards();
  }

  Future<void> _loadHazards() async {
    setState(() {
      _isLoading = true;
      _foundHazards.clear();
      _score = 0;
      _tapsCorrect = 0;
      _tapsWrong = 0;
      _isGameOver = false;
    });

    try {
      // Phase 3.2.2: Load hazards from backend API
      final hazards = await _gameService.getHazards(
        level: _currentLevel,
        difficulty: _currentDifficulty,
      );

      if (hazards.isNotEmpty) {
        setState(() {
          _hazards = hazards;
          // Use first hazard's image URL (all hazards in a level share the same image)
          _currentImageUrl = hazards.first.imageUrl;
          _isLoading = false;
        });
      } else {
        // Fallback to sample hazards if backend returns none
        setState(() {
          _hazards = _sampleHazards;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading hazards: $e');
      // Fallback to sample hazards on error
      setState(() {
        _hazards = _sampleHazards;
        _isLoading = false;
      });
    }
  }

  Future<void> _onImageTap(TapDownDetails details, Size imageSize) async {
    if (_isGameOver) return;

    // Calculate tap position as percentage
    final RenderBox box = context.findRenderObject() as RenderBox;
    final localPosition = box.globalToLocal(details.globalPosition);

    // Find image container bounds
    final tapXPercent = (localPosition.dx / imageSize.width) * 100;
    final tapYPercent = (localPosition.dy / imageSize.height) * 100;

    // Phase 3.2.2: Check each hazard to see if tap is within its bounds
    bool found = false;
    HazardItem? tappedHazard;

    for (final hazard in _hazards) {
      if (_foundHazards.contains(hazard.id)) continue;

      final location = hazard.location;
      const tolerance = 5.0; // 5% tolerance

      // Check if tap is within hazard bounds
      if (tapXPercent >= (location.x - tolerance) &&
          tapXPercent <= (location.x + location.width + tolerance) &&
          tapYPercent >= (location.y - tolerance) &&
          tapYPercent <= (location.y + location.height + tolerance)) {
        found = true;
        tappedHazard = hazard;
        break;
      }
    }

    // Phase 3.2.2: Verify with backend if hazard found (optional - can skip for performance)
    if (found && tappedHazard != null) {
      try {
        final verification = await _gameService.verifyHazardTap(
          hazardId: tappedHazard.id,
          tapX: tapXPercent,
          tapY: tapYPercent,
        );

        if (verification != null && verification['isCorrect'] == true) {
          setState(() {
            _foundHazards.add(tappedHazard!.id);
            _score += tappedHazard.points;
            _tapsCorrect++;
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('✅ Found: ${tappedHazard.name}'),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 1),
              ),
            );
          }

          // Check if all hazards found
          if (_foundHazards.length == _hazards.length) {
            _finishGame();
          }
        } else {
          // Backend says tap was incorrect
          setState(() {
            _tapsWrong++;
            final penalty = tappedHazard?.penaltyPoints ?? 5;
            _score = (_score - penalty).clamp(0, double.infinity).toInt();
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('❌ Try again!'),
                backgroundColor: Colors.orange,
                duration: Duration(seconds: 1),
              ),
            );
          }
        }
      } catch (e) {
        // If backend verification fails, use client-side detection
        setState(() {
          _foundHazards.add(tappedHazard!.id);
          _score += tappedHazard.points;
          _tapsCorrect++;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✅ Found: ${tappedHazard.name}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 1),
            ),
          );
        }

        if (_foundHazards.length == _hazards.length) {
          _finishGame();
        }
      }
    } else {
      // Wrong tap
      setState(() {
        _tapsWrong++;
        _score = (_score - 5).clamp(0, double.infinity).toInt();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Try again!'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 1),
          ),
        );
      }
    }
  }

  Future<void> _finishGame() async {
    setState(() {
      _isGameOver = true;
    });

    // Get userId from auth provider
    final userId = ref.read(authProvider).user?.id;

    final gameScore = GameScore(
      userId: userId,
      gameType: 'hazard-hunter',
      score: _score,
      maxScore: _hazards.length * 10,
      level: _currentLevel,
      difficulty: 'easy',
      isGroupMode: widget.isGroupMode,
      groupActivityId: widget.groupActivityId,
      itemsCorrect: _tapsCorrect,
      itemsIncorrect: _tapsWrong,
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
        _showGameOverDialog(gameScore);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error submitting score: $e')),
        );
      }
    }
  }

  void _showGameOverDialog(GameScore? submittedScore) {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Hazards Found! 🎯'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Final Score: $_score',
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('✅ Correct Taps: $_tapsCorrect'),
            Text('❌ Wrong Taps: $_tapsWrong'),
            Text(
                '🔍 Hazards Found: ${_foundHazards.length}/${_hazards.length}'),
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
                _foundHazards.clear();
                _score = 0;
                _tapsCorrect = 0;
                _tapsWrong = 0;
                _isGameOver = false;
                _currentLevel++;
                // Phase 3.2.2: Progress difficulty
                if (_currentLevel > 3) {
                  _currentDifficulty = 'medium';
                }
                if (_currentLevel > 6) {
                  _currentDifficulty = 'hard';
                }
              });
              _loadHazards();
            },
            child: const Text('Next Level'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hazard Hunter'),
        actions: [
          if (!_isGameOver && _foundHazards.length == _hazards.length)
            IconButton(
              icon: const Icon(Icons.check_circle),
              onPressed: _finishGame,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Score Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.red[50],
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
                                  color: Colors.red[700],
                                ),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Text('Found',
                              style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            '${_foundHazards.length}/${_hazards.length}',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Text('Level',
                              style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            '$_currentLevel',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Game Image with Tap Detection
                Expanded(
                  child: Center(
                    child: GestureDetector(
                      onTapDown: (details) {
                        // Get actual image size
                        final screenSize = MediaQuery.of(context).size;
                        _onImageTap(details, screenSize);
                      },
                      child: Stack(
                        children: [
                          // Phase 3.2.2: Background image from backend
                          Container(
                            width: double.infinity,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              image: _currentImageUrl != null &&
                                      _currentImageUrl!.isNotEmpty
                                  ? DecorationImage(
                                      image: NetworkImage(_currentImageUrl!),
                                      fit: BoxFit.cover,
                                      onError: (exception, stackTrace) {
                                        // Fallback to placeholder if image fails to load
                                      },
                                    )
                                  : null,
                            ),
                            child: _currentImageUrl == null ||
                                    _currentImageUrl!.isEmpty
                                ? const Center(
                                    child: Text(
                                      'Tap on hazards!',
                                      style: TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                        shadows: [
                                          Shadow(
                                            offset: Offset(2, 2),
                                            blurRadius: 4,
                                            color: Colors.black,
                                          ),
                                        ],
                                      ),
                                    ),
                                  )
                                : null,
                          ),

                          // Phase 3.2.2: Mark found hazards
                          ..._hazards.map((hazard) {
                            if (!_foundHazards.contains(hazard.id)) {
                              return const SizedBox.shrink();
                            }

                            return Positioned(
                              left: MediaQuery.of(context).size.width *
                                      hazard.location.x /
                                      100 -
                                  20,
                              top: MediaQuery.of(context).size.height *
                                  0.6 *
                                  hazard.location.y /
                                  100,
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.7),
                                  shape: BoxShape.circle,
                                  border:
                                      Border.all(color: Colors.green, width: 3),
                                ),
                                child: const Icon(Icons.check,
                                    color: Colors.white, size: 24),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                ),

                // Instructions
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue[50],
                  child: Column(
                    children: [
                      Text(
                        'Tap on hazards in the image',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Find all ${_hazards.length} hazards to complete the level',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
