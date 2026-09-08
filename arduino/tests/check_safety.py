#!/usr/bin/env python3
"""Run firmware safety regressions using Python 3 and a host C++17 compiler.

Usage: python3 arduino/tests/check_safety.py
Set CXX to choose the compiler. Generated source and binaries use a temporary
folder. No ESP32 board, Arduino SDK, or Python packages are required.

These checks exercise the real sketches with mocked hardware/network APIs.
They do not prove TLS handshakes, FreeRTOS scheduling, or hardware alarm timing.
"""

import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile


CHECKS = r'''
int main() {
  BACKEND_URL = "https://example.invalid";
  startNetworking();
  assert(alertQueue == nullptr && telemetryQueue == nullptr); // Missing CA fails closed.

  BACKEND_ROOT_CA = "host-test-placeholder"; // No real TLS connection in these checks.
  startNetworking();
  assert(alertQueue && telemetryQueue);
  loop();
  assert(sensorReads == 3);
  assert(!events.empty() && events.front() == "buzzer");
  assert(buzzerValue == HIGH);
  assert(alertQueue->values.size() == 1);
  assert(telemetryQueue->values.size() == 1);
  assert(httpCalls == 0 && wifiCalls == 0 && largestDelay <= 20);

  // Simultaneous shaking cannot silence a local fire alarm.
  acceleration = 20.0f;
  nowValue = 10100;
  events.clear();
  loop();
  assert(events.front() == "buzzer" && buzzerValue == HIGH);

  // Flood alarms remain local when Wi-Fi is unavailable.
  flameValue = HIGH;
  waterValue = 3000;
  nowValue = 12000;
  events.clear();
  loop();
  assert(events.front() == "buzzer" && buzzerValue == HIGH);

  // Full queues do not stop the next sample, block, or grow indefinitely.
  while (queueAlert(1, 0, 0)) {}
  nowValue = 20000;
  const int readsBeforeFullQueue = sensorReads;
  events.clear();
  loop();
  assert(sensorReads == readsBeforeFullQueue + 3);
  assert(events.front() == "buzzer" && alertQueue->values.size() == 6);
  assert(telemetryQueue->values.size() == 1);
  assert(httpCalls == 0 && wifiCalls == 0 && largestDelay <= 20);

  // Also check a connected network: connection guards must not mask loop HTTP calls.
  wifiState = WL_CONNECTED;
  nowValue = 30000;
  events.clear();
  loop();
  assert(events.front() == "buzzer" && buzzerValue == HIGH);
  assert(httpCalls == 0 && wifiCalls == 0 && largestDelay <= 20);

  // Returning to safety clears the buzzer.
  waterValue = 0;
  acceleration = 9.81f;
  nowValue = 30100;
  loop();
  assert(buzzerValue == LOW);
  vQueueDelete(alertQueue);
  vQueueDelete(telemetryQueue);
}
'''


def main():
    tests_dir = Path(__file__).resolve().parent
    compiler = shlex.split(os.environ.get("CXX", "c++"))
    if not compiler or not shutil.which(compiler[0]):
        raise SystemExit("A host C++17 compiler is required. Install one or set CXX.")

    with tempfile.TemporaryDirectory(prefix="kavach-safety-") as temporary:
        output_dir = Path(temporary)
        for name in ("integrated", "enhanced"):
            sketch = tests_dir.parent / f"esp_code_{name}.ino"
            # Replace platform includes with doubles; preserve the sketch's code.
            source = re.sub(r"^[ \t]*#include[^\n]*\n", "", sketch.read_text(encoding="utf-8"), flags=re.MULTILINE)
            generated = output_dir / f"{name}.cpp"
            generated.write_text('#include "safety_mock.h"\n' + source + CHECKS, encoding="utf-8")
            executable = output_dir / name
            subprocess.run(
                compiler + ["-std=c++17", "-I", str(tests_dir), str(generated), "-o", str(executable)],
                check=True,
            )
            subprocess.run([str(executable)], check=True, timeout=10)
            print(f"{name}: host safety checks passed", flush=True)


if __name__ == "__main__":
    main()
