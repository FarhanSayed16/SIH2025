/**
 * Phase 4.6: School Map View Component
 * Displays floor plan with room markers color-coded by student status density
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { alertStatusApi, AlertStatus } from '@/lib/api/alertStatus';

interface RoomStatus {
  roomNumber: string;
  roomName: string;
  building?: string;
  floor?: string;
  safe: number;
  help: number;
  missing: number;
  trapped: number;
  total: number;
  status: 'all_safe' | 'warning' | 'critical';
}

interface SchoolMapViewProps {
  activeAlertIds: string[];
  alerts?: Array<{
    _id: string;
    type: string;
    locationDetails?: {
      building?: string;
      floor?: string;
      room?: string;
    };
  }>;
}

export function SchoolMapView({ activeAlertIds, alerts = [] }: SchoolMapViewProps) {
  const [roomStatuses, setRoomStatuses] = useState<Map<string, RoomStatus>>(new Map());
  const [selectedRoom, setSelectedRoom] = useState<RoomStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch status data for all rooms
  useEffect(() => {
    const loadRoomStatuses = async () => {
      if (activeAlertIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const roomStatusMap = new Map<string, RoomStatus>();

      try {
        // For each active alert, get all statuses and group by room
        for (const alertId of activeAlertIds) {
          try {
            const statusResponse = await alertStatusApi.getStatuses(alertId);
            if (statusResponse.success && statusResponse.data?.statuses) {
              const statuses: AlertStatus[] = statusResponse.data.statuses;

              // Find the alert to get location details
              const alert = alerts.find(a => a._id === alertId);

              statuses.forEach((status) => {
                // Use alert location details or fallback to user grade/section
                const roomKey = alert?.locationDetails?.room 
                  ? `${alert.locationDetails.building || 'Building'}-${alert.locationDetails.floor || '1'}-${alert.locationDetails.room}`
                  : status.userGrade && status.userSection 
                    ? `${status.userGrade}-${status.userSection}`
                    : 'unknown';

                if (!roomStatusMap.has(roomKey)) {
                  roomStatusMap.set(roomKey, {
                    roomNumber: alert?.locationDetails?.room || status.userGrade || 'Unknown',
                    roomName: alert?.locationDetails?.room 
                      ? `${alert.locationDetails.building || ''} Floor ${alert.locationDetails.floor || ''} - Room ${alert.locationDetails.room}`
                      : status.userGrade && status.userSection 
                        ? `Grade ${status.userGrade} - Section ${status.userSection}`
                        : 'Unknown Room',
                    building: alert?.locationDetails?.building,
                    floor: alert?.locationDetails?.floor,
                    safe: 0,
                    help: 0,
                    missing: 0,
                    trapped: 0,
                    total: 0,
                    status: 'all_safe',
                  });
                }

                const room = roomStatusMap.get(roomKey)!;
                room.total++;

                switch (status.status) {
                  case 'safe':
                    room.safe++;
                    break;
                  case 'help':
                    room.help++;
                    break;
                  case 'missing':
                    room.missing++;
                    break;
                  case 'potentially_trapped':
                    room.trapped++;
                    break;
                }

                // Determine overall room status
                if (room.help > 0 || room.trapped > 0) {
                  room.status = 'critical';
                } else if (room.missing > 0) {
                  room.status = 'warning';
                } else {
                  room.status = 'all_safe';
                }
              });
            }
          } catch (error) {
            console.error(`Error loading statuses for alert ${alertId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error loading room statuses:', error);
      } finally {
        setRoomStatuses(roomStatusMap);
        setIsLoading(false);
      }
    };

    loadRoomStatuses();
  }, [activeAlertIds, alerts]);

  // Generate room markers from room statuses
  const getRoomMarkers = () => {
    const markers: Array<{ room: string; x: number; y: number; status: RoomStatus | null }> = [];
    const rooms = Array.from(roomStatuses.values());
    
    // Create markers for each room with status
    rooms.forEach((roomStatus, index) => {
      // Simple grid layout for demo (in production, use actual floor plan coordinates)
      const cols = 4;
      const x = ((index % cols) * 25) + 10; // 10-85%
      const y = (Math.floor(index / cols) * 20) + 15; // 15-75%
      
      markers.push({
        room: roomStatus.roomNumber,
        x,
        y,
        status: roomStatus,
      });
    });

    return markers;
  };

  const getMarkerColor = (status: RoomStatus | null) => {
    if (!status) return 'bg-gray-400';
    
    switch (status.status) {
      case 'all_safe':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getMarkerSize = (status: RoomStatus | null) => {
    if (!status || status.total === 0) return 'w-8 h-8';
    if (status.total < 10) return 'w-8 h-8';
    if (status.total < 30) return 'w-10 h-10';
    return 'w-12 h-12';
  };

  const roomMarkers = getRoomMarkers();

  return (
    <Card title="School Floor Plan" className="h-full">
      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading map data...</p>
          </div>
        </div>
      ) : (
        <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
          {/* Floor Plan Placeholder - In production, use actual floor plan image */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🏫</div>
              <p className="text-sm">School Floor Plan</p>
              <p className="text-xs mt-1">(Static image placeholder)</p>
            </div>
          </div>

          {/* Room Markers */}
          {roomMarkers.map((marker, index) => {
            const roomStatus = marker.status;
            return (
              <button
                key={`${marker.room}-${index}`}
                onClick={() => setSelectedRoom(roomStatus)}
                className={`absolute ${getMarkerColor(roomStatus)} ${getMarkerSize(roomStatus)} rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-white font-bold text-xs`}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={marker.room}
              >
                {roomStatus?.total || '?'}
              </button>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
            <div className="text-xs font-semibold mb-2">Status Legend:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-xs">All Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Warning (Missing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-xs">Critical (Help/Trapped)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span className="text-xs">No Data</span>
              </div>
            </div>
          </div>

          {/* Room Details Modal */}
          {selectedRoom && (
            <div
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
              onClick={() => setSelectedRoom(null)}
            >
              <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">{selectedRoom.roomName}</h3>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-2xl font-bold text-green-700">{selectedRoom.safe}</div>
                      <div className="text-xs text-green-600">Safe</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-2xl font-bold text-red-700">{selectedRoom.help}</div>
                      <div className="text-xs text-red-600">Need Help</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-2xl font-bold text-yellow-700">{selectedRoom.missing}</div>
                      <div className="text-xs text-yellow-600">Missing</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-2xl font-bold text-orange-700">{selectedRoom.trapped}</div>
                      <div className="text-xs text-orange-600">Trapped</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      <strong>Total:</strong> {selectedRoom.total} students
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Status:</strong>{' '}
                      <span
                        className={`font-semibold ${
                          selectedRoom.status === 'all_safe'
                            ? 'text-green-600'
                            : selectedRoom.status === 'warning'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {selectedRoom.status === 'all_safe'
                          ? 'All Safe'
                          : selectedRoom.status === 'warning'
                          ? 'Warning'
                          : 'Critical'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {roomMarkers.length > 0 
          ? `${roomMarkers.length} room(s) monitored • Click markers for details`
          : 'No room data available'}
      </div>
    </Card>
  );
}

