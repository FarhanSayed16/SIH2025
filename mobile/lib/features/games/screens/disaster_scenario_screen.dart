/// O1: AI Disaster Scenario Simulator (Choose Your Own Adventure)
/// User sees a scenario, picks one of 4 options; AI returns consequence and next scenario.
/// 3–5 steps then game over with safety score and tip.

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/services/api_service.dart';
import '../../../core/design/design_system.dart';

class DisasterScenarioScreen extends StatefulWidget {
  const DisasterScenarioScreen({super.key});

  @override
  State<DisasterScenarioScreen> createState() => _DisasterScenarioScreenState();
}

class _DisasterScenarioScreenState extends State<DisasterScenarioScreen> {
  final ApiService _api = ApiService();

  String? _scenarioText;
  String? _consequenceToShow;
  List<String> _options = [];
  bool _isGameOver = false;
  String? _safetyScoreSentence;
  String? _tip;
  bool _loading = true;
  String? _error;

  int _stepIndex = 0;
  final List<Map<String, String>> _previousContext = [];

  @override
  void initState() {
    super.initState();
    _loadFirstStep();
  }

  Future<void> _loadFirstStep() async {
    setState(() {
      _loading = true;
      _error = null;
      _consequenceToShow = null;
    });
    try {
      final res = await _api.post(
        ApiEndpoints.aiScenarioNext,
        data: {
          'stepIndex': 0,
          'previousContext': [],
        },
      );
      _applyResponse(res.data);
    } catch (e) {
      if (mounted) {
        String errMsg = e.toString().replaceFirst('Exception: ', '');
        if (e is DioException && e.response?.data is Map) {
          final msg = (e.response!.data as Map)['message']?.toString();
          if (msg != null && msg.isNotEmpty) errMsg = msg;
        }
        setState(() {
          _loading = false;
          _error = errMsg;
        });
      }
    }
  }

  void _applyResponse(dynamic data) {
    if (!mounted) return;
    Map<String, dynamic>? map;
    if (data is Map) {
      map = data is Map<String, dynamic> ? data : Map<String, dynamic>.from(data);
    } else if (data != null && data is Map) {
      map = Map<String, dynamic>.from(data);
    }
    if (map == null) {
      setState(() {
        _loading = false;
        _error = 'Invalid response';
      });
      return;
    }
    final dataData = map['data'];
    final payload = dataData is Map ? (dataData as Map<String, dynamic>) : map;

    final nextScenario = payload['nextScenario']?.toString();
    final consequence = payload['consequence']?.toString();
    final options = payload['options'];
    final isGameOver = payload['isGameOver'] == true;
    final safetyScore = payload['safetyScoreSentence']?.toString();
    final tip = payload['tip']?.toString();

    List<String> opts = [];
    if (options is List) {
      for (final o in options) {
        if (o != null && o.toString().trim().isNotEmpty) opts.add(o.toString().trim());
      }
    }
    setState(() {
      if (consequence != null && consequence.isNotEmpty) _consequenceToShow = consequence;
      _scenarioText = nextScenario ?? _scenarioText;
      _options = opts;
      _isGameOver = isGameOver;
      _safetyScoreSentence = safetyScore;
      _tip = tip;
      _loading = false;
      _error = null;
    });
  }

  Future<void> _onChoice(String choice) async {
    _previousContext.add({
      'scenario': _scenarioText ?? '',
      'choice': choice,
      'consequence': _consequenceToShow ?? '',
    });
    setState(() {
      _loading = true;
      _consequenceToShow = null;
      _stepIndex = _previousContext.length;
    });
    try {
      final res = await _api.post(
        ApiEndpoints.aiScenarioNext,
        data: {
          'stepIndex': _stepIndex,
          'userChoice': choice,
          'previousContext': _previousContext,
        },
      );
      _applyResponse(res.data);
    } catch (e) {
      if (mounted) {
        String errMsg = e.toString().replaceFirst('Exception: ', '');
        if (e is DioException && e.response?.data is Map) {
          final msg = (e.response!.data as Map)['message']?.toString();
          if (msg != null && msg.isNotEmpty) errMsg = msg;
        }
        setState(() {
          _loading = false;
          _error = errMsg;
        });
      }
    }
  }

  void _playAgain() {
    setState(() {
      _scenarioText = null;
      _consequenceToShow = null;
      _options = [];
      _isGameOver = false;
      _safetyScoreSentence = null;
      _tip = null;
      _previousContext.clear();
      _stepIndex = 0;
    });
    _loadFirstStep();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Disaster Scenario'),
        backgroundColor: Colors.deepOrange.shade700,
        foregroundColor: Colors.white,
        actions: [
          if (_isGameOver)
            TextButton(
              onPressed: _playAgain,
              child: const Text('Play again', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading && _scenarioText == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading scenario...'),
          ],
        ),
      );
    }
    if (_error != null && _scenarioText == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red.shade700),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _loadFirstStep, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_consequenceToShow != null && _consequenceToShow!.isNotEmpty) ...[
            _sectionCard(
              title: 'What happened',
              text: _consequenceToShow!,
              color: Colors.amber.shade100,
              borderColor: Colors.amber.shade700,
            ),
            const SizedBox(height: 20),
          ],
          if (_scenarioText != null && _scenarioText!.isNotEmpty) ...[
            _sectionCard(
              title: _isGameOver ? 'The end' : 'What do you do?',
              text: _scenarioText!,
              color: Colors.blue.shade50,
              borderColor: Colors.blue.shade700,
            ),
            const SizedBox(height: 24),
          ],
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_isGameOver) ...[
            if (_safetyScoreSentence != null && _safetyScoreSentence!.isNotEmpty)
              _sectionCard(
                title: 'Your safety score',
                text: _safetyScoreSentence!,
                color: Colors.green.shade50,
                borderColor: Colors.green.shade700,
              ),
            if (_tip != null && _tip!.isNotEmpty) ...[
              const SizedBox(height: 12),
              _sectionCard(
                title: 'Safety tip',
                text: _tip!,
                color: Colors.orange.shade50,
                borderColor: Colors.orange.shade700,
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _playAgain,
                icon: const Icon(Icons.replay),
                label: const Text('Play again'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.deepOrange,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ] else ...[
            ..._options.map((opt) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ElevatedButton(
                    onPressed: () => _onChoice(opt),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.deepOrange.shade400,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(opt, textAlign: TextAlign.center),
                  ),
                )),
          ],
        ],
      ),
    );
  }

  Widget _sectionCard({
    required String title,
    required String text,
    required Color color,
    required Color borderColor,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: borderColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            text,
            style: const TextStyle(fontSize: 15, height: 1.4),
          ),
        ],
      ),
    );
  }
}
