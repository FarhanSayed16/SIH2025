import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:kavach/core/config/env.dart';
import '../services/map_data_service.dart';
import '../models/map_models.dart';

class BlueprintMapScreen extends StatefulWidget {
  final String schoolId;
  final int? floor;
  final String? title;

  const BlueprintMapScreen({
    Key? key,
    required this.schoolId,
    this.floor,
    this.title,
  }) : super(key: key);

  @override
  State<BlueprintMapScreen> createState() => _BlueprintMapScreenState();
}

class _BlueprintMapScreenState extends State<BlueprintMapScreen> {
  final MapDataService _mapDataService = MapDataService();
  Future<MapDataModel>? _future;
  int? _floorFilter;
  NavigationRouteModel? _route;
  final _fromX = TextEditingController();
  final _fromY = TextEditingController();
  final _toX = TextEditingController();
  final _toY = TextEditingController();

  @override
  void initState() {
    super.initState();
    _floorFilter = widget.floor;
    _future = _mapDataService.getMapData(widget.schoolId, floor: _floorFilter);
  }

  void _reload() {
    setState(() {
      _future =
          _mapDataService.getMapData(widget.schoolId, floor: _floorFilter);
      _route = null;
    });
  }

  Future<void> _requestRoute() async {
    try {
      final fx = double.tryParse(_fromX.text);
      final fy = double.tryParse(_fromY.text);
      final tx = double.tryParse(_toX.text);
      final ty = double.tryParse(_toY.text);
      if (fx == null || fy == null || tx == null || ty == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter valid from/to coordinates')),
        );
        return;
      }
      final r = await _mapDataService.getNavigationRoute(
        schoolId: widget.schoolId,
        fromX: fx,
        fromY: fy,
        toX: tx,
        toY: ty,
        floor: _floorFilter,
      );
      setState(() {
        _route = r;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Route error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.title ?? 'Blueprint Map';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _reload,
          ),
        ],
      ),
      body: FutureBuilder<MapDataModel>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _MapUnavailableBody(
              message: 'Failed to load blueprint map. Check your connection.',
              onRetry: _reload,
            );
          }
          final data = snapshot.data;
          if (data == null || data.blueprint?.imageUrl == null) {
            return _MapUnavailableBody(
              message: 'No blueprint available for this school. Upload a floor plan in the admin dashboard, or open the web map.',
              onRetry: _reload,
            );
          }

          final blueprint = data.blueprint!;
          final width = blueprint.width ?? 1000;
          final height = blueprint.height ?? 1000;

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Text('Floor:'),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 80,
                      child: TextField(
                        decoration: const InputDecoration(
                          isDense: true,
                          hintText: 'e.g., 0',
                        ),
                        keyboardType: TextInputType.number,
                        controller: TextEditingController(
                          text: _floorFilter?.toString() ?? '',
                        ),
                        onSubmitted: (val) {
                          final parsed = int.tryParse(val);
                          setState(() {
                            _floorFilter = parsed;
                          });
                          _reload();
                        },
                      ),
                    ),
                    const Spacer(),
                    _Legend(),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: Row(
                  children: [
                    Flexible(
                      child: TextField(
                        controller: _fromX,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(isDense: true, labelText: 'From X'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: TextField(
                        controller: _fromY,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(isDense: true, labelText: 'From Y'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: TextField(
                        controller: _toX,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(isDense: true, labelText: 'To X'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: TextField(
                        controller: _toY,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(isDense: true, labelText: 'To Y'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _requestRoute,
                      child: const Text('Route'),
                    )
                  ],
                ),
              ),
              Expanded(
                child: _BlueprintView(
                  imageUrl: blueprint.floors
                          .firstWhere(
                            (f) => f.floorNumber == _floorFilter,
                            orElse: () => FloorModel(),
                          )
                          .blueprintImageUrl ??
                      blueprint.imageUrl!,
                  imageWidth: width,
                  imageHeight: height,
                  equipment: data.equipment,
                  exits: data.exits,
                  rooms: data.rooms,
                  hazards: data.hazards,
                  route: _route,
                  schoolId: widget.schoolId,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _BlueprintView extends StatefulWidget {
  final String imageUrl;
  final double imageWidth;
  final double imageHeight;
  final List<SafetyEquipmentModel> equipment;
  final List<ExitPointModel> exits;
  final List<RoomModel> rooms;
  final List<HazardModel> hazards;
  final NavigationRouteModel? route;
  final String schoolId;

  const _BlueprintView({
    required this.imageUrl,
    required this.imageWidth,
    required this.imageHeight,
    required this.equipment,
    required this.exits,
    required this.rooms,
    required this.hazards,
    this.route,
    required this.schoolId,
  });

  @override
  State<_BlueprintView> createState() => _BlueprintViewState();
}

class _BlueprintViewState extends State<_BlueprintView> {
  final TransformationController _transformationController = TransformationController();

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final scaleX = constraints.maxWidth / widget.imageWidth;
        final scaleY = constraints.maxHeight / widget.imageHeight;
        final scale = scaleX < scaleY ? scaleX : scaleY;
        final displayWidth = widget.imageWidth * scale;
        final displayHeight = widget.imageHeight * scale;

        Offset toPosition(double? x, double? y) {
          final dx = (x ?? 0) * scale;
          final dy = (y ?? 0) * scale;
          return Offset(dx, dy);
        }

        return InteractiveViewer(
          transformationController: _transformationController,
          minScale: 0.5,
          maxScale: 4.0,
          boundaryMargin: const EdgeInsets.all(double.infinity),
          child: Center(
            child: SizedBox(
              width: displayWidth,
              height: displayHeight,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: widget.imageUrl,
                    fit: BoxFit.contain,
                    errorWidget: (_, __, ___) =>
                        const Center(child: Text('Image load error')),
                  ),
                // Grid overlay (optional visual aid)
                Positioned.fill(
                  child: CustomPaint(
                    painter: _GridPainter(
                      step: 100, // blueprint units
                      color: Colors.grey.withOpacity(0.15),
                    ),
                  ),
                ),
                if (widget.route != null && widget.route!.route.isNotEmpty)
                  Positioned.fill(
                    child: CustomPaint(
                      painter: _RoutePainter(
                        points: widget.route!.route
                            .map((p) => Offset(
                                  (p.x / widget.imageWidth) * displayWidth,
                                  (p.y / widget.imageHeight) * displayHeight,
                                ))
                            .toList(),
                      ),
                    ),
                  ),
                ...widget.equipment.map((e) {
                  final pos = toPosition(e.x, e.y);
                  return Positioned(
                    left: pos.dx - 8,
                    top: pos.dy - 8,
                    child: GestureDetector(
                      onTap: () => _showEquipmentDetails(context, e),
                      child: _Marker(
                        color: Colors.redAccent,
                        label: e.name,
                        tooltip: '${e.type} • ${e.status ?? 'active'}',
                      ),
                    ),
                  );
                }),
                ...widget.exits.map((ex) {
                  final pos = toPosition(ex.x, ex.y);
                  return Positioned(
                    left: pos.dx - 8,
                    top: pos.dy - 8,
                    child: GestureDetector(
                      onTap: () => _showExitDetails(context, ex),
                      child: _Marker(
                        color: Colors.green,
                        label: ex.name,
                        tooltip: 'Exit • ${ex.type}',
                      ),
                    ),
                  );
                }),
                ...widget.rooms.map((r) {
                  final pos = toPosition(r.x, r.y);
                  return Positioned(
                    left: pos.dx - 8,
                    top: pos.dy - 8,
                    child: GestureDetector(
                      onTap: () => _showRoomDetails(context, r),
                      child: _Marker(
                        color: Colors.blue,
                        label: r.name,
                        tooltip: r.roomType ?? 'Room',
                      ),
                    ),
                  );
                }),
                ...widget.hazards.map((h) {
                  final pos = toPosition(h.x, h.y);
                  return Positioned(
                    left: pos.dx - 8,
                    top: pos.dy - 8,
                    child: GestureDetector(
                      onTap: () => _showHazardDetails(context, h),
                      child: _Marker(
                        color: Colors.orange,
                        label: h.type ?? 'Hazard',
                        tooltip: h.description ?? 'Hazard',
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        );
      },
    );
  }

  void _showEquipmentDetails(BuildContext context, SafetyEquipmentModel equipment) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _EquipmentDetailSheet(equipment: equipment),
    );
  }

  void _showExitDetails(BuildContext context, ExitPointModel exit) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _ExitDetailSheet(exit: exit),
    );
  }

  void _showRoomDetails(BuildContext context, RoomModel room) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _RoomDetailSheet(room: room),
    );
  }

  void _showHazardDetails(BuildContext context, HazardModel hazard) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => _HazardDetailSheet(hazard: hazard),
    );
  }
}

class _Marker extends StatelessWidget {
  final Color color;
  final String label;
  final String tooltip;

  const _Marker({
    required this.color,
    required this.label,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 2,
                  offset: Offset(0, 1),
                )
              ],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: Colors.black87),
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    Widget item(Color color, String text) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(fontSize: 12)),
        ],
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        item(Colors.redAccent, 'Equipment'),
        const SizedBox(width: 8),
        item(Colors.green, 'Exit'),
        const SizedBox(width: 8),
        item(Colors.blue, 'Room'),
        const SizedBox(width: 8),
        item(Colors.orange, 'Hazard'),
      ],
    );
  }
}

