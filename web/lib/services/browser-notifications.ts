/**
 * Phase 201: Browser Notification Service
 * Handles browser notifications for IoT alerts
 */

export class BrowserNotificationService {
  private static permission: NotificationPermission = 'default';
  private static isSupported: boolean = false;

  static init() {
    if (typeof window === 'undefined') return;
    
    this.isSupported = 'Notification' in window;
    
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser notifications not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported) {
      console.warn('Browser notifications not supported');
      return;
    }

    if (this.permission !== 'granted') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        ...options,
      });

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  static showIoTAlert(alertData: {
    alertType: string;
    deviceName: string;
    deviceId: string;
    severity?: string;
    sensorData?: any;
  }) {
    const alertType = alertData.alertType?.toUpperCase() || 'ALERT';
    const deviceName = alertData.deviceName || 'Unknown Device';
    
    let title = '';
    let body = '';
    
    if (alertType === 'FIRE') {
      title = '🔥 Fire Detected!';
      body = `Fire detected at ${deviceName}. Immediate action required!`;
    } else if (alertType === 'FLOOD') {
      title = '🌊 Flood Alert!';
      const waterLevel = alertData.sensorData?.water;
      body = `Flood alert at ${deviceName}${waterLevel ? ` (Water Level: ${waterLevel})` : ''}`;
    } else if (alertType === 'EARTHQUAKE') {
      title = '⚠️ Earthquake Detected!';
      const magnitude = alertData.sensorData?.magnitude;
      body = `Earthquake detected at ${deviceName}${magnitude ? ` (Magnitude: ${magnitude.toFixed(2)}G)` : ''}`;
    } else {
      title = '⚠️ Device Alert';
      body = `Alert from ${deviceName}`;
    }

    this.showNotification(title, {
      body,
      tag: `iot-alert-${alertData.deviceId}`, // Prevent duplicate notifications
      requireInteraction: alertType === 'FIRE' || alertData.severity === 'CRITICAL',
      data: {
        url: `/devices?deviceId=${alertData.deviceId}`,
        deviceId: alertData.deviceId,
        alertType,
      },
    });
  }

  static getPermission(): NotificationPermission {
    return this.permission;
  }

  static isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  BrowserNotificationService.init();
}

