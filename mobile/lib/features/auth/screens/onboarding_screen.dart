/// Phase 101.3: Onboarding Screen - Optional
/// Welcome screens with feature highlights and permission requests

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/widgets.dart';
import '../../../core/design/design_system.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      icon: Icons.shield,
      title: 'Welcome to EduSafe',
      description:
          'Your personal disaster preparedness companion. Learn, practice, and stay safe.',
      color: AppColors.primaryGreen,
    ),
    OnboardingPage(
      icon: Icons.school_outlined,
      title: 'Learn & Practice',
      description:
          'Access interactive learning modules and practice drills to prepare for emergencies.',
      color: AppColors.accentBlue,
    ),
    OnboardingPage(
      icon: Icons.games_outlined,
      title: 'Gamified Learning',
      description:
          'Make learning fun with engaging games and challenges. Earn badges and track your progress.',
      color: AppColors.accentOrange,
    ),
    OnboardingPage(
      icon: Icons.warning_amber_rounded,
      title: 'Stay Safe',
      description:
          'Get real-time alerts and guidance during emergencies. Your safety is our priority.',
      color: AppColors.primaryRed,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  void _skipOnboarding() {
    _completeOnboarding();
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            // Skip Button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: AppSpacing.screenHorizontal,
                child: TextButtonCustom(
                  label: 'Skip',
                  onPressed: _skipOnboarding,
                ),
              ),
            ),

            // Page View
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _OnboardingPageView(page: _pages[index]);
                },
              ),
            ),

            // Page Indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _pages.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? AppColors.primaryGreen
                        : AppColors.backgroundMedium,
                    borderRadius: AppBorders.borderRadiusXs,
                  ),
                ),
              ),
            ),

            SizedBox(height: AppSpacing.xl),

            // Navigation Buttons
            Padding(
              padding: AppSpacing.screenEdge,
              child: Row(
                children: [
                  if (_currentPage > 0)
                    Expanded(
                      child: OutlinedButtonCustom(
                        label: 'Previous',
                        onPressed: () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                      ),
                    ),
                  if (_currentPage > 0) SizedBox(width: AppSpacing.md),
                  Expanded(
                    flex: _currentPage > 0 ? 1 : 2,
                    child: PrimaryButton(
                      label: _currentPage == _pages.length - 1
                          ? 'Get Started'
                          : 'Next',
                      icon: _currentPage == _pages.length - 1
                          ? Icons.check
                          : Icons.arrow_forward,
                      onPressed: _nextPage,
                      fullWidth: true,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class OnboardingPage {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}

class _OnboardingPageView extends StatelessWidget {
  final OnboardingPage page;

  const _OnboardingPageView({required this.page});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: AppSpacing.screenEdge,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: page.color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              page.icon,
              size: 100,
              color: page.color,
            ),
          ),

          SizedBox(height: AppSpacing.xxl),

          // Title
          Text(
            page.title,
            style: AppTextStyles.h1.copyWith(
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),

          SizedBox(height: AppSpacing.lg),

          // Description
          Text(
            page.description,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

