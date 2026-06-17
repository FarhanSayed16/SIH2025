class AlertModel {
  final String id;
  final String ndmaId;
  final String title;
  final String? description;
  final String severity;
  final String alertType;
  final List<String> affectedAreas;
  final AlertLocation? location;
  final DateTime issuedDate;
  final DateTime? expiryDate;
  final String? sourceUrl;
  final bool isActive;

  AlertModel({
    required this.id,
    required this.ndmaId,
    required this.title,
    this.description,
    required this.severity,
    required this.alertType,
    required this.affectedAreas,
    this.location,
    required this.issuedDate,
    this.expiryDate,
    this.sourceUrl,
    required this.isActive,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      id: (json['_id'] ?? '').toString(),
      ndmaId: (json['ndmaId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      severity: (json['severity'] ?? 'medium').toString(),
      alertType: (json['alertType'] ?? 'other').toString(),
      affectedAreas: json['affectedAreas'] != null
          ? List<String>.from((json['affectedAreas'] as List).map((e) => e.toString()))
          : [],
      location: json['location'] != null
          ? AlertLocation.fromJson(json['location'] as Map<String, dynamic>)
          : null,
      issuedDate: DateTime.parse(json['issuedDate'].toString()),
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'].toString())
          : null,
      sourceUrl: json['sourceUrl']?.toString(),
      isActive: json['isActive'] == true || json['isActive'] == 'true',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'ndmaId': ndmaId,
      'title': title,
      'description': description,
      'severity': severity,
      'alertType': alertType,
      'affectedAreas': affectedAreas,
      'location': location?.toJson(),
      'issuedDate': issuedDate.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'sourceUrl': sourceUrl,
      'isActive': isActive,
    };
  }

  AlertModel copyWith({
    String? id,
    String? ndmaId,
    String? title,
    String? description,
    String? severity,
    String? alertType,
    List<String>? affectedAreas,
    AlertLocation? location,
    DateTime? issuedDate,
    DateTime? expiryDate,
    String? sourceUrl,
    bool? isActive,
  }) {
    return AlertModel(
      id: id ?? this.id,
      ndmaId: ndmaId ?? this.ndmaId,
      title: title ?? this.title,
      description: description ?? this.description,
      severity: severity ?? this.severity,
      alertType: alertType ?? this.alertType,
      affectedAreas: affectedAreas ?? this.affectedAreas,
      location: location ?? this.location,
      issuedDate: issuedDate ?? this.issuedDate,
      expiryDate: expiryDate ?? this.expiryDate,
      sourceUrl: sourceUrl ?? this.sourceUrl,
      isActive: isActive ?? this.isActive,
    );
  }
}

class AlertLocation {
  final String type;
  final List<double> coordinates;
  final double radius;

  AlertLocation({
    required this.type,
    required this.coordinates,
    required this.radius,
  });

  factory AlertLocation.fromJson(Map<String, dynamic> json) {
    return AlertLocation(
      type: (json['type'] ?? 'Point').toString(),
      coordinates: json['coordinates'] != null
          ? List<double>.from((json['coordinates'] as List).map((e) => (e as num).toDouble()))
          : [0.0, 0.0],
      radius: (json['radius'] as num?)?.toDouble() ?? 50000.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'coordinates': coordinates,
      'radius': radius,
    };
  }
}
