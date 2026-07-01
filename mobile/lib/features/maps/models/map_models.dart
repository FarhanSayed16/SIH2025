class BlueprintModel {
  final String? imageUrl;
  final String? pdfUrl;
  final double? width;
  final double? height;
  final double? scale;
  final List<FloorModel> floors;

  const BlueprintModel({
    this.imageUrl,
    this.pdfUrl,
    this.width,
    this.height,
    this.scale,
    this.floors = const [],
  });

  factory BlueprintModel.fromJson(Map<String, dynamic> json) {
    final floorsJson = json['floors'] as List<dynamic>? ?? [];
    return BlueprintModel(
      imageUrl: json['imageUrl'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      width: (json['width'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      scale: (json['scale'] as num?)?.toDouble(),
      floors: floorsJson
          .map((f) => FloorModel.fromJson(f as Map<String, dynamic>))
          .toList(),
    );
  }
}

class FloorModel {
  final int? floorNumber;
  final String? name;
  final String? blueprintImageUrl;
  final double? width;
  final double? height;
  final double? scale;

  FloorModel({
    this.floorNumber,
    this.name,
    this.blueprintImageUrl,
    this.width,
    this.height,
    this.scale,
  });

  factory FloorModel.fromJson(Map<String, dynamic> json) {
    return FloorModel(
      floorNumber: (json['floorNumber'] as num?)?.toInt(),
      name: json['name'] as String?,
      blueprintImageUrl: json['blueprintImageUrl'] as String?,
      width: (json['width'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      scale: (json['scale'] as num?)?.toDouble(),
    );
  }
}

class SafetyEquipmentModel {
  final String id;
  final String name;
  final String type;
  final String? status;
  final int? floor;
  final double? x;
  final double? y;

  SafetyEquipmentModel({
    required this.id,
    required this.name,
    required this.type,
    this.status,
    this.floor,
    this.x,
    this.y,
  });

  factory SafetyEquipmentModel.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>? ?? {};
    final coords = loc['coordinates'] as Map<String, dynamic>? ?? {};
    return SafetyEquipmentModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'other',
      status: json['status'] as String?,
      floor: (loc['floor'] as num?)?.toInt(),
      x: (coords['x'] as num?)?.toDouble(),
      y: (coords['y'] as num?)?.toDouble(),
    );
  }
}

class ExitPointModel {
  final String id;
  final String name;
  final String type;
  final int? floor;
  final double? x;
  final double? y;

  ExitPointModel({
    required this.id,
    required this.name,
    required this.type,
    this.floor,
    this.x,
    this.y,
  });

  factory ExitPointModel.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>? ?? {};
    final coords = loc['coordinates'] as Map<String, dynamic>? ?? {};
    return ExitPointModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'main',
      floor: (loc['floor'] as num?)?.toInt(),
      x: (coords['x'] as num?)?.toDouble(),
      y: (coords['y'] as num?)?.toDouble(),
    );
  }
}

class RoomModel {
  final String id;
  final String name;
  final String? roomType;
  final int? floor;
  final double? x;
  final double? y;

  RoomModel({
    required this.id,
    required this.name,
    this.roomType,
    this.floor,
    this.x,
    this.y,
  });

  factory RoomModel.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>? ?? {};
    final coords = loc['coordinates'] as Map<String, dynamic>? ?? {};
    return RoomModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      roomType: json['roomType'] as String?,
      floor: (loc['floor'] as num?)?.toInt(),
      x: (coords['x'] as num?)?.toDouble(),
      y: (coords['y'] as num?)?.toDouble(),
    );
  }
}

class HazardModel {
  final String id;
  final String? type;
  final String? description;
  final int? floor;
  final double? x;
  final double? y;

  HazardModel({
    required this.id,
    this.type,
    this.description,
    this.floor,
    this.x,
    this.y,
  });

  factory HazardModel.fromJson(Map<String, dynamic> json) {
    final loc = json['location'] as Map<String, dynamic>? ?? {};
    final coords = loc['coordinates'] as Map<String, dynamic>? ?? {};
    return HazardModel(
      id: json['id']?.toString() ?? '',
      type: json['type'] as String?,
      description: json['description'] as String?,
      floor: (loc['floor'] as num?)?.toInt(),
      x: (coords['x'] as num?)?.toDouble(),
      y: (coords['y'] as num?)?.toDouble(),
    );
  }
}

class MapDataModel {
  final BlueprintModel? blueprint;
  final List<SafetyEquipmentModel> equipment;
  final List<ExitPointModel> exits;
  final List<RoomModel> rooms;
  final List<HazardModel> hazards;
  final NavigationRouteModel? route;

  MapDataModel({
    required this.blueprint,
    required this.equipment,
    required this.exits,
    required this.rooms,
    required this.hazards,
    this.route,
  });

  factory MapDataModel.fromJson(Map<String, dynamic> json) {
    final equipmentJson = json['equipment'] as List<dynamic>? ?? [];
    final exitsJson = json['exits'] as List<dynamic>? ?? [];
    final roomsJson = json['rooms'] as List<dynamic>? ?? [];
    final hazardsJson = json['hazards'] as List<dynamic>? ?? [];
    return MapDataModel(
      blueprint: json['blueprint'] != null
          ? BlueprintModel.fromJson(json['blueprint'] as Map<String, dynamic>)
          : null,
      equipment: equipmentJson
          .map((e) => SafetyEquipmentModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      exits: exitsJson
          .map((e) => ExitPointModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      rooms: roomsJson
          .map((r) => RoomModel.fromJson(r as Map<String, dynamic>))
          .toList(),
      hazards: hazardsJson
          .map((h) => HazardModel.fromJson(h as Map<String, dynamic>))
          .toList(),
      route: json['route'] != null
          ? NavigationRouteModel.fromJson(json['route'] as Map<String, dynamic>)
          : null,
    );
  }
}

class NavigationRouteModel {
  final List<RoutePoint> route;
  final double distance;
  final double estimatedTimeSeconds;
  final int? floor;

  NavigationRouteModel({
    required this.route,
    required this.distance,
    required this.estimatedTimeSeconds,
    this.floor,
  });

  factory NavigationRouteModel.fromJson(Map<String, dynamic> json) {
    final pts = json['route'] as List<dynamic>? ?? [];
    return NavigationRouteModel(
      route: pts
          .map((p) => RoutePoint.fromJson(p as Map<String, dynamic>))
          .toList(),
      distance: (json['distance'] as num?)?.toDouble() ?? 0,
      estimatedTimeSeconds:
          (json['estimatedTimeSeconds'] as num?)?.toDouble() ?? 0,
      floor: (json['floor'] as num?)?.toInt(),
    );
  }
}

class RoutePoint {
  final double x;
  final double y;
  RoutePoint({required this.x, required this.y});
  factory RoutePoint.fromJson(Map<String, dynamic> json) {
    return RoutePoint(
      x: (json['x'] as num?)?.toDouble() ?? 0,
      y: (json['y'] as num?)?.toDouble() ?? 0,
    );
  }
}
