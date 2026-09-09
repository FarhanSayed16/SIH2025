/**
 * Socket.io client service for real-time events
 */

import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';

export type SocketEvent =
  | 'DRILL_SCHEDULED'
  | 'CRISIS_ALERT'
  | 'DRILL_SUMMARY'
  | 'STUDENT_STATUS_UPDATE'
  | 'ALERT_RESOLVED'
  | 'DRILL_START' // Phase 4.5
  | 'DRILL_END' // Phase 4.5
  | 'DRILL_PARTICIPATION_UPDATE' // Phase 4: Real-time participation updates
  | 'ALERT_CANCEL' // Phase 4.5
  | 'USER_STATUS_UPDATE' // Phase 4.5
  // Phase 3: Student Activity Events
  | 'STUDENT_ACTIVITY_UPDATE' // Real-time student activity updates
  | 'STUDENT_PROGRESS_UPDATE' // Progress changes (XP, badges, score)
  | 'CLASS_ACTIVITY_UPDATE' // Class-wide activity updates
  | 'PARENT_NOTIFICATION' // Notifications for parents
  | 'TEACHER_NOTIFICATION' // Notifications for teachers
  | 'PARENT_VERIFICATION_REQUEST' // Parent verification request
  | 'QR_CODE_SCANNED' // QR code scan notification
  // Phase 201: IoT Device Events
  | 'TELEMETRY_UPDATE' // Real-time telemetry updates from IoT devices
  | 'DEVICE_ALERT'
  | 'SOS_ALERT'
  | 'SOS_SAFE'; // IoT device alerts

export interface SocketEventData {
  [key: string]: any;
}

export interface SocketConnectionStatus {
  connected: boolean;
  connecting: boolean;
  schoolId: string | null;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<SocketEvent, Set<(data: SocketEventData) => void>> = new Map();
  private schoolId: string | null = null;
  private token: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private statusListeners: Set<(status: SocketConnectionStatus) => void> = new Set();

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((listener) => listener(status));
  }

  getStatus(): SocketConnectionStatus {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      schoolId: this.schoolId,
    };
  }

  subscribeStatus(listener: (status: SocketConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  connect(schoolId: string, token: string) {
    // Connection Guards: Validate inputs
    if (!schoolId || typeof schoolId !== 'string' || schoolId.trim() === '') {
      console.warn('SocketService: Invalid schoolId provided, skipping connection');
      return;
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.warn('SocketService: Invalid token provided, skipping connection');
      return;
    }

    // If already connected with same credentials, skip
    if (this.socket?.connected && this.schoolId === schoolId && this.token === token) {
      console.log('SocketService: Already connected with same credentials');
      return;
    }

    // If currently connecting with same credentials, skip
    if (this.isConnecting && this.schoolId === schoolId && this.token === token) {
      console.log('SocketService: Connection already in progress');
      return;
    }

    // Replace transport if credentials changed; keep app-level event subscriptions
    if (this.socket) {
      this.disconnect({ clearListeners: false });
    }

    this.schoolId = schoolId;
    this.token = token;
    this.isConnecting = true;
    this.retryCount = 0;
    this.notifyStatus();

    this.attemptConnection();
  }

  private attemptConnection() {
    if (!this.schoolId || !this.token) {
      this.isConnecting = false;
      return;
    }

    try {
      this.socket = io(env.socketUrl, {
        auth: {
          token: this.token,
        },
        transports: ['websocket', 'polling'],
        reconnection: false, // We handle reconnection manually
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.isConnecting = false;
        this.retryCount = 0;
        this.notifyStatus();
        
        // Explicitly join room after connection
        if (this.schoolId) {
          this.joinRoom(this.schoolId);
        }
      });

      // Listen for room join confirmation
      this.socket.on('JOINED_ROOM', (data) => {
        console.log('✅ Joined room:', data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnecting = false;
        this.notifyStatus();
        
        // Only retry if it was an unexpected disconnect and we haven't exceeded max retries
        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (this.retryCount < this.maxRetries && this.schoolId && this.token) {
            this.scheduleRetry();
          }
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.isConnecting = false;
        this.notifyStatus();
        
        // Retry on connection error
        if (this.retryCount < this.maxRetries && this.schoolId && this.token) {
          this.scheduleRetry();
        } else {
          console.warn('SocketService: Max retries reached, giving up');
        }
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Register event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('SocketService: Failed to create socket:', error);
      this.isConnecting = false;
      
      if (this.retryCount < this.maxRetries && this.schoolId && this.token) {
        this.scheduleRetry();
      }
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryCount++;
    const delay = 2000 * this.retryCount; // Exponential backoff: 2s, 4s, 6s
    
    console.log(`SocketService: Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
    
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      if (this.schoolId && this.token) {
        this.attemptConnection();
      }
    }, delay);
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const events: SocketEvent[] = [
      'DRILL_SCHEDULED',
      'CRISIS_ALERT',
      'DRILL_SUMMARY',
      'STUDENT_STATUS_UPDATE',
      'ALERT_RESOLVED',
      'DRILL_START', // Phase 4.5
      'DRILL_END', // Phase 4.5
      'DRILL_PARTICIPATION_UPDATE', // Phase 4: Real-time participation updates
      'ALERT_CANCEL', // Phase 4.5
      'USER_STATUS_UPDATE', // Phase 4.5
      // Phase 3: Student Activity Events
      'STUDENT_ACTIVITY_UPDATE',
      'STUDENT_PROGRESS_UPDATE',
      'CLASS_ACTIVITY_UPDATE',
      'PARENT_NOTIFICATION',
      'TEACHER_NOTIFICATION',
      'PARENT_VERIFICATION_REQUEST',
      'QR_CODE_SCANNED',
      // Phase 201: IoT Device Events
      'TELEMETRY_UPDATE',
      'DEVICE_ALERT',
      'SOS_ALERT',
      'SOS_SAFE',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data: SocketEventData) => {
        const listeners = this.listeners.get(event);
        if (listeners) {
          listeners.forEach((listener) => listener(data));
        }
      });
    });
  }

  private joinRoom(schoolId: string) {
    if (this.socket?.connected) {
      this.socket.emit('JOIN_ROOM', { schoolId, token: this.token });
    }
  }

  on(event: SocketEvent, callback: (data: SocketEventData) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: SocketEvent, callback: (data: SocketEventData) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect(options: { clearListeners?: boolean } = { clearListeners: true }) {
    const clearListeners = options.clearListeners !== false;

    // Safe disconnect - can be called even if not connected
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        // Only call disconnect() if already connected to avoid "closed before connection established"
        if (this.socket.connected) {
          this.socket.disconnect();
        }
      } catch (error) {
        console.warn('SocketService: Error during disconnect:', error);
      }
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.retryCount = 0;
    if (clearListeners) {
      this.listeners.clear();
    }
    this.schoolId = null;
    this.token = null;
    this.notifyStatus();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  isConnectingNow(): boolean {
    return this.isConnecting;
  }
}

export const socketService = new SocketService();

