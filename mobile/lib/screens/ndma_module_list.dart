import 'package:flutter/material.dart';
import '../data/module_data.dart';
import '../models/module_models.dart';
import 'module_detail_screen.dart';

class NdmaModulesList extends StatefulWidget {
  const NdmaModulesList({Key? key}) : super(key: key);

  @override
  State<NdmaModulesList> createState() => _NdmaModulesListState();
}

class _NdmaModulesListState extends State<NdmaModulesList> {
  late List<LearningModule> modules;
  String searchQuery = '';

  @override
  void initState() {
    super.initState();
    modules = ModuleRepository().getModules(); // Use instance method
  }

  @override
  Widget build(BuildContext context) {
    final filteredModules = modules.where((m) {
      return m.title.toLowerCase().contains(searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: const Color(0xFF43A047),
        elevation: 0,
        title: const Text('NDMA Modules',
            style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            color: const Color(0xFF43A047),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            child: TextField(
              onChanged: (val) => setState(() => searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search modules...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredModules.length,
              itemBuilder: (context, index) {
                return _buildModuleCard(filteredModules[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModuleCard(LearningModule module) {
    bool isComingSoon = module.isComingSoon;
    double progress = module.progress;
    int progressPercent = (progress * 100).toInt();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: isComingSoon
              ? () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Coming Soon!')),
                  );
                }
              : () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute<dynamic>(
                      builder: (context) => ModuleDetailScreen(
                        module: module,
                        onModuleUpdated: () => setState(() {}),
                      ),
                    ),
                  );
                  setState(() {});
                },
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: module.color.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        module.iconData,
                        color: module.color.withOpacity(1.0).withBlue(50),
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            module.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            module.description,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                              height: 1.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              if (!isComingSoon) ...[
                                _buildTag('${progressPercent}%',
                                    Colors.green.shade50, Colors.green),
                                const SizedBox(width: 8),
                              ],
                              _buildTag(module.level.toLowerCase(),
                                  Colors.orange.shade50, Colors.orange),
                              const SizedBox(width: 8),
                              const Icon(Icons.access_time,
                                  size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                module.duration,
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          )
                        ],
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: isComingSoon ? 0 : (progress == 0 ? 0.02 : progress),
                    backgroundColor: Colors.grey.shade100,
                    color: isComingSoon ? Colors.grey : const Color(0xFF43A047),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
