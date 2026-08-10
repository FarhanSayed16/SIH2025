/**
 * Safety Equipment Management Page
 * Separate page for managing safety equipment with table view
 * Map Integration Plan - Phase 3
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { apiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Search,
  Filter,
  Download,
  Upload,
  MapPin,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react';

interface SafetyEquipment {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'maintenance' | 'expired' | 'missing';
  location: {
    floor: number;
    coordinates: { x: number; y: number };
  };
  lastInspection?: string;
  nextInspection?: string;
  expiryDate?: string;
  capacity?: string;
  description?: string;
  qrCode?: string;
}

interface School {
  _id: string;
  name: string;
}

export default function EquipmentManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      loadEquipment();
    }
  }, [selectedSchool, floorFilter]);

  const loadSchools = async () => {
    try {
      const response = await apiClient.get('/schools');
      const data = response.data?.data || response.data || [];
      setSchools(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedSchool) {
        setSelectedSchool(data[0]._id);
      }
    } catch (error: any) {
      console.error('Failed to load schools:', error);
      showToast('Failed to load schools', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    if (!selectedSchool) return;
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (floorFilter !== null) query.append('floor', floorFilter.toString());
      if (typeFilter) query.append('type', typeFilter);
      if (statusFilter) query.append('status', statusFilter);

      const response = await apiClient.get(
        `/schools/${selectedSchool}/floor-plan/safety-equipment${query.toString() ? `?${query.toString()}` : ''}`
      );
      const data = response.data?.data || response.data || {};
      setEquipment(Array.isArray(data.equipment) ? data.equipment : []);
    } catch (error: any) {
      console.error('Failed to load equipment:', error);
      showToast('Failed to load equipment', 'error');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !eq.name.toLowerCase().includes(query) &&
          !eq.type.toLowerCase().includes(query) &&
          !eq.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [equipment, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'maintenance':
        return 'text-orange-600 bg-orange-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      case 'missing':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'missing':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleExportCSV = () => {
    if (filteredEquipment.length === 0) {
      showToast('No equipment to export', 'warning');
      return;
    }

    const headers = ['Name', 'Type', 'Status', 'Floor', 'X', 'Y', 'Last Inspection', 'Next Inspection', 'Expiry Date', 'Capacity'];
    const rows = filteredEquipment.map((eq) => [
      eq.name,
      eq.type,
      eq.status,
      eq.location?.floor?.toString() || '',
      eq.location?.coordinates?.x?.toString() || '',
      eq.location?.coordinates?.y?.toString() || '',
      eq.lastInspection || '',
      eq.nextInspection || '',
      eq.expiryDate || '',
      eq.capacity || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-${selectedSchool}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Equipment exported to CSV', 'success');
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.split('\n').filter((line: string) => line.trim());
        if (lines.length < 2) {
          showToast('CSV file must have at least a header and one data row', 'error');
          return;
        }

        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        const dataRows = lines.slice(1);

        let successCount = 0;
        let errorCount = 0;

        for (const row of dataRows) {
          if (!row.trim()) continue;
          const values = row.split(',').map((v: string) => v.trim().replace(/"/g, ''));
          if (values.length < headers.length) continue;

          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
          });

          try {
            const payload: any = {
              name: rowData.name || rowData['equipmentname'] || '',
              type: rowData.type || rowData['equipmenttype'] || 'other',
              status: rowData.status || 'active',
              location: {
                floor: rowData.floor ? parseInt(rowData.floor) : 0,
                coordinates: {
                  x: rowData.x ? parseFloat(rowData.x) : 0,
                  y: rowData.y ? parseFloat(rowData.y) : 0,
                },
              },
            };

            if (rowData.capacity) payload.capacity = rowData.capacity;
            if (rowData.description) payload.description = rowData.description;
            if (rowData.lastinspection) payload.lastInspection = new Date(rowData.lastinspection);
            if (rowData.nextinspection) payload.nextInspection = new Date(rowData.nextinspection);
            if (rowData.expirydate) payload.expiryDate = new Date(rowData.expirydate);

            await apiClient.post(`/schools/${selectedSchool}/floor-plan/safety-equipment`, payload);
            successCount++;
          } catch (error) {
            console.error('Failed to import row:', error);
            errorCount++;
          }
        }

        showToast(
          `Import complete: ${successCount} successful, ${errorCount} failed`,
          successCount > 0 ? 'success' : 'error'
        );
        loadEquipment();
      } catch (error: any) {
        console.error('CSV import error:', error);
        showToast('Failed to import CSV file', 'error');
      }
    };
    input.click();
  };

  return (
    <AdminRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Safety Equipment Management</h1>
                <p className="text-gray-600 mt-2">Manage and monitor safety equipment across schools</p>
              </div>

              {/* School Selector */}
              <Card className="p-4 mb-6">
                <div className="flex items-center gap-4">
                  <label className="font-semibold">School:</label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a school</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  <Button onClick={loadEquipment} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </Card>

              {!selectedSchool ? (
                <Card className="p-12">
                  <EmptyState
                    icon={<MapPin className="w-12 h-12 text-gray-400" />}
                    title="Select a School"
                    description="Please select a school to view and manage equipment"
                  />
                </Card>
              ) : loading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  {/* Filters and Actions */}
                  <Card className="p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <select
                        value={floorFilter?.toString() || ''}
                        onChange={(e) => setFloorFilter(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Floors</option>
                        {[0, 1, 2, 3, 4].map((floor) => (
                          <option key={floor} value={floor}>
                            Floor {floor}
                          </option>
                        ))}
                      </select>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="fire-extinguisher">Fire Extinguisher</option>
                        <option value="first-aid-kit">First Aid Kit</option>
                        <option value="aed">AED</option>
                        <option value="emergency-exit-sign">Exit Sign</option>
                        <option value="fire-alarm">Fire Alarm</option>
                      </select>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="expired">Expired</option>
                        <option value="missing">Missing</option>
                      </select>
                      <Button onClick={handleExportCSV} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={handleImportCSV} variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button
                        onClick={() => router.push(`/admin/blueprint?school=${selectedSchool}`)}
                        variant="outline"
                        size="sm"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </Card>

                  {/* Equipment Table */}
                  <Card>
                    {filteredEquipment.length === 0 ? (
                      <div className="p-12">
                        <EmptyState
                          icon={<MapPin className="w-12 h-12 text-gray-400" />}
                          title="No Equipment Found"
                          description="No equipment matches your filters. Try adjusting your search criteria."
                        />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Floor
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Inspection
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Next Inspection
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEquipment.map((eq) => (
                              <tr key={eq.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{eq.name}</div>
                                  {eq.description && (
                                    <div className="text-sm text-gray-500">{eq.description}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm text-gray-900">{eq.type}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}
                                  >
                                    {getStatusIcon(eq.status)}
                                    {eq.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  Floor {eq.location?.floor ?? 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {eq.location?.coordinates
                                    ? `(${eq.location.coordinates.x.toFixed(0)}, ${eq.location.coordinates.y.toFixed(0)})`
                                    : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {eq.lastInspection
                                    ? new Date(eq.lastInspection).toLocaleDateString()
                                    : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {eq.nextInspection
                                    ? new Date(eq.nextInspection).toLocaleDateString()
                                    : 'Not scheduled'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end gap-2">
                                    {eq.qrCode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          // TODO: Show QR code
                                          showToast('QR code viewer coming soon', 'info');
                                        }}
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        router.push(`/admin/blueprint?school=${selectedSchool}&equipment=${eq.id}`);
                                      }}
                                    >
                                      <MapPin className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // TODO: Edit equipment
                                        showToast('Edit functionality coming soon', 'info');
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this equipment?')) {
                                          try {
                                            await apiClient.delete(
                                              `/schools/${selectedSchool}/floor-plan/safety-equipment/${eq.id}`
                                            );
                                            showToast('Equipment deleted', 'success');
                                            loadEquipment();
                                          } catch (error: any) {
                                            showToast('Failed to delete equipment', 'error');
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <Card className="p-4">
                      <div className="text-sm text-gray-600">Total Equipment</div>
                      <div className="text-2xl font-bold text-gray-900">{filteredEquipment.length}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-gray-600">Active</div>
                      <div className="text-2xl font-bold text-green-600">
                        {filteredEquipment.filter((e) => e.status === 'active').length}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-gray-600">Maintenance</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {filteredEquipment.filter((e) => e.status === 'maintenance').length}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-gray-600">Expired/Missing</div>
                      <div className="text-2xl font-bold text-red-600">
                        {filteredEquipment.filter((e) => e.status === 'expired' || e.status === 'missing').length}
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}

