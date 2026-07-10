/**
 * Accessibility Settings Screen
 * Phase 4.9: User accessibility preferences
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/locale_provider.dart';
import '../../../l10n/app_localizations.dart';

class AccessibilitySettingsScreen extends ConsumerStatefulWidget {
  const AccessibilitySettingsScreen({super.key});

  @override
  ConsumerState<AccessibilitySettingsScreen> createState() => _AccessibilitySettingsScreenState();
}

class _AccessibilitySettingsScreenState extends ConsumerState<AccessibilitySettingsScreen> {
  bool _highContrast = false;
  bool _reducedMotion = false;
  String _fontSize = 'medium';
  bool _largeText = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() {
    // TODO: Load from user settings API
    // For now, using defaults
  }

  void _saveSettings() {
    // TODO: Save to user settings API
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Settings saved')),
    );
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
              _saveSettings();
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

