/**
 * Phase 201: Alert Sound Service
 * Plays sound alerts for IoT device disasters
 */

export class AlertSoundService {
  private static audioContext: AudioContext | null = null;
  private static isEnabled: boolean = true;
  private static isPlaying: boolean = false;

  static init() {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  static getEnabled(): boolean {
    return this.isEnabled;
  }

  static async playAlertSound(alertType: string): Promise<void> {
    if (!this.isEnabled || this.isPlaying || !this.audioContext) return;

    try {
      this.isPlaying = true;

      switch (alertType.toUpperCase()) {
        case 'FIRE':
          await this.playFireSound();
          break;
        case 'FLOOD':
          await this.playFloodSound();
          break;
        case 'EARTHQUAKE':
          await this.playEarthquakeSound();
          break;
        default:
          await this.playGenericAlertSound();
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  private static async playFireSound(): Promise<void> {
    // Fire alarm: High-low siren pattern
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext!.currentTime);
    oscillator.frequency.setValueAtTime(400, this.audioContext!.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, this.audioContext!.currentTime + 0.4);
    oscillator.frequency.setValueAtTime(400, this.audioContext!.currentTime + 0.6);

    gainNode.gain.setValueAtTime(0.3, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.8);

    oscillator.start(this.audioContext!.currentTime);
    oscillator.stop(this.audioContext!.currentTime + 0.8);

    await new Promise(resolve => setTimeout(resolve, 800));
  }

  private static async playFloodSound(): Promise<void> {
    // Flood alert: Two beeps
    for (let i = 0; i < 2; i++) {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);

      oscillator.start(this.audioContext!.currentTime);
      oscillator.stop(this.audioContext!.currentTime + 0.3);

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private static async playEarthquakeSound(): Promise<void> {
    // Earthquake alert: Low rumble
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 200;
    gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);

    oscillator.start(this.audioContext!.currentTime);
    oscillator.stop(this.audioContext!.currentTime + 0.5);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private static async playGenericAlertSound(): Promise<void> {
    // Generic alert: Single beep
    const oscillator = this.audioContext!.createOscillator();
    const gainNode = this.audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);

    oscillator.frequency.value = 500;
    gainNode.gain.setValueAtTime(0.2, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.3);

    oscillator.start(this.audioContext!.currentTime);
    oscillator.stop(this.audioContext!.currentTime + 0.3);

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  static stop() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.suspend();
    }
    this.isPlaying = false;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  AlertSoundService.init();
}

