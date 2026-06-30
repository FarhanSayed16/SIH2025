import 'dart:convert';
import 'dart:io'; // Import for InternetAddress
import 'package:flutter/material.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../../../config/constants.dart';
import '../../../managers/game_manager.dart';
import '../models/game_models.dart'; // Use same GameResponse as GameManager

class PunjabSafetyGameScreen extends StatefulWidget {
  final bool isResume;
  const PunjabSafetyGameScreen({super.key, required this.isResume});

  @override
  State<PunjabSafetyGameScreen> createState() => _PunjabSafetyGameScreenState();
}

class _PunjabSafetyGameScreenState extends State<PunjabSafetyGameScreen> {
  late GameSession _session;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _session = GameManager().currentSession!;
    if (!widget.isResume && _session.currentScenarioData == null) {
      _checkNetworkAndStart();
    }
  }

  // --- NEW: Network Check Function ---
  Future<void> _checkNetworkAndStart() async {
    setState(() {
      _session.isLoading = true;
      _session.errorMessage = null;
    });

    try {
      final result = await InternetAddress.lookup('google.com');
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        // Network is good, start Gemini
        _initGemini();
      }
    } on SocketException catch (_) {
      // No Network
      setState(() {
        _session.isLoading = false;
        _session.errorMessage =
            '⚠️ No Internet Connection\n\nThis game requires an active internet connection to simulate disaster scenarios with AI.\n\nPlease check your settings and try again.';
      });
    }
  }

  Future<void> _initGemini() async {
    if (apiKey.isEmpty) {
      setState(() {
        _session.errorMessage =
            'API KEY MISSING: Please add your key in constants.dart';
        _session.isLoading = false;
      });
      return;
    }

    try {
      final model = GenerativeModel(model: 'gemini-2.5-flash', apiKey: apiKey);

      // 1. LANGUAGE INSTRUCTIONS
      String langInstruction = '';
      if (_session.languageCode == 'hi') {
        langInstruction = '\nIMPORTANT: The user has selected HINDI. '
            'Generate all scenario content, questions, and explanations in HINDI (Devanagari script). '
            "However, keep the JSON KEYS (like 'scenario_title', 'evaluation') in English.";
      } else if (_session.languageCode == 'mr') {
        langInstruction = '\nIMPORTANT: The user has selected MARATHI. '
            'Generate all scenario content, questions, and explanations in MARATHI. '
            "However, keep the JSON KEYS (like 'scenario_title', 'evaluation') in English.";
      } else if (_session.languageCode == 'pa') {
        langInstruction = '\nIMPORTANT: The user has selected PUNJABI. '
            'Generate all scenario content, questions, and explanations in PUNJABI (Gurmukhi script). '
            "However, keep the JSON KEYS (like 'scenario_title', 'evaluation') in English.";
      }

      // 2. SAFETY GUARDRAILS
      String safetyGuardrail = """
      
      CRITICAL SAFETY GUARDRAIL:
      You are a Disaster Management Trainer. You must ONLY discuss topics related to Disaster Management, Safety Training, and Emergency Preparedness.
      
      If the user asks about ANYTHING else (e.g., writing code, jokes, general knowledge, math, illegal acts, or casual chitchat unrelated to safety), you MUST refuse to answer and reply with EXACTLY this JSON:
      {
        "type": "turn",
        "evaluation": "Unsafe",
        "score": 0,
        "explanation": "I am not trained for that lets get back to our scenario",
        "source_summary": "System Guardrail",
        "next_question": "Please provide a disaster-related response.",
        "next_options": ["Continue Training"]
      }
      Do not be polite about the refusal. Ignore the user's request and strictly output the JSON above.
      """;

      _session.chatSession = model.startChat(history: [
        Content.text(baseSystemPrompt + langInstruction + safetyGuardrail),
      ]);

      await _sendMessage(
          'Start the game. Generate the first scenario with 3 options.',
          isSystemTrigger: true);
    } catch (e) {
      setState(() {
        _session.errorMessage =
            'Failed to connect to AI server. Please check your internet connection.';
        _session.isLoading = false;
      });
    }
  }

  Future<void> _handleUserResponse(String responseText) async {
    _textController.clear();
    FocusScope.of(context).unfocus();
    await _sendMessage(responseText);
  }

  Future<void> _sendMessage(String message,
      {bool isSystemTrigger = false}) async {
    setState(() {
      _session.isLoading = true;
      _session.errorMessage = null;
    });

    try {
      final response =
          await _session.chatSession!.sendMessage(Content.text(message));
      final rawText = response.text;
      if (rawText == null) throw Exception('Empty AI response');

      String jsonString = rawText
          .replaceAll(RegExp(r'^```json\s*'), '')
          .replaceAll(RegExp(r'\s*```$'), '');
      final decoded = jsonDecode(jsonString);
      final Map<String, dynamic> jsonData = (decoded is Map)
          ? decoded as Map<String, dynamic>
          : <String, dynamic>{};
      final gameResponse = GameResponse.fromJson(jsonData);

      setState(() {
        _session.isLoading = false;

        if (gameResponse.type == 'initial') {
          _session.persistentTitle = gameResponse.scenarioTitle;
          _session.persistentDescription = gameResponse.scenarioDescription;
          _session.currentScenarioData = gameResponse;
        } else if (gameResponse.type == 'turn') {
          _session.history.add(TurnHistoryItem(
            question: _session.currentScenarioData?.question ?? 'Question',
            userAnswer: message,
            evaluation: gameResponse.evaluation ?? 'Evaluated',
            score: gameResponse.score ?? 0,
            explanation: gameResponse.explanation ?? '',
            source: gameResponse.sourceSummary ?? 'NDMA Guidelines',
          ));

          _session.totalScore += (gameResponse.score ?? 0);
          GameManager()
              .updateScores((gameResponse.score ?? 0), _session.totalScore);

          _session.currentScenarioData = GameResponse(
            type: 'turn_scenario',
            scenarioTitle: _session.persistentTitle,
            scenarioDescription: _session.persistentDescription,
            question: gameResponse.nextQuestion,
            options: gameResponse.nextOptions,
            round: gameResponse.round,
          );
        } else if (gameResponse.type == 'final') {
          _session.history.add(TurnHistoryItem(
            question: _session.currentScenarioData?.question ?? 'Last Question',
            userAnswer: message,
            evaluation: gameResponse.evaluation ?? '',
            score: gameResponse.score ?? 0,
            explanation: gameResponse.explanation ?? '',
            source: gameResponse.sourceSummary ?? 'NDMA Guidelines',
          ));

          _session.totalScore += (gameResponse.score ?? 0);
          GameManager()
              .updateScores((gameResponse.score ?? 0), _session.totalScore);

          _session.isGameOver = true;
          _session.currentScenarioData = gameResponse;
        }
      });

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      setState(() {
        _session.isLoading = false;
        _session.errorMessage = 'Connection Error: Please check your internet.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text(
            _session.languageCode == 'hi' ? 'सुरक्षा मिशन' : 'Safety Mission'),
        backgroundColor: Colors.deepOrange,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
                color: Colors.white24, borderRadius: BorderRadius.circular(20)),
            child: Row(
              children: [
                const Icon(Icons.star, color: Colors.yellow, size: 18),
                const SizedBox(width: 4),
                Text('${_session.totalScore}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
          )
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_session.errorMessage != null) {
      return Center(
          child: Padding(
        padding: const EdgeInsets.all(30.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off, size: 60, color: Colors.red),
            const SizedBox(height: 20),
            Text(_session.errorMessage!,
                style: const TextStyle(color: Colors.black87, fontSize: 16),
                textAlign: TextAlign.center),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                _session.errorMessage = null; // Clear error
                _checkNetworkAndStart(); // Retry
              },
              child: const Text('Retry Connection'),
            )
          ],
        ),
      ));
    }

    if (_session.isGameOver && _session.currentScenarioData != null) {
      return _buildFinalScreen(_session.currentScenarioData!);
    }

    if (_session.currentScenarioData == null && _session.isLoading) {
      return const Center(
          child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 20),
          Text('Loading Disaster Scenario...'),
        ],
      ));
    }

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      children: [
        if (_session.persistentTitle != null) _buildPersistentHeader(),
        if (_session.history.isNotEmpty)
          ..._session.history.map((turn) => _buildHistoryCard(turn)),
        const SizedBox(height: 20),
        if (_session.currentScenarioData != null)
          _buildActiveQuestionCard(_session.currentScenarioData!),
        const SizedBox(height: 20),
        if (!_session.isLoading &&
            _session.currentScenarioData?.options != null)
          ..._session.currentScenarioData!.options!.map((opt) => Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 16),
                    ),
                    onPressed: () => _handleUserResponse(opt),
                    child: Text(opt, style: const TextStyle(fontSize: 16)),
                  ),
                ),
              )),
        if (_session.isLoading)
          const Padding(
              padding: EdgeInsets.all(20.0),
              child: Center(child: CircularProgressIndicator())),
        const SizedBox(height: 20),
        if (!_session.isLoading)
          TextField(
            controller: _textController,
            decoration: InputDecoration(
              hintText: _session.languageCode == 'hi'
                  ? 'अपनी रणनीति टाइप करें...'
                  : 'Or type your strategy...',
              filled: true,
              fillColor: Colors.white,
              prefixIcon: const Icon(Icons.keyboard),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none),
              suffixIcon: IconButton(
                icon: const Icon(Icons.send, color: Colors.deepOrange),
                onPressed: () => _handleUserResponse(_textController.text),
              ),
            ),
            onSubmitted: (val) => _handleUserResponse(val),
          ),
        const SizedBox(height: 40),
      ],
    );
  }

  // ... (Keep _buildPersistentHeader, _buildHistoryCard, _buildActiveQuestionCard, _buildFinalScreen as they were)

  Widget _buildPersistentHeader() {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.deepOrange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.deepOrange.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.warning, color: Colors.deepOrange),
            const SizedBox(width: 10),
            Expanded(
                child: Text(_session.persistentTitle ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.deepOrange))),
          ]),
          const Divider(),
          Text(_session.persistentDescription ?? '',
              style: TextStyle(color: Colors.grey[800])),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(TurnHistoryItem turn) {
    bool isSafe = turn.evaluation.toLowerCase().contains('correct');
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border(
            left: BorderSide(
                color: isSafe ? Colors.green : Colors.orange, width: 4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Q: ${turn.question}',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],
                  fontSize: 12)),
          const SizedBox(height: 4),
          Text('You: ${turn.userAnswer}', style: const TextStyle(fontSize: 15)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSafe ? Colors.green.shade50 : Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(isSafe ? Icons.check : Icons.warning,
                      size: 16, color: isSafe ? Colors.green : Colors.orange),
                  const SizedBox(width: 6),
                  Text(turn.evaluation,
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isSafe ? Colors.green : Colors.orange)),
                  const Spacer(),
                  Text('+${turn.score}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 6),
                Text(turn.explanation, style: const TextStyle(fontSize: 13)),
                const Divider(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.menu_book,
                        size: 14, color: Colors.blueGrey),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(turn.source,
                          style: const TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: Colors.blueGrey,
                              fontWeight: FontWeight.w500)),
                    ),
                  ],
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveQuestionCard(GameResponse data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8)),
                child: Text("ROUND ${data.round ?? '?'}",
                    style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            data.question ?? 'Waiting for situation update...',
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87),
          ),
        ],
      ),
    );
  }

  Widget _buildFinalScreen(GameResponse data) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const Icon(Icons.emoji_events, size: 80, color: Colors.orange),
          const SizedBox(height: 20),
          const Text('Mission Complete!',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Text('Final Score: ${data.finalScore}/50',
              style: const TextStyle(fontSize: 24, color: Colors.deepOrange)),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Preparedness Report',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Divider(),
                Text(data.preparednessSummary ?? ''),
                const SizedBox(height: 20),
                const Text('Recommended Actions',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Divider(),
                Text(data.recommendedActions ?? ''),
              ],
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () {
              GameManager().clearSession();
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepOrange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
            ),
            child: const Text('Back to Menu'),
          )
        ],
      ),
    );
  }
}
