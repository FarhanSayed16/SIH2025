/// User model
class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? institutionId;
  final Map<String, double>? currentLocation;
  final String? safetyStatus;
  final bool isActive;
  // Phase 2.5: K-12 Multi-Access fields
  final String? grade;
  final String? section;
  final String? classId;
  final String? accessLevel; // 'full', 'shared', 'teacher_led', 'none'
  final bool? canUseApp;
  final bool? requiresTeacherAuth;
  final String? qrCode;
  final String? qrBadgeId;
  final String? parentId;
  // RBAC Refinement: Approval and user type fields
  final String? userType; // 'account_user' or 'roster_record'
  final String? approvalStatus; // 'pending', 'approved', 'rejected'
  // Accessibility: Physical disability status
  final bool? hasDisability;
  final String? disabilityType; // 'hearing_impaired', 'visual_impaired', 'mobility_impaired', 'other'

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.institutionId,
    this.currentLocation,
    this.safetyStatus,
    this.isActive = true,
    // Phase 2.5 fields
    this.grade,
    this.section,
    this.classId,
    this.accessLevel,
    this.canUseApp,
    this.requiresTeacherAuth,
    this.qrCode,
    this.qrBadgeId,
    this.parentId,
    this.userType,
    this.approvalStatus,
    this.hasDisability,
    this.disabilityType,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Parse currentLocation from GeoJSON format
    Map<String, double>? location;
    if (json['currentLocation'] != null) {
      final locData = json['currentLocation'] as Map<String, dynamic>;
      final coordinates = locData['coordinates'] as List?;
      if (coordinates != null && coordinates.length >= 2) {
        // GeoJSON format: [longitude, latitude]
        location = {
          'longitude': (coordinates[0] is num)
              ? (coordinates[0] as num).toDouble()
              : double.tryParse(coordinates[0].toString()) ?? 0.0,
          'latitude': (coordinates[1] is num)
              ? (coordinates[1] as num).toDouble()
              : double.tryParse(coordinates[1].toString()) ?? 0.0,
        };
      }
    }

    // Handle institutionId - can be string or object
    String? institutionIdStr;
    if (json['institutionId'] != null) {
      if (json['institutionId'] is Map) {
        // Backend sent full institution object, extract ID
        institutionIdStr = (json['institutionId'] as Map)['_id']?.toString();
      } else {
        // Backend sent just the ID string
        institutionIdStr = json['institutionId']?.toString();
      }
    }

    return UserModel(
      id: (json['_id'] as String?) ?? (json['id'] as String?) ?? '',
      email: (json['email'] as String?) ?? '',
      name: (json['name'] as String?) ?? '',
      role: (json['role'] as String?) ?? 'student',
      institutionId: institutionIdStr,
      currentLocation: location,
      safetyStatus: json['safetyStatus'] as String?,
      isActive: (json['isActive'] as bool?) ?? true,
      // Phase 2.5 fields
      grade: json['grade'] as String?,
      section: json['section'] as String?,
      classId: json['classId']?.toString(),
      accessLevel: json['accessLevel'] as String?,
      canUseApp: json['canUseApp'] as bool?,
      requiresTeacherAuth: json['requiresTeacherAuth'] as bool?,
      qrCode: json['qrCode'] as String?,
      qrBadgeId: json['qrBadgeId'] as String?,
      parentId: json['parentId']?.toString(),
      userType: json['userType'] as String?,
      approvalStatus: json['approvalStatus'] as String?,
      hasDisability: json['hasDisability'] as bool? ?? false,
      disabilityType: json['disabilityType'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'institutionId': institutionId,
      'currentLocation': currentLocation,
      'safetyStatus': safetyStatus,
      'isActive': isActive,
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? name,
    String? role,
    String? institutionId,
    Map<String, double>? currentLocation,
    String? safetyStatus,
    bool? isActive,
    String? grade,
    String? section,
    String? classId,
    String? accessLevel,
    bool? canUseApp,
    bool? requiresTeacherAuth,
    String? qrCode,
    String? qrBadgeId,
    String? parentId,
    String? userType,
    String? approvalStatus,
    bool? hasDisability,
    String? disabilityType,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      institutionId: institutionId ?? this.institutionId,
      currentLocation: currentLocation ?? this.currentLocation,
      safetyStatus: safetyStatus ?? this.safetyStatus,
      isActive: isActive ?? this.isActive,
      grade: grade ?? this.grade,
      section: section ?? this.section,
      classId: classId ?? this.classId,
      accessLevel: accessLevel ?? this.accessLevel,
      canUseApp: canUseApp ?? this.canUseApp,
      requiresTeacherAuth: requiresTeacherAuth ?? this.requiresTeacherAuth,
      qrCode: qrCode ?? this.qrCode,
      qrBadgeId: qrBadgeId ?? this.qrBadgeId,
      parentId: parentId ?? this.parentId,
      userType: userType ?? this.userType,
      approvalStatus: approvalStatus ?? this.approvalStatus,
      hasDisability: hasDisability ?? this.hasDisability,
      disabilityType: disabilityType ?? this.disabilityType,
    );
  }
}
