/// Games hub — B6 encoding, responsive cards, comics, external sims.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/design/design_system.dart';
import '../managers/game_manager.dart';
import 'language_selection_screen.dart';
import '../features/games/screens/punjab_safety_game.dart';
import '../features/games/screens/school_safety_quiz_game.dart';
import 'runner_setup_screen.dart';
import 'jumper_setup_screen.dart';
import '../features/games/screens/web_game_screen.dart';
import '../features/games/screens/fire_extinguisher_ar.dart';
import 'comic_reader_screen.dart';
import '../features/games/screens/earthquake_drill.dart';
import '../features/games/screens/disaster_scenario_screen.dart';

class MainMenuScreen extends StatefulWidget {
  const MainMenuScreen({super.key});

  @override
  State<MainMenuScreen> createState() => _MainMenuScreenState();
}

class _MainMenuScreenState extends State<MainMenuScreen> {
  String _comicChar = 'doremon';
  String _comicLang = 'English';
  bool _comicLoading = false;
  bool _gameLaunching = false;

  final Map<String, String> _comicCharacters = {
    'doremon': 'Doraemon',
    'shinchan': 'Shinchan',
    'edusafe': 'EduSafe',
  };

  void _refresh() => setState(() {});

  Future<void> _runOnce(Future<void> Function() action) async {
    if (_gameLaunching) return;
    setState(() => _gameLaunching = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _gameLaunching = false);
    }
  }

  Future<void> _launchComicModule(String baseTopic) async {
    if (_comicLoading) return;
    setState(() => _comicLoading = true);

    final assetPrefix =
        'assets/Mod_game/$_comicChar/$baseTopic/$_comicLang/';

    var pageCount = 0;
    try {
      for (var i = 1; i <= 200; i++) {
        try {
          await rootBundle.load('$assetPrefix$i.png');
          pageCount = i;
        } catch (_) {
          break;
        }
      }
    } catch (e) {
      debugPrint('Error calculating pages: $e');
    }

    if (!mounted) return;

    if (pageCount == 0) {
      setState(() => _comicLoading = false);
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Comic unavailable'),
          content: Text(
            'No pages found for ${_comicCharacters[_comicChar] ?? _comicChar} · '
            '$baseTopic · $_comicLang.\n\n'
            'Try another story collection, language, or topic.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    GameManager().selectedLanguage = _comicLang;
    GameManager().startNewGame(_comicLang == 'English' ? 'en' : 'hi', 'comic');

    await Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => ComicReaderScreen(
          totalPages: pageCount,
          topicName: baseTopic,
          characterName: _comicChar,
        ),
      ),
    );

    if (mounted) {
      setState(() => _comicLoading = false);
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final session = GameManager().currentSession;
    final hasActiveGame = session != null && !session.isGameOver;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final narrow = MediaQuery.sizeOf(context).width < 420 || textScale > 1.25;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: const Text('Games'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
        centerTitle: true,
        elevation: 0,
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
            children: [
              Text(
                'Practise safety through play',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (hasActiveGame) ...[
                const SizedBox(height: 12),
                _buildResumeBanner(session),
              ],
              const SizedBox(height: 20),
              Text(
                'Featured safety games',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Only Disaster Scenario uses AI. Other games run on-device.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              ..._featuredGames(narrow),
              const SizedBox(height: 28),
              Text(
                'Safety comics',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Choose a story collection, content language, and topic.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              _buildComicSection(),
              const SizedBox(height: 28),
              Text(
                'External simulations',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Opens in an in-app browser. Requires internet. Scores are not saved in EduSafe.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              ..._externalGames(narrow),
              const SizedBox(height: 28),
              Text(
                'This session',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Counters for this app session only — not saved learning achievements.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              _buildStatTile(
                'Games started',
                '${GameManager().totalGamesPlayed}',
                Icons.videogame_asset_outlined,
              ),
              _buildStatTile(
                'Session high score',
                '${GameManager().highScore}',
                Icons.emoji_events_outlined,
              ),
            ],
          ),
          if (_comicLoading || _gameLaunching)
            ColoredBox(
              color: Colors.black.withValues(alpha: 0.25),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  List<Widget> _featuredGames(bool narrow) {
    final cards = <_GameCardData>[
      _GameCardData(
        title: 'Disaster Scenario',
        subtitle: 'AI choose-your-own adventure. Requires internet.',
        icon: Icons.theater_comedy_outlined,
        accent: Colors.deepPurple,
        requirements: const ['Internet', 'AI'],
        onPlay: () => _runOnce(() async {
          GameManager().startNewGame('en', 'scenario');
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const DisasterScenarioScreen(),
            ),
          );
          _refresh();
        }),
      ),
      _GameCardData(
        title: 'Earthquake Drill',
        subtitle: 'Practise Drop, Cover and Hold On.',
        icon: Icons.landscape_outlined,
        accent: Colors.brown,
        requirements: const ['Landscape'],
        onPlay: () => _runOnce(() async {
          GameManager().startNewGame('en', 'eq_drill');
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const EarthquakeDrillApp(),
            ),
          );
          _refresh();
        }),
      ),
      _GameCardData(
        title: 'Punjab Safety Hero',
        subtitle: 'Disaster preparedness quiz adventure.',
        icon: Icons.storm_outlined,
        accent: Colors.deepOrange,
        onPlay: () {
          final session = GameManager().currentSession;
          final hasActive = session != null && !session.isGameOver;
          _showGameOptions(context, hasActive, 'punjab');
        },
      ),
      _GameCardData(
        title: 'Fire Extinguisher',
        subtitle: 'Camera training simulation with device motion.',
        icon: Icons.fire_extinguisher_outlined,
        accent: Colors.red.shade700,
        requirements: const ['Camera'],
        onPlay: () => _runOnce(() async {
          GameManager().startNewGame('en', 'extinguisher');
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const FireExtinguisherApp(),
            ),
          );
          _refresh();
        }),
      ),
      _GameCardData(
        title: 'School Safety Quiz',
        subtitle: 'Multiple-choice safety questions.',
        icon: Icons.quiz_outlined,
        accent: Colors.blue.shade700,
        onPlay: () {
          final session = GameManager().currentSession;
          final hasActive = session != null && !session.isGameOver;
          _showGameOptions(context, hasActive, 'quiz');
        },
      ),
      _GameCardData(
        title: 'School Runner',
        subtitle: 'Side-scroller evacuation practise.',
        icon: Icons.directions_run,
        accent: Colors.redAccent.shade700,
        onPlay: () => _runOnce(() async {
          GameManager().startNewGame('en', 'runner');
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const RunnerSetupScreen(),
            ),
          );
          _refresh();
        }),
      ),
      _GameCardData(
        title: 'Flood Escape',
        subtitle: 'Jump and climb to stay above rising water.',
        icon: Icons.waves,
        accent: Colors.cyan.shade800,
        onPlay: () => _runOnce(() async {
          GameManager().startNewGame('en', 'jumper');
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
              builder: (context) => const JumperSetupScreen(),
            ),
          );
          _refresh();
        }),
      ),
    ];

    if (narrow) {
      return [
        for (final c in cards) ...[
          _buildGameCard(c),
          const SizedBox(height: 10),
        ],
      ];
    }

    return [
      SizedBox(
        height: 190,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: cards.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, i) => SizedBox(
            width: 260,
            child: _buildGameCard(cards[i], compact: true),
          ),
        ),
      ),
    ];
  }

  List<Widget> _externalGames(bool narrow) {
    final cards = <_WebCardData>[
      _WebCardData(
        title: 'Stop Disasters',
        subtitle: 'UNDRR · external site',
        icon: Icons.public,
        accent: Colors.green.shade700,
        url: 'https://www.stopdisastersgame.org/',
      ),
      _WebCardData(
        title: 'Disaster Master',
        subtitle: 'Ready.gov · external site',
        icon: Icons.bolt_outlined,
        accent: Colors.amber.shade800,
        url: 'https://www.ready.gov/kids/games/data/dm-english/index.html',
      ),
      _WebCardData(
        title: 'Build a Kit',
        subtitle: 'Ready.gov · external site',
        icon: Icons.backpack_outlined,
        accent: Colors.teal,
        url: 'https://www.ready.gov/kids/games/data/bak-english/index.html',
      ),
      _WebCardData(
        title: 'Disaster Mind',
        subtitle: 'iThrive · external site',
        icon: Icons.psychology_outlined,
        accent: Colors.deepPurple,
        url: 'https://www.ithrivesim.org/#/disastermind',
      ),
      _WebCardData(
        title: 'Be Brave Be a Hero',
        subtitle: 'NDMA · external site',
        icon: Icons.shield_outlined,
        accent: AppColors.primaryGreen,
        url: 'https://ndma.gov.in/kids/index.html',
      ),
    ];

    if (narrow) {
      return [
        for (final c in cards) ...[
          _buildWebGameCard(c),
          const SizedBox(height: 10),
        ],
      ];
    }

    return [
      SizedBox(
        height: 160,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: cards.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, i) => SizedBox(
            width: 220,
            child: _buildWebGameCard(cards[i], compact: true),
          ),
        ),
      ),
    ];
  }

  Widget _buildResumeBanner(GameSession session) {
    return Material(
      color: AppColors.primaryGreenSubtle,
      borderRadius: AppBorders.borderRadiusMd,
      child: InkWell(
        borderRadius: AppBorders.borderRadiusMd,
        onTap: () async {
          Widget resumeScreen;
          if (session.gameType == 'quiz') {
            resumeScreen = const SchoolSafetyQuizScreen(isResume: true);
          } else {
            resumeScreen = const PunjabSafetyGameScreen(isResume: true);
          }
          await Navigator.push<void>(
            context,
            MaterialPageRoute<void>(builder: (context) => resumeScreen),
          );
          _refresh();
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(Icons.play_circle_fill, color: AppColors.primaryGreen),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paused game',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Continue where you left off',
                      style: TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildComicSection() {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Story collection', style: theme.textTheme.labelLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _comicCharacters.entries.map((entry) {
            final selected = _comicChar == entry.key;
            return FilterChip(
              label: Text(entry.value),
              selected: selected,
              onSelected: (_) => setState(() => _comicChar = entry.key),
              selectedColor: theme.colorScheme.primaryContainer,
              checkmarkColor: theme.colorScheme.primary,
            );
          }).toList(),
        ),
        const SizedBox(height: 14),
        Text('Content language', style: theme.textTheme.labelLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final lang in ['English', 'Hindi'])
              FilterChip(
                label: Text(lang),
                selected: _comicLang == lang,
                onSelected: (_) => setState(() => _comicLang = lang),
                selectedColor: theme.colorScheme.primaryContainer,
              ),
          ],
        ),
        const SizedBox(height: 14),
        Text('Choose a topic', style: theme.textTheme.labelLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _topicChip('Earthquake', Icons.vibration, Colors.orange, 'EARTHQUAKE'),
            _topicChip('Flood', Icons.water, Colors.blue, 'FLOOD'),
            _topicChip('Fire', Icons.local_fire_department, Colors.red, 'FIRE'),
          ],
        ),
        if (_comicChar != 'doremon') ...[
          const SizedBox(height: 10),
          Text(
            'Narration is unavailable for this story collection.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }

  Widget _topicChip(
    String label,
    IconData icon,
    Color color,
    String topic,
  ) {
    return ActionChip(
      avatar: Icon(icon, color: color, size: 18),
      label: Text(label),
      onPressed: _comicLoading ? null : () => _launchComicModule(topic),
    );
  }

  void _showGameOptions(BuildContext context, bool canResume, String gameType) {
    final title =
        gameType == 'quiz' ? 'School Safety Quiz' : 'Punjab Safety Hero';
    final isThisGameActive =
        canResume && GameManager().currentSession?.gameType == gameType;

    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            if (isThisGameActive)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Resume game'),
                  onPressed: () async {
                    Navigator.pop(context);
                    final resumeScreen = gameType == 'quiz'
                        ? const SchoolSafetyQuizScreen(isResume: true)
                        : const PunjabSafetyGameScreen(isResume: true);
                    await Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                        builder: (context) => resumeScreen,
                      ),
                    );
                    _refresh();
                  },
                ),
              ),
            if (isThisGameActive) const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('Start new game'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.deepOrange,
                ),
                onPressed: () {
                  Navigator.pop(context);
                  _navigateToLanguageSelect(context, gameType);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _navigateToLanguageSelect(
    BuildContext context,
    String gameType,
  ) async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => LanguageSelectionScreen(gameType: gameType),
      ),
    );
    _refresh();
  }

  Widget _buildGameCard(_GameCardData data, {bool compact = false}) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: AppBorders.borderRadiusLg,
      child: InkWell(
        borderRadius: AppBorders.borderRadiusLg,
        onTap: _gameLaunching ? null : data.onPlay,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: AppBorders.borderRadiusLg,
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: data.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(data.icon, color: data.accent),
                  ),
                  const Spacer(),
                  Text(
                    'Start',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              SizedBox(height: compact ? 10 : 12),
              Text(
                data.title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                data.subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  height: 1.3,
                ),
                maxLines: compact ? 3 : 4,
                overflow: TextOverflow.ellipsis,
              ),
              if (data.requirements.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: data.requirements
                      .map(
                        (r) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.backgroundMedium,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            r,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWebGameCard(_WebCardData data, {bool compact = false}) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: AppBorders.borderRadiusLg,
      child: InkWell(
        borderRadius: AppBorders.borderRadiusLg,
        onTap: _gameLaunching
            ? null
            : () => _runOnce(() async {
                  await Navigator.push<void>(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => WebGameScreen(
                        title: data.title,
                        url: data.url,
                      ),
                    ),
                  );
                  // Session counter only after returning from an opened attempt
                  GameManager().playWebGame();
                  _refresh();
                }),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: AppBorders.borderRadiusLg,
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(data.icon, color: data.accent, size: 28),
              SizedBox(height: compact ? 8 : 10),
              Text(
                data.title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                data.subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Open external',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatTile(String title, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: AppBorders.borderRadiusMd,
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(child: Text(title)),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}

class _GameCardData {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accent;
  final List<String> requirements;
  final VoidCallback onPlay;

  _GameCardData({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accent,
    required this.onPlay,
    this.requirements = const [],
  });
}

class _WebCardData {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color accent;
  final String url;

  _WebCardData({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accent,
    required this.url,
  });
}
