import 'package:flutter/material.dart';
import '../models/module_models.dart';
import 'video_player_view.dart';
import 'quiz_screen.dart'; // Import the new game file

class ModuleDetailScreen extends StatefulWidget {
  final LearningModule module;
  final VoidCallback onModuleUpdated;

  const ModuleDetailScreen({
    Key? key,
    required this.module,
    required this.onModuleUpdated,
  }) : super(key: key);

  @override
  State<ModuleDetailScreen> createState() => _ModuleDetailScreenState();
}

class _ModuleDetailScreenState extends State<ModuleDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final videos = widget.module.videos;
    bool canTakeQuiz = videos.isNotEmpty && videos.every((v) => v.isCompleted);
    final int completedCount = videos.where((v) => v.isCompleted).length;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // 1. Blue Header Section
          Container(
            padding: const EdgeInsets.only(top: 50, bottom: 20, left: 16, right: 16),
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF42A5F5), Color(0xFF2196F3)],
              ),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                Icon(widget.module.iconData, size: 60, color: Colors.white.withOpacity(0.9)),
                const SizedBox(height: 10),
                Text(
                  widget.module.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),

          // 2. Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  Text(
                    widget.module.description,
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 15, height: 1.5),
                  ),
                  const SizedBox(height: 16),

                  // Tags Row
                  Row(
                    children: [
                      _buildOutlineTag(Icons.category, 'safety'),
                      const SizedBox(width: 10),
                      _buildOutlineTag(Icons.trending_up, widget.module.level.toLowerCase()),
                      const SizedBox(width: 10),
                      _buildOutlineTag(Icons.schedule, widget.module.duration),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Stats Row
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.amber),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text('${widget.module.points} pts', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Row(
                        children: [
                          const Icon(Icons.visibility_outlined, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          const Text('35 views', style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(width: 16),
                      Row(
                        children: [
                          Icon(Icons.check_circle_outline, size: 16, color: widget.module.isQuizPassed ? Colors.green : Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            '$completedCount completed',
                            style: TextStyle(color: widget.module.isQuizPassed ? Colors.green : Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // "Did you know?" Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            '${widget.module.title} is crucial. Always follow safety protocols strictly.',
                            style: const TextStyle(fontSize: 14, color: Colors.black87),
                          ),
                        ),
                        const Icon(Icons.volume_up, color: Colors.green, size: 20),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Videos List
                  ...widget.module.videos.asMap().entries.map((entry) {
                    int idx = entry.key;
                    VideoLesson video = entry.value;
                    return GestureDetector(
                      onTap: () {
                         Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => VideoPlayerView(
                                title: video.title,
                                videoUrl: video.url,
                                onVideoCompleted: () {
                                  setState(() {
                                    video.isCompleted = true;
                                  });
                                  widget.onModuleUpdated();
                                },
                              ),
                            ),
                          );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 180,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: Colors.black12,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Stack(
                                children: [
                                  Center(
                                    child: Icon(
                                      video.isCompleted ? Icons.check_circle : Icons.play_circle_fill, 
                                      size: 50, 
                                      color: video.isCompleted ? Colors.green : Colors.grey[700]
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 10,
                                    right: 10,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.7),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text('Video', style: TextStyle(color: Colors.white, fontSize: 10)),
                                    ),
                                  )
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${idx + 1}. ${video.title}',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),

                  const SizedBox(height: 10),

                  // Module Quiz Section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(color: Colors.amber, borderRadius: BorderRadius.circular(4)),
                              child: const Icon(Icons.quiz, color: Colors.white, size: 16),
                            ),
                            const SizedBox(width: 8),
                            const Text('Quiz', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text('Module Quiz', style: TextStyle(fontWeight: FontWeight.w600)),
                        const Text('Test your knowledge to earn the badge.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.play_arrow, color: Colors.white),
                            label: const Text('Start Module Quiz', style: TextStyle(color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: canTakeQuiz ? Colors.orange : Colors.grey,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: canTakeQuiz
                                ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => QuizScreen(
                                          moduleTitle: widget.module.title,
                                          quizPath: widget.module.quizJsonPath,
                                          onQuizFinished: (passed) {
                                            if (passed) {
                                              setState(() {
                                                widget.module.isQuizPassed = true;
                                              });
                                              widget.onModuleUpdated();
                                            }
                                          },
                                        ),
                                      ),
                                    );
                                  }
                                : null,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // AI Quiz Section (Updated with redirect)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E5F5), // Light purple
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: Colors.purple, size: 18),
                            SizedBox(width: 8),
                            Text('AI-Generated Quiz', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Generate unlimited quiz questions using AI', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.purple,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              // Redirect to the AI Quiz Game
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI Quiz - Coming Soon')));
                            },
                            child: const Text('Generate AI Quiz', style: TextStyle(color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOutlineTag(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
        color: Colors.white,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.green),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
        ],
      ),
    );
  }
}