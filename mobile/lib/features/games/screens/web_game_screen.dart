import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

class WebGameScreen extends StatefulWidget {
  final String title;
  final String url;

  const WebGameScreen({super.key, required this.title, required this.url});

  @override
  State<WebGameScreen> createState() => _WebGameScreenState();
}

class _WebGameScreenState extends State<WebGameScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    // 1. Lock orientation to landscape
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    // 2. Hide system UI for immersive experience
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            _injectResponsiveFixes();
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  void _injectResponsiveFixes() {
    // 3. Simple "Desktop Mode" Injection
    // Setting width=1280 forces the browser to render as if it's on a desktop screen of that width.
    // On a mobile device, the browser will automatically zoom out to fit this 1280px into the screen width.
    // This "zoom out" effect usually ensures that the height (typically 768px or less for these games)
    // also fits comfortably within the mobile screen height.
    const js = '''
      (function() {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'width=1280, initial-scale=1.0, user-scalable=yes');
        
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.backgroundColor = '#000';
      })();
    ''';
    _controller.runJavaScript(js);
  }

  @override
  void dispose() {
    // 4. Reset orientation and system UI on exit
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      // 5. SafeArea ensures we respect the notch/home indicator ("blue box")
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: WebViewWidget(controller: _controller),
            ),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            Positioned(
              top: 10,
              left: 10,
              child: FloatingActionButton(
                mini: true,
                backgroundColor: Colors.black.withOpacity(0.5),
                child: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}