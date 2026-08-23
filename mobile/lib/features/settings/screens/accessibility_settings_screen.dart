/**
 * Accessibility Settings Screen
 * Syncs with GET /api/settings and PUT /api/settings/accessibility
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';

class AccessibilitySettingsScreen extends ConsumerStatefulWidget {
  const AccessibilitySettingsScreen({super.key});

  @override
  ConsumerState<AccessibilitySettingsScreen> createState() => _AccessibilitySettingsScreenState();
}

class _AccessibilitySettingsScreenState extends ConsumerState<AccessibilitySettingsScreen> {
  final ApiService _api = ApiService();
  bool _highContrast = false;
  bool _reducedMotion = false;
  String _fontSize = 'medium';
  bool _largeText = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Map<String, dynamic>? _asMap(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }

  Future<void> _loadSettings() async {
    try {
      final res = await _api.get(ApiEndpoints.settings);
      final root = _asMap(res.data);
      final data = _asMap(root?['data']) ?? root;
      if (data == null) return;
      final access = _asMap(data['accessibility']) ?? {};
      final language = data['language']?.toString();
      if (!mounted) return;
      setState(() {
        _highContrast = access['highContrast'] == true;
        _reducedMotion = access['reducedMotion'] == true;
        _fontSize = (access['fontSize'] as String?) ?? 'medium';
        _largeText = _fontSize == 'large' || _fontSize == 'xlarge';
      });
      if (language != null && language.isNotEmpty) {
        await ref.read(localeProvider.notifier).setLocale(Locale(language));
      }
    } catch (_) {
      // Offline or unauthenticated: keep local defaults
    }
  }

  Future<void> _saveSettings() async {
    if (_saving) return;
    _saving = true;
    try {
      await _api.put(ApiEndpoints.settingsAccessibility, data: {
        'highContrast': _highContrast,
        'fontSize': _fontSize,
        'reducedMotion': _reducedMotion,
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save settings. Try again when online.')),
        );
      }
    } finally {
      _saving = false;
    }
  }

  Future<void> _saveLanguage(String code) async {
    try {
      await _api.put(ApiEndpoints.settingsLanguage, data: {'language': code});
    } catch (_) {
      // Locale is already stored locally via localeProvider
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.accessibilitySettings),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Language Preference
          _buildSection(
            title: localizations.language,
            children: [
              _buildLanguageSelector(),
            ],
          ),

          const SizedBox(height: 24),

          // Visual Settings
          _buildSection(
            title: 'Visual Settings',
            children: [
              SwitchListTile(
                title: const Text('High Contrast Mode'),
                subtitle: const Text('Increase contrast for better visibility'),
                value: _highContrast,
                onChanged: (value) {
                  setState(() {
                    _highContrast = value;
                    _saveSettings();
                  });
                },
              ),
              SwitchListTile(
                title: const Text('Large Text'),
                subtitle: const Text('Increase text size throughout the app'),
                value: _largeText,
                onChanged: (value) {
                  setState(() {
                    _largeText = value;
                    if (value && (_fontSize == 'small' || _fontSize == 'medium')) {
                      _fontSize = 'large';
                    } else if (!value && (_fontSize == 'large' || _fontSize == 'xlarge')) {
                      _fontSize = 'medium';
                    }
                    _saveSettings();
                  });
                },
              ),
              ListTile(
                title: const Text('Font Size'),
                subtitle: Text(_fontSize.toUpperCase()),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  _showFontSizeDialog();
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Motion Settings
          _buildSection(
            title: 'Motion Settings',
            children: [
              SwitchListTile(
                title: const Text('Reduce Motion'),
                subtitle: const Text('Reduce animations and transitions'),
                value: _reducedMotion,
                onChanged: (value) {
                  setState(() {
                    _reducedMotion = value;
                    _saveSettings();
                  });
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Screen Reader
          _buildSection(
            title: 'Screen Reader',
            children: [
              ListTile(
                title: const Text('Screen Reader Support'),
                subtitle: const Text('Enhanced support for screen readers'),
                trailing: const Icon(Icons.check, color: Colors.green),
              ),
              ListTile(
                title: const Text('Semantic Labels'),
                subtitle: const Text('Descriptive labels for all elements'),
                trailing: const Icon(Icons.check, color: Colors.green),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Reset Button
          Center(
            child: OutlinedButton.icon(
              onPressed: () {
                _resetSettings();
              },
              icon: const Icon(Icons.restore),
              label: const Text('Reset to Defaults'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        Card(
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildLanguageSelector() {
    final localeNotifier = ref.read(localeProvider.notifier);
    final currentLocaleState = ref.watch(localeProvider);
    final currentLocale = currentLocaleState.locale;

    final languages = [
      {'code': 'en', 'name': 'English'},
      {'code': 'hi', 'name': 'हिंदी (Hindi)'},
      {'code': 'mr', 'name': 'मराठी (Marathi)'},
      {'code': 'pa', 'name': 'ਪੰਜਾਬੀ (Punjabi)'},
    ];

    return Column(
      children: languages.map((lang) {
        final isSelected = currentLocale.languageCode == lang['code'];
        return RadioListTile<String>(
          title: Text(lang['name'] as String),
          value: lang['code'] as String,
          groupValue: currentLocale.languageCode,
          onChanged: (value) {
            if (value != null) {
              localeNotifier.setLocale(Locale(value));
              _saveLanguage(value);
            }
          },
          selected: isSelected,
        );
      }).toList(),
    );
  }

  void _showFontSizeDialog() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Font Size'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<String>(
              title: const Text('Small'),
              value: 'small',
              groupValue: _fontSize,
              onChanged: (value) {
                setState(() {
                  _fontSize = value!;
                  _largeText = value == 'large' || value == 'xlarge';
                });
                Navigator.pop(context);
                _saveSettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Medium'),
              value: 'medium',
              groupValue: _fontSize,
              onChanged: (value) {
                setState(() {
                  _fontSize = value!;
                  _largeText = value == 'large' || value == 'xlarge';
                });
                Navigator.pop(context);
                _saveSettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Large'),
              value: 'large',
              groupValue: _fontSize,
              onChanged: (value) {
                setState(() {
                  _fontSize = value!;
                  _largeText = value == 'large' || value == 'xlarge';
                });
                Navigator.pop(context);
                _saveSettings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Extra Large'),
              value: 'xlarge',
              groupValue: _fontSize,
              onChanged: (value) {
                setState(() {
                  _fontSize = value!;
                  _largeText = value == 'large' || value == 'xlarge';
                });
                Navigator.pop(context);
                _saveSettings();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _resetSettings() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Settings'),
        content: const Text('Are you sure you want to reset all accessibility settings to defaults?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _highContrast = false;
                _reducedMotion = false;
                _fontSize = 'medium';
                _largeText = false;
              });
              Navigator.pop(context);
              _saveSettings();
            },
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }
}

