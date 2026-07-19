import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/teacher_service.dart';

/// Teacher State
class TeacherState {
  final List<Map<String, dynamic>> classes;
  final Map<String, dynamic>? selectedClass;
  final List<Map<String, dynamic>>? students;
  final bool isLoading;
  final String? error;

  TeacherState({
    this.classes = const [],
    this.selectedClass,
    this.students,
    this.isLoading = false,
    this.error,
  });

  TeacherState copyWith({
    List<Map<String, dynamic>>? classes,
    Map<String, dynamic>? selectedClass,
    List<Map<String, dynamic>>? students,
    bool? isLoading,
    String? error,
  }) {
    return TeacherState(
      classes: classes ?? this.classes,
      selectedClass: selectedClass ?? this.selectedClass,
      students: students ?? this.students,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Teacher Notifier
class TeacherNotifier extends StateNotifier<TeacherState> {
  final TeacherService _teacherService;

  TeacherNotifier(this._teacherService) : super(TeacherState()) {
    loadClasses();
  }

  /// Load teacher's classes
  Future<void> loadClasses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final classes = await _teacherService.getClasses();
      state = state.copyWith(
        classes: classes,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Select a class
  Future<void> selectClass(String classId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final classData = await _teacherService.getClassStudents(classId);
      final students = classData['studentIds'] as List? ?? [];
      
      state = state.copyWith(
        selectedClass: classData,
        students: List<Map<String, dynamic>>.from(students),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Start drill for selected class
  Future<void> startDrill(String drillType) async {
    if (state.selectedClass == null) {
      state = state.copyWith(error: 'No class selected');
      return;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final classId = state.selectedClass!['_id'] as String? ?? 
                      state.selectedClass!['id'] as String? ?? '';
      await _teacherService.startDrill(classId, drillType);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Mark student participation
  Future<void> markParticipation(String studentId, bool participated) async {
    if (state.selectedClass == null) {
      return;
    }

    try {
      final classId = state.selectedClass!['_id'] as String? ?? 
                      state.selectedClass!['id'] as String? ?? '';
      await _teacherService.markParticipation(classId, studentId, participated);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Teacher Service Provider
final teacherServiceProvider = Provider<TeacherService>((ref) {
  return TeacherService();
});

/// Teacher State Provider
final teacherProvider = StateNotifierProvider<TeacherNotifier, TeacherState>((ref) {
  final teacherService = ref.watch(teacherServiceProvider);
  return TeacherNotifier(teacherService);
});