class _RoutePainter extends CustomPainter {
  final List<Offset> points;
  const _RoutePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    final paint = Paint()
      ..color = Colors.orangeAccent
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(path, paint);

    final dotPaint = Paint()
      ..color = Colors.orangeAccent
      ..style = PaintingStyle.fill;
    for (final p in points) {
      canvas.drawCircle(p, 4, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _RoutePainter oldDelegate) {
    return oldDelegate.points != points;
  }
}

class _GridPainter extends CustomPainter {
  final double step;
  final Color color;

  _GridPainter({required this.step, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) {
    return oldDelegate.step != step || oldDelegate.color != color;
  }
}

// Equipment Detail Bottom Sheet
class _EquipmentDetailSheet extends StatelessWidget {
  final SafetyEquipmentModel equipment;

  const _EquipmentDetailSheet({required this.equipment});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Colors.redAccent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  equipment.name,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _DetailRow('Type', equipment.type),
          if (equipment.status != null) _DetailRow('Status', equipment.status!),
          if (equipment.floor != null) _DetailRow('Floor', 'Floor ${equipment.floor}'),
          if (equipment.x != null && equipment.y != null)
            _DetailRow('Location', '(${equipment.x!.toStringAsFixed(0)}, ${equipment.y!.toStringAsFixed(0)})'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

// Exit Detail Bottom Sheet
class _ExitDetailSheet extends StatelessWidget {
  final ExitPointModel exit;

  const _ExitDetailSheet({required this.exit});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  exit.name,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _DetailRow('Type', exit.type),
          if (exit.floor != null) _DetailRow('Floor', 'Floor ${exit.floor}'),
          if (exit.x != null && exit.y != null)
            _DetailRow('Location', '(${exit.x!.toStringAsFixed(0)}, ${exit.y!.toStringAsFixed(0)})'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

// Room Detail Bottom Sheet
class _RoomDetailSheet extends StatelessWidget {
  final RoomModel room;

  const _RoomDetailSheet({required this.room});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  room.name,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (room.roomType != null) _DetailRow('Type', room.roomType!),
          if (room.floor != null) _DetailRow('Floor', 'Floor ${room.floor}'),
          if (room.x != null && room.y != null)
            _DetailRow('Location', '(${room.x!.toStringAsFixed(0)}, ${room.y!.toStringAsFixed(0)})'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

// Hazard Detail Bottom Sheet
class _HazardDetailSheet extends StatelessWidget {
  final HazardModel hazard;

  const _HazardDetailSheet({required this.hazard});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Colors.orange,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  hazard.type ?? 'Hazard',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (hazard.description != null) _DetailRow('Description', hazard.description!),
          if (hazard.floor != null) _DetailRow('Floor', 'Floor ${hazard.floor}'),
          if (hazard.x != null && hazard.y != null)
            _DetailRow('Location', '(${hazard.x!.toStringAsFixed(0)}, ${hazard.y!.toStringAsFixed(0)})'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ),
        ],
      ),
    );
  }
}

// Reusable Detail Row Widget
class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}

class _MapUnavailableBody extends StatelessWidget {
  const _MapUnavailableBody({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  Future<void> _openMapInBrowser() async {
    final base = Uri.parse(Env.baseUrl);
    final webPort = base.port == 3000 ? 3001 : base.port;
    final webUri = base.replace(port: webPort);
    final mapUri = Uri.parse('$webUri/map');
    if (await canLaunchUrl(mapUri)) {
      await launchUrl(mapUri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.map_outlined, size: 56, color: Theme.of(context).colorScheme.primary.withOpacity(0.6)),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 12,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh, size: 20),
                  label: const Text('Retry'),
                ),
                OutlinedButton.icon(
                  onPressed: _openMapInBrowser,
                  icon: const Icon(Icons.open_in_browser, size: 20),
                  label: const Text('Open map in browser'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
