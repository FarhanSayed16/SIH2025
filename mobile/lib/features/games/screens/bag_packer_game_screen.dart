/// Phase 3.2.1: Bag Packer Game Screen
/// Emergency Kit Game - Drag items into bag

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game_models.dart';
import '../services/game_service.dart';
import '../services/group_game_service.dart';
import '../services/offline_game_service.dart';
import '../services/sound_service.dart';
import '../widgets/group_mode_toggle.dart';
import '../widgets/student_assignment_dialog.dart';
import '../widgets/group_score_display.dart';
import '../utils/game_score_helper.dart';
import '../../../features/auth/providers/auth_provider.dart';
import 'dart:async';

class BagPackerGameScreen extends ConsumerStatefulWidget {
  final bool isGroupMode;
  final String? groupActivityId;
  final List<String>? studentIds; // For group mode

  const BagPackerGameScreen({
    super.key,
    this.isGroupMode = false,
    this.groupActivityId,
    this.studentIds,
  });

  @override
  ConsumerState<BagPackerGameScreen> createState() =>
      _BagPackerGameScreenState();
}

class _BagPackerGameScreenState extends ConsumerState<BagPackerGameScreen>
    with SingleTickerProviderStateMixin {
  final GameService _gameService = GameService();
  final GroupGameService _groupGameService = GroupGameService();
  final OfflineGameService _offlineGameService = OfflineGameService();
  final GameSoundService _soundService = GameSoundService();

  List<GameItem> _availableItems = [];
  final List<GameItem> _itemsInBag = [];
  int _score = 0;
  int _correctCount = 0;
  int _incorrectCount = 0;
  bool _isLoading = true;
  bool _isGameOver = false;

  // Phase 3.2.1: Time Challenge (Framework ready - can be enabled via UI toggle)
  final bool _timeChallengeEnabled = false;
  final int _timeRemaining = 60;
  Timer? _timer;
  final bool _isTimeUp = false;

  // Phase 3.2.1: Animations
  late AnimationController _animationController;

  // Phase 3.2.4: Group Mode state
  bool _isGroupMode = false;
  String? _currentGroupActivityId;
  String? _currentStudentId; // For turn-based gameplay
  List<Map<String, dynamic>> _availableStudents = [];
  Map<String, dynamic>? _groupScores;

  @override
  void initState() {
    super.initState();

    // Phase 3.2.1: Setup animation controller
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _animationController.repeat(reverse: true);

    _isGroupMode = widget.isGroupMode;
    _currentGroupActivityId = widget.groupActivityId;
    _loadGameItems();
    if (_isGroupMode) {
      _loadStudents();
    }

    // Phase 3.2.5: Try to restore game state if available
    _tryRestoreGameState();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _timer?.cancel();
    // Don't dispose singleton GameSoundService - it's shared across all game screens
    // The service will handle its own cleanup when the app closes
    super.dispose();
  }

  // Phase 3.2.1: Start time challenge (can be enabled via UI button in future)
  // Currently disabled, can be enabled by setting _timeChallengeEnabled = true in initState or via settings

  Future<void> _tryRestoreGameState() async {
    try {
      // Check for saved game state
      final savedState =
          await _offlineGameService.getGameState('bag-packer_current');
      if (savedState != null && mounted) {
        // Show dialog to restore or start fresh
        final shouldRestore = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Resume Game?'),
            content: const Text(
                'You have an unfinished game. Would you like to resume?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Start Fresh'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Resume'),
              ),
            ],
          ),
        );

        if (shouldRestore == true && mounted) {
          // Restore game state
          final state = savedState['state'] as Map<String, dynamic>?;
          if (state != null) {
            setState(() {
              _score = state['score'] as int? ?? 0;
              _correctCount = state['correctCount'] as int? ?? 0;
              _incorrectCount = state['incorrectCount'] as int? ?? 0;
              // Note: Would need to restore items lists too
            });
          }
        }
      }
    } catch (e) {
      print('⚠️ Error restoring game state: $e');
    }
  }

  Future<void> _saveGameState() async {
    try {
      await _offlineGameService.saveGameState(
        gameType: 'bag-packer',
        gameState: {
          'score': _score,
          'correctCount': _correctCount,
          'incorrectCount': _incorrectCount,
          'itemsInBag': _itemsInBag.map((item) => item.toJson()).toList(),
          'availableItems':
              _availableItems.map((item) => item.toJson()).toList(),
        },
        gameId: 'bag-packer_current',
      );
    } catch (e) {
      print('⚠️ Error saving game state: $e');
    }
  }

  Future<void> _loadStudents() async {
    try {
      // Get students from teacher provider or class
      final authState = ref.read(authProvider);
      final user = authState.user;

      if (user?.classId != null) {
        // Load students from class
        // This would typically come from teacher service
        // For now, we'll use an empty list and let teacher assign manually
        setState(() {
          _availableStudents = [];
        });
      }
    } catch (e) {
      print('Error loading students: $e');
    }
  }

  Future<void> _toggleGroupMode(bool value) async {
    setState(() {
      _isGroupMode = value;
    });

    if (_isGroupMode && _currentGroupActivityId == null) {
      // Start a new group game session
      await _startGroupSession();
    }
  }

  Future<void> _startGroupSession() async {
    try {
      final authState = ref.read(authProvider);
      final user = authState.user;

      if (user?.classId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('No class assigned. Group mode requires a class.')),
        );
        setState(() {
          _isGroupMode = false;
        });
        return;
      }

      final session = await _groupGameService.startGroupGameSession(
        classId: user!.classId!,
        gameType: 'bag-packer',
      );

      setState(() {
        _currentGroupActivityId =
            session['_id']?.toString() ?? session['id']?.toString();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error starting group session: $e')),
      );
      setState(() {
        _isGroupMode = false;
      });
    }
  }

  Future<String?> _assignStudent() async {
    if (_availableStudents.isEmpty) {
      // Show dialog to manually enter student ID or scan QR
      // For now, return null and let teacher handle it
      return null;
    }

    final selectedId = await showDialog<String>(
      context: context,
      builder: (context) => StudentAssignmentDialog(
        students: _availableStudents,
        selectedStudentId: _currentStudentId,
        gameType: 'bag-packer',
      ),
    );

    return selectedId;
  }

  Future<void> _loadGameItems() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final items = await _gameService.getGameItems(gameType: 'bag-packer');

      // Shuffle items for random order
      items.shuffle();

      setState(() {
        _availableItems = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading game items: $e')),
        );
      }
    }
  }

  void _onItemDropped(GameItem item) {
    if (_isTimeUp || _isGameOver) return;

    setState(() {
      _availableItems.remove(item);
      _itemsInBag.add(item);

      // Update score
      _score += item.points;
      if (item.isCorrect) {
        _correctCount++;
        // Phase 3.2.1: Play success sound
        _soundService.playSuccess();
        // Phase 3.2.1: Pulse animation
        _animationController.forward(from: 0.0);
      } else {
        _incorrectCount++;
        // Phase 3.2.1: Play error sound
        _soundService.playError();
      }

      // Phase 3.2.5: Save game state after each action
      _saveGameState();

      // Show feedback with animation
      if (item.feedbackMessage != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              item.feedbackMessage!,
              style: TextStyle(
                color: item.isCorrect ? Colors.green : Colors.orange,
                fontWeight: FontWeight.bold,
              ),
            ),
            duration: const Duration(seconds: 2),
            backgroundColor:
                item.isCorrect ? Colors.green[50] : Colors.orange[50],
          ),
        );
      }
    });
  }

  void _removeItemFromBag(GameItem item) {
    setState(() {
      _itemsInBag.remove(item);
      _availableItems.add(item);

      // Update score
      _score -= item.points;
      if (item.isCorrect) {
        _correctCount--;
      } else {
        _incorrectCount--;
      }
    });
  }

  Future<void> _finishGame() async {
    if (_itemsInBag.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please pack at least one item!')),
      );
      return;
    }

    // Phase 3.2.4: In group mode, assign student first
    if (_isGroupMode && _currentStudentId == null) {
      final studentId = await _assignStudent();
      if (studentId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please assign a student to record this turn.')),
        );
        return;
      }
      setState(() {
        _currentStudentId = studentId;
      });
    }

    setState(() {
      _isGameOver = true;
    });

    // Calculate max score (all correct items)
    final maxScore = _availableItems
        .where((item) => item.isCorrect)
        .fold<int>(0, (sum, item) => sum + item.points);
    final totalMaxScore = maxScore + _score;

    // Get userId from auth provider
    final userId = ref.read(authProvider).user?.id;

    // Submit score
    final gameScore = GameScore(
      userId: userId,
      gameType: 'bag-packer',
      score: _score,
      maxScore: totalMaxScore,
      level: 1,
      difficulty: 'easy',
      isGroupMode: _isGroupMode,
      groupActivityId: _currentGroupActivityId,
      itemsCorrect: _correctCount,
      itemsIncorrect: _incorrectCount,
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

      // Phase 3.2.4: Record turn in group activity
      if (_isGroupMode &&
          _currentGroupActivityId != null &&
          _currentStudentId != null) {
        try {
          await _groupGameService.recordGroupGameTurn(
            activityId: _currentGroupActivityId!,
            studentId: _currentStudentId!,
            score: _score,
            gameData: {
              'itemsCorrect': _correctCount,
              'itemsIncorrect': _incorrectCount,
            },
          );

          // Get updated group scores
          final groupScores = await _groupGameService
              .getGroupGameScores(_currentGroupActivityId!);
          setState(() {
            _groupScores = groupScores;
          });
        } catch (groupError) {
          print('Error recording group turn: $groupError');
          // Continue anyway - individual score is saved
        }
      }

      // Phase 3.2.5: Clear saved game state after successful completion
      await _offlineGameService.deleteGameState('bag-packer_current');

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
        title: const Text('Game Complete! 🎉'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Final Score: $_score',
                  style: const TextStyle(
                      fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              Text('✅ Correct Items: $_correctCount'),
              Text('❌ Wrong Items: $_incorrectCount'),
              if (submittedScore != null && submittedScore.xpEarned > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    'XP Earned: ${submittedScore.xpEarned}',
                    style: TextStyle(
                        color: Colors.green[700], fontWeight: FontWeight.bold),
                  ),
                ),
              // Phase 3.2.4: Show group scores if in group mode
              if (_isGroupMode && _groupScores != null) ...[
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),
                GroupScoreDisplay(
                  groupScores: _groupScores!,
                  participants:
                      (_groupScores!['participants'] as List<dynamic>?)
                              ?.map((p) => p as Map<String, dynamic>)
                              .toList() ??
                          [],
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (!_isGroupMode) {
                Navigator.pop(context);
              } else {
                // In group mode, reset for next turn
                setState(() {
                  _itemsInBag.clear();
                  _score = 0;
                  _correctCount = 0;
                  _incorrectCount = 0;
                  _isGameOver = false;
                  _currentStudentId = null; // Reset for next student
                });
                _loadGameItems();
              }
            },
            child: Text(_isGroupMode ? 'Next Turn' : 'Done'),
          ),
          if (!_isGroupMode)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() {
                  _itemsInBag.clear();
                  _score = 0;
                  _correctCount = 0;
                  _incorrectCount = 0;
                  _isGameOver = false;
                });
                _loadGameItems();
              },
              child: const Text('Play Again'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bag Packer'),
        actions: [
          // Phase 3.2.5: Offline indicator
          if (!_isLoading)
            FutureBuilder<Map<String, dynamic>>(
              future: _offlineGameService.getStorageStats(),
              builder: (context, snapshot) {
                final stats = snapshot.data ?? {};
                final pendingScores = stats['pendingScores'] as int? ?? 0;
                if (pendingScores > 0) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0),
                    child: IconButton(
                      icon: Stack(
                        children: [
                          const Icon(Icons.cloud_upload),
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.orange,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 16,
                                minHeight: 16,
                              ),
                              child: Text(
                                '$pendingScores',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ],
                      ),
                      onPressed: () {
                        // Show sync status
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('$pendingScores scores pending sync'),
                            action: SnackBarAction(
                              label: 'Sync Now',
                              onPressed: () {
                                // Trigger sync
                              },
                            ),
                          ),
                        );
                      },
                      tooltip: '$pendingScores scores pending sync',
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          if (!_isGameOver)
            IconButton(
              icon: const Icon(Icons.check_circle),
              onPressed: _finishGame,
              tooltip: 'Finish Game',
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Phase 3.2.1: Time Challenge Timer Display
                if (_timeChallengeEnabled && !_isGameOver)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color:
                        _timeRemaining > 10 ? Colors.blue[50] : Colors.red[50],
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.timer,
                          color: _timeRemaining > 10
                              ? Colors.blue[700]
                              : Colors.red[700],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Time: $_timeRemaining',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _timeRemaining > 10
                                ? Colors.blue[700]
                                : Colors.red[700],
                          ),
                        ),
                        if (_timeRemaining <= 10)
                          const Text(' ⚠️', style: TextStyle(fontSize: 20)),
                      ],
                    ),
                  ),

                // Phase 3.2.4: Group Mode Toggle
                if (widget.isGroupMode ||
                    ref.watch(authProvider).user?.role == 'teacher')
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: GroupModeToggle(
                      isGroupMode: _isGroupMode,
                      onChanged: _toggleGroupMode,
                      enabled: !_isGameOver,
                    ),
                  ),
                // Score Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue[50],
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          Text(
                            'Score',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            '$_score',
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue[700],
                                ),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '✅ Correct',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            '$_correctCount',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: Colors.green[700],
                                ),
                          ),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '❌ Wrong',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            '$_incorrectCount',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: Colors.red[700],
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Game Area
                Expanded(
                  child: Row(
                    children: [
                      // Available Items (Left Side)
                      Expanded(
                        flex: 2,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Text(
                                  'Available Items',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ),
                              Expanded(
                                child: GridView.builder(
                                  gridDelegate:
                                      const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 8,
                                    mainAxisSpacing: 8,
                                    childAspectRatio: 1.2,
                                  ),
                                  itemCount: _availableItems.length,
                                  itemBuilder: (context, index) {
                                    final item = _availableItems[index];
                                    return _DraggableGameItem(
                                      item: item,
                                      onDragStarted: () {},
                                      onDragEnd: () {},
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Bag (Right Side - Drop Zone)
                      Expanded(
                        flex: 1,
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.brown[50],
                            borderRadius: BorderRadius.circular(12),
                            border:
                                Border.all(color: Colors.brown[300]!, width: 3),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Row(
                                  children: [
                                    Icon(Icons.luggage,
                                        color: Colors.brown[700]),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Emergency Bag',
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.brown[700],
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: DragTarget<GameItem>(
                                  onWillAccept: (data) => true,
                                  onAccept: (item) {
                                    _onItemDropped(item);
                                  },
                                  builder:
                                      (context, candidateData, rejectedData) {
                                    final isDragTarget =
                                        candidateData.isNotEmpty;
                                    return Container(
                                      decoration: BoxDecoration(
                                        color: isDragTarget
                                            ? Colors.brown[100]
                                            : Colors.brown[50],
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: _itemsInBag.isEmpty
                                          ? Center(
                                              child: Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  Icon(
                                                    Icons.add_circle_outline,
                                                    size: 64,
                                                    color: Colors.brown[300],
                                                  ),
                                                  const SizedBox(height: 16),
                                                  Text(
                                                    'Drag items here!',
                                                    style: TextStyle(
                                                      color: Colors.brown[600],
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            )
                                          : ListView.builder(
                                              padding: const EdgeInsets.all(8),
                                              itemCount: _itemsInBag.length,
                                              itemBuilder: (context, index) {
                                                final item = _itemsInBag[index];
                                                return Card(
                                                  color: item.isCorrect
                                                      ? Colors.green[50]
                                                      : Colors.red[50],
                                                  margin: const EdgeInsets.only(
                                                      bottom: 8),
                                                  child: ListTile(
                                                    leading: Icon(
                                                      item.isCorrect
                                                          ? Icons.check_circle
                                                          : Icons.cancel,
                                                      color: item.isCorrect
                                                          ? Colors.green
                                                          : Colors.red,
                                                    ),
                                                    title: Text(item.name),
                                                    subtitle: Text(
                                                        '${item.points > 0 ? '+' : ''}${item.points} pts'),
                                                    trailing: IconButton(
                                                      icon: const Icon(
                                                          Icons.close),
                                                      onPressed: () =>
                                                          _removeItemFromBag(
                                                              item),
                                                      tooltip: 'Remove',
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _DraggableGameItem extends StatelessWidget {
  final GameItem item;
  final VoidCallback? onDragStarted;
  final VoidCallback? onDragEnd;

  const _DraggableGameItem({
    required this.item,
    this.onDragStarted,
    this.onDragEnd,
  });

  @override
  Widget build(BuildContext context) {
    return LongPressDraggable<GameItem>(
      data: item,
      feedback: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.blue, width: 2),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getItemIcon(item.name),
                size: 40,
                color: Colors.blue,
              ),
              const SizedBox(height: 4),
              Text(
                item.name,
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
      childWhenDragging: Container(
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey),
        ),
        child: const Center(
          child: Icon(Icons.drag_indicator, color: Colors.grey),
        ),
      ),
      onDragStarted: onDragStarted,
      onDragEnd: (_) => onDragEnd?.call(),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: item.isCorrect ? Colors.green[300]! : Colors.red[300]!,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getItemIcon(item.name),
              size: 32,
              color: item.isCorrect ? Colors.green[700] : Colors.red[700],
            ),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0),
              child: Text(
                item.name,
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (item.points != 10)
              Text(
                '${item.points > 0 ? '+' : ''}${item.points}',
                style: TextStyle(
                  fontSize: 10,
                  color: item.points > 0 ? Colors.green[700] : Colors.red[700],
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
      ),
    );
  }

  IconData _getItemIcon(String itemName) {
    final lowerName = itemName.toLowerCase();
    if (lowerName.contains('flashlight') || lowerName.contains('torch'))
      return Icons.flashlight_on;
    if (lowerName.contains('water') || lowerName.contains('bottle'))
      return Icons.water_drop;
    if (lowerName.contains('whistle')) return Icons.music_note;
    if (lowerName.contains('first aid') || lowerName.contains('aid kit'))
      return Icons.medical_services;
    if (lowerName.contains('phone') || lowerName.contains('mobile'))
      return Icons.phone;
    if (lowerName.contains('blanket')) return Icons.bed;
    if (lowerName.contains('batter')) return Icons.battery_charging_full;
    if (lowerName.contains('radio')) return Icons.radio;
    if (lowerName.contains('playstation') || lowerName.contains('ps5'))
      return Icons.videogame_asset;
    if (lowerName.contains('pizza')) return Icons.local_pizza;
    if (lowerName.contains('makeup')) return Icons.face;
    if (lowerName.contains('teddy') || lowerName.contains('bear'))
      return Icons.child_care;
    if (lowerName.contains('chocolate')) return Icons.cake;
    if (lowerName.contains('hair') || lowerName.contains('dryer'))
      return Icons.dry_cleaning;
    if (lowerName.contains('remote')) return Icons.settings_remote;
    if (lowerName.contains('game') || lowerName.contains('video'))
      return Icons.games;
    return Icons.inventory_2;
  }
}
