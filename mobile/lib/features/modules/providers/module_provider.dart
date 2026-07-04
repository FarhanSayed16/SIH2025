/// Phase 3.1.1: Module Provider
/// State management for modules with filtering and caching

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/module_model.dart';
import '../services/module_service.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/api_service_provider.dart';

final moduleServiceProvider = Provider<ModuleService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ModuleService(apiService: apiService);
});

final moduleListProvider =
    StateNotifierProvider<ModuleListNotifier, ModuleListState>((ref) {
  return ModuleListNotifier(ref.read(moduleServiceProvider));
});

class ModuleListState {
  final List<ModuleModel> modules;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic> filters;
  final int currentPage;
  final int totalPages;
  final bool hasMore;

  ModuleListState({
    this.modules = const [],
    this.isLoading = false,
    this.error,
    Map<String, dynamic>? filters,
    this.currentPage = 1,
    this.totalPages = 1,
    this.hasMore = true,
  }) : filters = filters ?? {};

  ModuleListState copyWith({
    List<ModuleModel>? modules,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? filters,
    int? currentPage,
    int? totalPages,
    bool? hasMore,
  }) {
    return ModuleListState(
      modules: modules ?? this.modules,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      filters: filters ?? this.filters,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ModuleListNotifier extends StateNotifier<ModuleListState> {
  final ModuleService _moduleService;
  final StorageService _storageService = StorageService();

  ModuleListNotifier(this._moduleService) : super(ModuleListState()) {
    loadModules();
  }

  /// Load modules with current filters
  Future<void> loadModules({bool refresh = false}) async {
    if (state.isLoading && !refresh) return;

    state = state.copyWith(
      isLoading: true,
      error: null,
      currentPage: refresh ? 1 : state.currentPage,
    );

    try {
      // Try to load from cache first if offline
      if (refresh) {
        // Try API first
        try {
          final modules = await _moduleService.getModules(
            page: state.currentPage,
            type: state.filters['type'] as String?,
            category: state.filters['category'] as String?,
            difficulty: state.filters['difficulty'] as String?,
            gradeLevel: state.filters['gradeLevel'] as String?,
            tags: state.filters['tags'] != null
                ? List<String>.from(state.filters['tags'] as List)
                : null,
            search: state.filters['search'] as String?,
            sortBy: state.filters['sortBy'] as String?,
            sortOrder: state.filters['sortOrder'] as String?,
          );

          // Cache modules
          await _cacheModules(modules);

          state = state.copyWith(
            modules: refresh ? modules : [...state.modules, ...modules],
            isLoading: false,
            hasMore: modules.length >= 10, // Assuming 10 per page
          );
        } catch (e) {
          // If API fails, try cache
          final cachedModules = await _loadCachedModules();
          if (cachedModules.isNotEmpty) {
            state = state.copyWith(
              modules: cachedModules,
              isLoading: false,
              error: 'Using cached data. Check your connection.',
            );
          } else {
            throw e;
          }
        }
      } else {
        // Load from cache first
        final cachedModules = await _loadCachedModules();
        if (cachedModules.isNotEmpty) {
          state = state.copyWith(
            modules: cachedModules,
            isLoading: false,
          );
        }

        // Then try to sync from API
        try {
          final modules = await _moduleService.getModules(
            page: state.currentPage,
            type: state.filters['type'] as String?,
            category: state.filters['category'] as String?,
            difficulty: state.filters['difficulty'] as String?,
            gradeLevel: state.filters['gradeLevel'] as String?,
            tags: state.filters['tags'] != null
                ? List<String>.from(state.filters['tags'] as List)
                : null,
            search: state.filters['search'] as String?,
            sortBy: state.filters['sortBy'] as String?,
            sortOrder: state.filters['sortOrder'] as String?,
          );

          await _cacheModules(modules);

          state = state.copyWith(
            modules: modules,
            isLoading: false,
          );
        } catch (e) {
          // If API fails but we have cache, keep cache
          if (cachedModules.isNotEmpty) {
            state = state.copyWith(
              error: 'Using cached data. Check your connection.',
            );
          } else {
            state = state.copyWith(
              isLoading: false,
              error: e.toString(),
            );
          }
        }
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Apply filters and reload
  Future<void> applyFilters(Map<String, dynamic> newFilters) async {
    state = state.copyWith(filters: newFilters);
    await loadModules(refresh: true);
  }

  /// Load more modules (pagination)
  Future<void> loadMore() async {
    if (!state.hasMore || state.isLoading) return;

    state = state.copyWith(currentPage: state.currentPage + 1);
    await loadModules();
  }

  /// Cache modules to Hive
  Future<void> _cacheModules(List<ModuleModel> modules) async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final modulesJson = modules.map((m) => m.toJson()).toList();
      await box.put('modules', modulesJson);
      await box.put('lastSync', DateTime.now().toIso8601String());
    } catch (e) {
      print('Error caching modules: $e');
    }
  }

  /// Load modules from cache
  Future<List<ModuleModel>> _loadCachedModules() async {
    try {
      final box = await _storageService.openBox(AppConstants.modulesBox);
      final modulesData = box.get('modules');

      if (modulesData is List) {
        return modulesData
            .map((json) {
              try {
                // Ensure proper type casting from dynamic to Map<String, dynamic>
                Map<String, dynamic> map;
                if (json is Map<String, dynamic>) {
                  map = json;
                } else if (json is Map) {
                  // Handle Map<dynamic, dynamic> by converting all keys and values recursively
                  map = _convertToMapStringDynamic(json);
                } else {
                  // If it's not a map, skip it
                  throw Exception(
                      'Invalid module data type: ${json.runtimeType}');
                }
                return ModuleModel.fromJson(map);
              } catch (e) {
                print('Error parsing module from cache: $e');
                // Skip this module instead of rethrowing to continue with others
                return null;
              }
            })
            .whereType<ModuleModel>()
            .toList();
      }
    } catch (e) {
      print('Error loading cached modules: $e');
    }
    return [];
  }

  /// Recursively convert Map<dynamic, dynamic> to Map<String, dynamic>
  Map<String, dynamic> _convertToMapStringDynamic(dynamic input) {
    if (input is Map<String, dynamic>) {
      return input;
    } else if (input is Map) {
      return input.map((key, value) {
        final stringKey = key.toString();
        if (value is Map) {
          return MapEntry(stringKey, _convertToMapStringDynamic(value));
        } else if (value is List) {
          return MapEntry(
              stringKey,
              value.map((item) {
                if (item is Map) {
                  return _convertToMapStringDynamic(item);
                }
                return item;
              }).toList());
        }
        return MapEntry(stringKey, value);
      });
    }
    return {};
  }
}

/// Provider for individual module
final moduleProvider = FutureProvider.family<ModuleModel, String>((ref, id) {
  final moduleService = ref.read(moduleServiceProvider);
  return moduleService.getModuleById(id);
});
