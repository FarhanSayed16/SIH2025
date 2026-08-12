/**
 * Header component with real-time connection status
 */

'use client';

import { useEffect, useState } from 'react';
import { socketService } from '@/lib/services/socket-service';
import { useAuthStore } from '@/lib/store/auth-store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user, accessToken } = useAuthStore();

  // Check initial connection status
  useEffect(() => {
    setIsConnected(socketService.isConnected());
  }, []);

  // Listen to connection status changes
  useEffect(() => {
    // Create a custom event emitter pattern using polling + socket events
    const checkConnection = () => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
    };

    // Check immediately
    checkConnection();

    // Poll connection status every 2 seconds
    const interval = setInterval(checkConnection, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [user, accessToken, isConnecting]);

  const handleReconnect = () => {
    if (!user || !accessToken) return;
    
    const institutionId = typeof user.institutionId === 'string' 
      ? user.institutionId 
      : (user.institutionId as any)?._id || user.institutionId;
    
    if (institutionId && accessToken) {
      setIsConnecting(true);
      socketService.connect(institutionId, accessToken);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(socketService.isConnected());
      }, 2000);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-600 font-medium">Connecting...</span>
                </>
              ) : isConnected ? (
                <>
                  <div className="relative">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm text-green-700 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">Disconnected</span>
                </>
              )}
            </div>
            
            {/* Reconnect Button (only show when disconnected) */}
            {!isConnected && !isConnecting && (
              <button
                onClick={handleReconnect}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors duration-200"
                title="Reconnect to server"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

