import 'package:flutter/material.dart';
import '../screens/ndma_module_list.dart';
import 'ndrf_language_screen.dart';
import 'hearing_impaired_list.dart'; // Import the new screen

class ModuleScreenFile extends StatelessWidget {
  const ModuleScreenFile({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Disaster Management'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildMainCategoryCard(
              context,
              title: 'Module BY NDMA',
              description: 'Official guidelines for cyclones, floods, earthquakes, and more.',
              icon: Icons.security,
              color: Colors.orange,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<dynamic>(builder: (context) => const NdmaModulesList()),
                );
              },
            ),
            const SizedBox(height: 16),
            _buildMainCategoryCard(
              context,
              title: 'Module by NDRF',
              description: 'Specialized rescue operation techniques and force protocols.',
              icon: Icons.groups,
              color: Colors.blue,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<dynamic>(builder: (context) => const NdrfLanguageScreen()),
                );
              },
            ),
            const SizedBox(height: 16),
            _buildMainCategoryCard(
              context,
              title: 'Module by NDMA For Hearing Disabilities',
              description: 'Visual-aid focused safety guides and sign language support.',
              icon: Icons.hearing_disabled,
              color: Colors.purple,
              onTap: () {
                // Navigate to the Sign Language List
                Navigator.push(
                  context,
                  MaterialPageRoute<dynamic>(builder: (context) => const HearingImpairedList()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMainCategoryCard(
    BuildContext context, {
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              // ignore: deprecated_member_use
              colors: [Colors.white, color.withOpacity(0.05)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  // ignore: deprecated_member_use
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}