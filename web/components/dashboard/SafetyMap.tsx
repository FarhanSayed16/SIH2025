/**
 * Dashboard map summary — no invented campus layout (WB9 / WD15 honesty)
 */

'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Shield } from 'lucide-react';
import { isDrillInProgress } from '@/lib/api/drills';

interface Alert {
  _id: string;
  type: string;
  severity: string;
  status: string;
}

interface Drill {
  _id: string;
  type: string;
  status: string;
}

interface SafetyMapProps {
  alerts: Alert[];
  drills: Drill[];
}

export function SafetyMap({ alerts, drills }: SafetyMapProps) {
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const inProgressDrills = drills.filter((d) => isDrillInProgress(d.status));

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Institution map</h2>
          </div>
          <p className="text-sm text-gray-600 max-w-xl">
            Campus layout and device positions open on the map page when institution data is
            available. This dashboard does not invent building placements.
          </p>
        </div>
        <Link href="/map">
          <Button variant="outline">Open map</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Active alerts (loaded)
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeAlerts.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            Count from current alert list — not a campus placement.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Shield className="h-4 w-4 text-blue-600" />
            In-progress drills
          </div>
          <p className="text-2xl font-bold text-gray-900">{inProgressDrills.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            Uses in_progress / active status — not decorative map pins.
          </p>
        </div>
      </div>
    </Card>
  );
}
