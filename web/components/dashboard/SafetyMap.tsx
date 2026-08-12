/**
 * Safety Map Component
 * Enhanced interactive school layout with real-time incident tracking
 */

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, AlertTriangle, ShieldAlert, Building2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  _id: string;
  type: string;
  severity: string;
  status: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  locationDetails?: {
    building?: string;
    floor?: string;
    room?: string;
  };
  createdAt?: string;
}

interface Drill {
  _id: string;
  type: string;
  status: string;
  createdAt?: string;
}

interface SafetyMapProps {
  alerts: Alert[];
  drills: Drill[];
}

interface BuildingData {
  id: string;
  name: string;
  x: number;
  y: number;
  alerts: Alert[];
  drills: Drill[];
  icon: 'main' | 'library' | 'gym' | 'cafeteria' | 'lab' | 'auditorium';
}

export function SafetyMap({ alerts, drills }: SafetyMapProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const activeDrills = drills.filter(d => d.status === 'active');

  // Enhanced school layout with more buildings
  const buildings: BuildingData[] = useMemo(() => {
    const baseBuildings: Omit<BuildingData, 'alerts' | 'drills'>[] = [
      { id: 'main', name: 'Main Building', x: 25, y: 35, icon: 'main' },
      { id: 'library', name: 'Library', x: 65, y: 30, icon: 'library' },
      { id: 'gym', name: 'Gymnasium', x: 45, y: 65, icon: 'gym' },
      { id: 'cafeteria', name: 'Cafeteria', x: 75, y: 55, icon: 'cafeteria' },
      { id: 'lab', name: 'Science Lab', x: 15, y: 55, icon: 'lab' },
      { id: 'auditorium', name: 'Auditorium', x: 55, y: 20, icon: 'auditorium' },
    ];

    // Distribute alerts and drills across buildings intelligently
    const buildingsWithData: BuildingData[] = baseBuildings.map((building, index) => {
      // Try to match alerts/drills to buildings based on locationDetails if available
      const buildingAlerts = activeAlerts.filter(alert => {
        const buildingName = alert.locationDetails?.building?.toLowerCase();
        return buildingName?.includes(building.id) || 
               buildingName?.includes(building.name.toLowerCase().split(' ')[0]);
      });

      const buildingDrills = activeDrills.filter((drill, drillIndex) => {
        // Distribute drills more evenly
        return drillIndex % baseBuildings.length === index;
      });

      // If no location match, distribute evenly
      if (buildingAlerts.length === 0 && activeAlerts.length > 0) {
        const alertIndex = index % activeAlerts.length;
        if (alertIndex < activeAlerts.length) {
          buildingAlerts.push(activeAlerts[alertIndex]);
        }
      }

      return {
        ...building,
        alerts: buildingAlerts,
        drills: buildingDrills,
      };
    });

    return buildingsWithData;
  }, [activeAlerts, activeDrills]);

  const getBuildingIcon = (icon: string) => {
    switch (icon) {
      case 'main':
        return <Building2 className="h-5 w-5" />;
      case 'library':
        return <Building2 className="h-5 w-5" />;
      case 'gym':
        return <Building2 className="h-5 w-5" />;
      case 'cafeteria':
        return <Building2 className="h-5 w-5" />;
      case 'lab':
        return <Building2 className="h-5 w-5" />;
      case 'auditorium':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      case 'low':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const totalAlerts = buildings.reduce((sum, b) => sum + b.alerts.length, 0);
  const totalDrills = buildings.reduce((sum, b) => sum + b.drills.length, 0);

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">School Safety Map</h3>
            <p className="text-sm text-gray-600">Real-time incident & drill tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="font-semibold text-red-700">{totalAlerts} Alerts</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <span className="font-semibold text-blue-700">{totalDrills} Drills</span>
          </div>
        </div>
      </div>

      {/* Enhanced Interactive Map View */}
      <div className="relative w-full h-80 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200/50 overflow-hidden shadow-inner">
        {/* Animated Grid Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            animation: 'gridMove 20s linear infinite'
          }}
        ></div>
        <style jsx>{`
          @keyframes gridMove {
            0% { transform: translate(0, 0); }
            100% { transform: translate(30px, 30px); }
          }
        `}</style>

        {/* Buildings with Interactive Markers */}
        {buildings.map((building) => {
          const hasAlerts = building.alerts.length > 0;
          const hasDrills = building.drills.length > 0;
          const isHovered = hoveredBuilding === building.id;
          const isSelected = selectedBuilding?.id === building.id;

          return (
            <motion.div
              key={building.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{
                left: `${building.x}%`,
                top: `${building.y}%`
              }}
              initial={{ scale: 0 }}
              animate={{ 
                scale: isHovered ? 1.15 : isSelected ? 1.1 : 1,
                y: isHovered ? -5 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onMouseEnter={() => setHoveredBuilding(building.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
              onClick={() => setSelectedBuilding(building)}
            >
              <div className="relative">
                {/* Building Marker with Pulse Animation */}
                <div className={`relative w-14 h-14 rounded-xl border-3 flex items-center justify-center transition-all duration-300 ${
                  hasAlerts 
                    ? 'bg-gradient-to-br from-red-100 to-red-200 border-red-500 shadow-lg shadow-red-300/50' 
                    : hasDrills
                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 shadow-lg shadow-blue-300/50'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 shadow-md'
                } ${isHovered ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}>
                  {hasAlerts ? (
                    <AlertTriangle className="h-7 w-7 text-red-600 animate-pulse" />
                  ) : hasDrills ? (
                    <ShieldAlert className="h-7 w-7 text-blue-600" />
                  ) : (
                    <div className="text-gray-500">
                      {getBuildingIcon(building.icon)}
                    </div>
                  )}

                  {/* Pulse Ring for Active Alerts */}
                  {hasAlerts && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-red-500"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </div>

                {/* Building Label with Tooltip */}
                <motion.div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap z-20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: isHovered || isSelected ? 1 : 0.8, y: 0 }}
                >
                  <div className="text-xs font-bold text-gray-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border-2 border-gray-300 shadow-lg">
                    {building.name}
                  </div>
                </motion.div>

                {/* Alert/Drill Count Badges */}
                {(hasAlerts || hasDrills) && (
                  <motion.div
                    className="absolute -top-2 -right-2 flex gap-1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {hasAlerts && (
                      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                        {building.alerts.length}
                      </div>
                    )}
                    {hasDrills && (
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                        {building.drills.length}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Enhanced Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl p-4 border-2 border-gray-200 shadow-xl">
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="font-bold text-gray-900 mb-1 text-sm">Legend</div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-gray-700">Active Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-gray-700">Active Drills</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-700">Normal Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Building Details Modal */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBuilding(null)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedBuilding.name}</h3>
                      <p className="text-blue-100 text-sm">Building Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Alerts Section */}
                {selectedBuilding.alerts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="text-lg font-bold text-gray-900">
                        Active Alerts ({selectedBuilding.alerts.length})
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {selectedBuilding.alerts.map((alert) => (
                        <div
                          key={alert._id}
                          className="p-4 rounded-lg border-l-4 bg-red-50 border-red-500"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)} text-white`}>
                                  {alert.severity?.toUpperCase()}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">{alert.type}</span>
                              </div>
                              {alert.locationDetails && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {alert.locationDetails.floor && `Floor ${alert.locationDetails.floor}`}
                                  {alert.locationDetails.room && ` • Room ${alert.locationDetails.room}`}
                                </div>
                              )}
                            </div>
                            {alert.createdAt && (
                              <span className="text-xs text-gray-500">
                                {new Date(alert.createdAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drills Section */}
                {selectedBuilding.drills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldAlert className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-bold text-gray-900">
                        Active Drills ({selectedBuilding.drills.length})
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {selectedBuilding.drills.map((drill) => (
                        <div
                          key={drill._id}
                          className="p-4 rounded-lg border-l-4 bg-blue-50 border-blue-500"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-semibold text-gray-900 capitalize">
                                {drill.type} Drill
                              </span>
                              <div className="text-xs text-gray-600 mt-1">
                                Status: <span className="font-semibold text-blue-700">{drill.status}</span>
                              </div>
                            </div>
                            {drill.createdAt && (
                              <span className="text-xs text-gray-500">
                                {new Date(drill.createdAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {selectedBuilding.alerts.length === 0 && selectedBuilding.drills.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No active incidents</p>
                    <p className="text-sm text-gray-500 mt-1">This building is currently safe</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

