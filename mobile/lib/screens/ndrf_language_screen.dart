import 'package:flutter/material.dart';
import '../data/ndrf_data.dart';
import 'ndrf_module_detail_screen.dart';

class NdrfLanguageScreen extends StatelessWidget {
  const NdrfLanguageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Get keys (Languages)
    final languages = NdrfRepository.getNdrfModules().keys.toList()..sort();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Language'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: languages.length,
        separatorBuilder: (ctx, i) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final lang = languages[index];
          return Card(
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              leading: CircleAvatar(
                backgroundColor: Colors.blue.shade50,
                child: Text(lang[0], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
              ),
              title: Text(
                lang,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<dynamic>(
                    builder: (context) => NdrfModuleDetailScreen(language: lang),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}