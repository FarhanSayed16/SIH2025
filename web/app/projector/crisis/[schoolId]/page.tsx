/**
 * Phase 4.5: Crisis Projector Page
 * 
 * Full-screen crisis alert display for classroom projectors
 * Shows real emergencies (red flashing) and drills (amber/orange)
 * 
 * URL: /projector/crisis/:schoolId?token=<auth_token>
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { env } from '@/lib/config/env';

interface AlertData {
  alertId: string;
  type: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  locationDetails?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  drillFlag?: boolean;
  timestamp: string;
}

interface DrillData {
  drillId: string;
  type: string;
  title?: string;
  participants?: number;
  startedAt: string;
  duration?: number;
}

interface StatusSummary {
  safe: number;
  help: number;
  missing: number;
  at_risk: number;
  potentially_trapped: number;
  total: number;
}

export default function CrisisProjectorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const schoolId = params.schoolId as string;
  const token = searchParams.get('token');
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [currentDrill, setCurrentDrill] = useState<DrillData | null>(null);
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null);
  const [isDrill, setIsDrill] = useState(false);
  const [flashState, setFlashState] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Flash animation for real crises
  useEffect(() => {
    if (currentAlert && !isDrill) {
      flashIntervalRef.current = setInterval(() => {
        setFlashState((prev) => !prev);
      }, 500); // Flash every 500ms
    } else {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
        flashIntervalRef.current = null;
      }
      setFlashState(false);
    }

    return () => {
      if (flashIntervalRef.current) {
        clearInterval(flashIntervalRef.current);
      }
    };
  }, [currentAlert, isDrill]);

  // Siren audio for real crises
  useEffect(() => {
    if (currentAlert && !isDrill && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch((e) => {
        console.warn('Failed to play audio:', e);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentAlert, isDrill]);

  // Socket.io connection
  useEffect(() => {
    if (!schoolId || !token) {
      console.error('School ID and token are required');
      return;
    }

    const socketUrl = env.socketUrl || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to crisis projector');
      setConnected(true);
      
      // Join school namespace
      newSocket.emit('JOIN_ROOM', { schoolId, token });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from crisis projector');
      setConnected(false);
    });

    // Listen for CRISIS_ALERT
    newSocket.on('CRISIS_ALERT', (data: any) => {
      console.log('🚨 CRISIS_ALERT received:', data);
      
      const alertData: AlertData = {
        alertId: data.alertId || data.id || '',
        type: data.type || 'other',
        title: data.title || 'EMERGENCY ALERT',
        description: data.description,
        severity: data.severity || 'high',
        source: data.source,
        locationDetails: data.locationDetails,
        drillFlag: data.drillFlag || false,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setIsDrill(alertData.drillFlag || false);
      
      if (alertData.drillFlag) {
        // It's a drill, clear alert and set drill
        setCurrentAlert(null);
        // Drill data will come from DRILL_START event
      } else {
        // Real crisis
        setCurrentAlert(alertData);
        setCurrentDrill(null);
        setLastUpdate(new Date());
        
        // Fetch status summary
        fetchStatusSummary(alertData.alertId);
      }
    });

    // Listen for DRILL_START
    newSocket.on('DRILL_START', (data: any) => {
      console.log('🔔 DRILL_START received:', data);
      
      const drillData: DrillData = {
        drillId: data.drillId || data.id || '',
        type: data.type || 'practice',
        title: data.title,
        participants: data.participants || 0,
        startedAt: data.startedAt || data.startTime || new Date().toISOString(),
        duration: data.duration,
      };

      setIsDrill(true);
      setCurrentDrill(drillData);
      setCurrentAlert(null);
      setLastUpdate(new Date());
    });

    // Listen for DRILL_END
    newSocket.on('DRILL_END', (data: any) => {
      console.log('✅ DRILL_END received:', data);
      setCurrentDrill(null);
      setCurrentAlert(null);
      setIsDrill(false);
    });

    // Listen for ALERT_CANCEL
    newSocket.on('ALERT_CANCEL', (data: any) => {
      console.log('❌ ALERT_CANCEL received:', data);
      setCurrentAlert(null);
      setCurrentDrill(null);
      setIsDrill(false);
    });

    // Listen for USER_STATUS_UPDATE (to refresh status summary)
    newSocket.on('USER_STATUS_UPDATE', (data: any) => {
      console.log('📊 USER_STATUS_UPDATE received:', data);
      // Status summary will auto-refresh via useEffect hook
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [schoolId, token]);

  const fetchStatusSummary = async (alertId: string) => {
    if (!token) return;
    
    try {
      const apiUrl = env.apiUrl || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/alerts/${alertId}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStatusSummary(data.data.counts);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch status summary:', error);
    }
  };

  // Auto-refresh status summary every 2 seconds
  useEffect(() => {
    if (currentAlert && !isDrill) {
      // Initial fetch
      fetchStatusSummary(currentAlert.alertId);
      
      // Then refresh every 2 seconds
      statusRefreshIntervalRef.current = setInterval(() => {
        fetchStatusSummary(currentAlert.alertId);
      }, 2000);
    } else {
      if (statusRefreshIntervalRef.current) {
        clearInterval(statusRefreshIntervalRef.current);
        statusRefreshIntervalRef.current = null;
      }
    }

    return () => {
      if (statusRefreshIntervalRef.current) {
        clearInterval(statusRefreshIntervalRef.current);
      }
    };
  }, [currentAlert, isDrill, token]);

  const getAlertIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire':
        return '🔥';
      case 'earthquake':
        return '🌍';
      case 'flood':
        return '💧';
      case 'cyclone':
        return '🌀';
      case 'medical':
        return '🏥';
      default:
        return '🚨';
    }
  };

  const formatTimeString = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // No active alert or drill - show standby screen
  if (!currentAlert && !currentDrill) {
    return (
      <div className="h-screen w-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} mx-auto mb-4 animate-pulse`}></div>
          <h1 className="text-4xl font-bold mb-2">Crisis Projector</h1>
          <p className="text-xl text-gray-400">
            {connected ? 'Connected - Waiting for alerts...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  // Drill Display Component
  const DrillDisplay = () => {
    const drillStartTime = new Date(currentDrill!.startedAt);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - drillStartTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }, [drillStartTime]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="h-screen w-screen bg-amber-900 text-white flex flex-col items-center justify-center">
        <audio ref={audioRef} src="/sounds/beep.mp3" preload="auto" />
        
        <div className="text-center space-y-8">
          <div className="text-8xl mb-4">⚠️</div>
          <h1 className="text-7xl font-bold">PRACTICE DRILL</h1>
          
          <div className="mt-8">
            <div className="text-4xl mb-2">{currentDrill!.type.toUpperCase()} DRILL</div>
            {currentDrill!.title && (
              <div className="text-2xl text-amber-200">{currentDrill!.title}</div>
            )}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 text-3xl">
            <div>
              <div className="text-amber-300">Timer</div>
              <div className="font-bold">{formatTime(elapsedSeconds)}</div>
            </div>
            {currentDrill!.participants !== undefined && (
              <div>
                <div className="text-amber-300">Participants</div>
                <div className="font-bold">{currentDrill!.participants}</div>
              </div>
            )}
          </div>

          <div className="mt-12 text-lg text-amber-200">
            Started: {formatTimeString(currentDrill!.startedAt)}
          </div>
        </div>
      </div>
    );
  };

  // Drill Display
  if (isDrill && currentDrill) {
    return <DrillDisplay />;
  }

  // Real Crisis Display
  if (currentAlert && !isDrill) {
    const bgColor = flashState ? 'bg-red-900' : 'bg-black';

    return (
      <div className={`h-screen w-screen ${bgColor} text-white flex flex-col items-center justify-center transition-colors duration-500`}>
        <audio 
          ref={audioRef} 
          src="/sounds/siren.mp3" 
          preload="auto"
          loop
        />
        
        <div className="text-center space-y-8 z-10">
          {/* Alert Icon */}
          <div className="text-9xl animate-pulse">{getAlertIcon(currentAlert.type)}</div>
          
          {/* Alert Title */}
          <h1 className="text-8xl font-bold tracking-wider">🚨 EMERGENCY ALERT 🚨</h1>
          
          {/* Alert Type */}
          <div className="text-5xl font-bold">{currentAlert.type.toUpperCase()}</div>
          
          {/* Alert Description */}
          {currentAlert.description && (
            <div className="text-3xl text-red-200 max-w-4xl mx-auto">
              {currentAlert.description}
            </div>
          )}

          {/* Location Details */}
          {currentAlert.locationDetails && (
            <div className="text-2xl text-red-300">
              {[
                currentAlert.locationDetails.building,
                currentAlert.locationDetails.floor ? `Floor ${currentAlert.locationDetails.floor}` : null,
                currentAlert.locationDetails.room,
              ]
                .filter(Boolean)
                .join(' • ')}
            </div>
          )}

          {/* Status Counters */}
          {statusSummary && (
            <div className="mt-12 grid grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="bg-green-900 bg-opacity-50 rounded-lg p-6">
                <div className="text-6xl font-bold text-green-300">{statusSummary.safe}</div>
                <div className="text-2xl mt-2">SAFE</div>
              </div>
              
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-6">
                <div className="text-6xl font-bold text-red-300">{statusSummary.help}</div>
                <div className="text-2xl mt-2">NEED HELP</div>
              </div>
              
              <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-6">
                <div className="text-6xl font-bold text-yellow-300">{statusSummary.missing}</div>
                <div className="text-2xl mt-2">MISSING</div>
              </div>
              
              <div className="bg-orange-900 bg-opacity-50 rounded-lg p-6">
                <div className="text-6xl font-bold text-orange-300">{statusSummary.potentially_trapped}</div>
                <div className="text-xl mt-2">TRAPPED</div>
              </div>
            </div>
          )}

          {/* Total and Last Updated */}
          <div className="mt-8 text-xl text-red-300 space-y-2">
            {statusSummary && (
              <div>Total: {statusSummary.total} people</div>
            )}
            <div>Last Updated: {formatTimeString(lastUpdate.toISOString())}</div>
            {currentAlert.source && (
              <div>Source: {currentAlert.source}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

