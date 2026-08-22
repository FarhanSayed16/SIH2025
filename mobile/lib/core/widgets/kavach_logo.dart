import 'package:flutter/material.dart';

/// Logo crop settings — keep in sync with web/lib/branding/logo-config.ts (web slots differ).
class LogoCrop {
  const LogoCrop({
    required this.width,
    required this.height,
    required this.borderRadius,
    required this.objectPositionX,
    required this.objectPositionY,
    required this.scale,
    required this.padding,
    this.backgroundColor,
    this.iconOnly = false,
  });

  final double width;
  final double height;
  final double borderRadius;
  /// 0–100, maps to Alignment like web object-position
  final double objectPositionX;
  final double objectPositionY;
  final double scale;
  final double padding;
  final Color? backgroundColor;
  /// When true, crop to the top of the asset (shield mark only).
  final bool iconOnly;

  Alignment get alignment => Alignment(
        (objectPositionX / 50) - 1,
        (objectPositionY / 50) - 1,
      );
}

class KavachLogoConfig {
  KavachLogoConfig._();

  static const assetPath = 'assets/images/branding/kavach_logo.jpeg';

  /// Full mark + wordmark — used on splash
  static const splash = LogoCrop(
    width: 220,
    height: 240,
    borderRadius: 12,
    objectPositionX: 50,
    objectPositionY: 50,
    scale: 1,
    padding: 0,
    iconOnly: false,
  );

  /// Shield only — login uses separate "Kavach" label below
  static const login = LogoCrop(
    width: 88,
    height: 88,
    borderRadius: 44,
    objectPositionX: 50,
    objectPositionY: 18,
    scale: 1,
    padding: 0,
    iconOnly: true,
  );

  static const compact = LogoCrop(
    width: 40,
    height: 40,
    borderRadius: 10,
    objectPositionX: 50,
    objectPositionY: 18,
    scale: 1,
    padding: 2,
    iconOnly: true,
  );
}

enum KavachLogoSize { splash, login, compact }

class KavachLogo extends StatelessWidget {
  const KavachLogo({
    super.key,
    this.size = KavachLogoSize.login,
    this.crop,
  });

  final KavachLogoSize size;
  final LogoCrop? crop;

  LogoCrop get _crop {
    if (crop != null) return crop!;
    switch (size) {
      case KavachLogoSize.splash:
        return KavachLogoConfig.splash;
      case KavachLogoSize.login:
        return KavachLogoConfig.login;
      case KavachLogoSize.compact:
        return KavachLogoConfig.compact;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _crop;
    final innerSize = c.width - (c.padding * 2);
    final innerHeight = c.height - (c.padding * 2);

    final image = Transform.scale(
      scale: c.scale,
      child: Image.asset(
        KavachLogoConfig.assetPath,
        width: innerSize,
        height: innerHeight,
        fit: c.iconOnly ? BoxFit.cover : BoxFit.contain,
        alignment: c.iconOnly ? Alignment.topCenter : c.alignment,
        errorBuilder: (_, __, ___) => Icon(
          Icons.shield,
          size: c.width * 0.45,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );

    return Container(
      width: c.width,
      height: c.height,
      padding: EdgeInsets.all(c.padding),
      decoration: BoxDecoration(
        color: c.backgroundColor,
        borderRadius: BorderRadius.circular(c.borderRadius),
        boxShadow: c.backgroundColor != null
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: image,
    );
  }
}
