import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/kid_theme.dart';

/// Kid Home Screen
/// Phase 2.5: K-12 Multi-Access
/// Simplified, visual-only interface for young students
class KidHomeScreen extends ConsumerWidget {
  const KidHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: const Text('EduSafe'),
        backgroundColor: KidTheme.primaryColor,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Welcome Section
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: KidTheme.primaryColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.shield,
                      size: 80,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Welcome!',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Let\'s learn about safety!',
                      style: TextStyle(
                        fontSize: 20,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Quick Actions (Large Visual Buttons)
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  children: [
                    _buildActionCard(
                      context,
                      icon: Icons.book,
                      label: 'Learn',
                      color: KidTheme.primaryColor,
                      onTap: () {
                        // Navigate to modules
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Learn section coming soon!')),
                        );
                      },
                    ),
                    _buildActionCard(
                      context,
                      icon: Icons.games,
                      label: 'Play',
                      color: KidTheme.secondaryColor,
                      onTap: () {
                        // Navigate to games
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Games coming soon!')),
                        );
                      },
                    ),
                    _buildActionCard(
                      context,
                      icon: Icons.quiz,
                      label: 'Quiz',
                      color: KidTheme.successColor,
                      onTap: () {
                        // Navigate to quizzes
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Quizzes coming soon!')),
                        );
                      },
                    ),
                    _buildActionCard(
                      context,
                      icon: Icons.people,
                      label: 'Group',
                      color: KidTheme.infoColor,
                      onTap: () {
                        // Navigate to group activities
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Group activities coming soon!')),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Help Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Show help/instructions
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Need Help?'),
                        content: const Text('Ask your teacher for help!'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('OK'),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.help, size: 32),
                  label: const Text(
                    'Need Help?',
                    style: TextStyle(fontSize: 20),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: KidTheme.warningColor,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                color,
                color.withOpacity(0.7),
              ],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 64,
                color: Colors.white,
              ),
              const SizedBox(height: 16),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

