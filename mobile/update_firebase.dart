import 'dart:io';

void main() {
  var file = File('pubspec.yaml');
  var content = file.readAsStringSync();
  content = content.replaceAll(RegExp(r'firebase_core:.*'), 'firebase_core: ^3.6.0');
  content = content.replaceAll(RegExp(r'firebase_auth:.*'), 'firebase_auth: ^5.3.1');
  content = content.replaceAll(RegExp(r'firebase_messaging:.*'), 'firebase_messaging: ^15.1.3');
  file.writeAsStringSync(content);
}
