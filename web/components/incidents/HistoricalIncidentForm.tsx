/**
 * Historical Incident Form Component
 * Comprehensive form for adding past incidents
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { CreateHistoricalIncidentRequest } from '@/lib/api/incidents';
import { aiApi } from '@/lib/api/ai';

interface HistoricalIncidentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  institutionId?: string;
}

export function HistoricalIncidentForm({ onClose, onSuccess, institutionId }: HistoricalIncidentFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummarising, setIsSummarising] = useState(false);
  const [activeSection, setActiveSection] = useState(1);

  const [formData, setFormData] = useState<CreateHistoricalIncidentRequest>({
    type: 'fire',
    severity: 'high',
    historicalDate: '',
    title: '',
    description: '',
    impact: {
      casualties: { fatal: 0, injured: 0, evacuated: 0 },
      propertyDamage: { severity: 'none', estimatedCost: 0 },
      duration: 0,
      affectedArea: ''
    },
    response: {
      responseTime: 0,
      responseTeam: [],
      actionsTaken: [],
      effectiveness: 'good'
    },
    historicalDetails: {
      originalSource: 'records',
      verifiedBy: '',
      verificationDate: '',
      documentation: [],
      lessonsLearned: '',
      precautionsTaken: '',
      improvementsMade: '',
      relatedIncidents: []
    }
  });

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof typeof prev] as any),
          [keys[1]]: value
        }
      }));
    } else if (keys.length === 3) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof typeof prev] as any),
          [keys[1]]: {
            ...((prev[keys[0] as keyof typeof prev] as any)?.[keys[1]] || {}),
            [keys[2]]: value
          }
        }
      }));
    }
  };

  const handleArrayAdd = (field: string, value: string) => {
    if (!value.trim()) return;
    const keys = field.split('.');
    if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof typeof prev] as any),
          [keys[1]]: [
            ...((prev[keys[0] as keyof typeof prev] as any)?.[keys[1]] || []),
            value
          ]
        }
      }));
    }
  };

  const handleArrayRemove = (field: string, index: number) => {
    const keys = field.split('.');
    if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof typeof prev] as any),
          [keys[1]]: ((prev[keys[0] as keyof typeof prev] as any)?.[keys[1]] || []).filter((_: any, i: number) => i !== index)
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.historicalDate || !formData.title) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { incidentsApi } = await import('@/lib/api/incidents');
      const response = await incidentsApi.createHistorical(formData);
      
      if (response.success) {
        showToast('Historical incident added successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(response.message || 'Failed to create historical incident', 'error');
      }
    } catch (error: any) {
      console.error('Error creating historical incident:', error);
      showToast(error?.message || 'Failed to create historical incident', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 1, title: 'Basic Information', icon: '📋' },
    { id: 2, title: 'Impact Details', icon: '💥' },
    { id: 3, title: 'Response Details', icon: '🚨' },
    { id: 4, title: 'Historical Context', icon: '📚' },
    { id: 5, title: 'Lessons & Improvements', icon: '💡' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">➕ Add Historical Incident</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 mb-6 border-b pb-4 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            {activeSection === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incident Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="fire">Fire</option>
                      <option value="earthquake">Earthquake</option>
                      <option value="flood">Flood</option>
                      <option value="cyclone">Cyclone</option>
                      <option value="stampede">Stampede</option>
                      <option value="medical">Medical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => handleInputChange('severity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Historical Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.historicalDate}
                      onChange={(e) => handleInputChange('historicalDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Fire incident in Building A"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSummarising || !formData.description?.trim()}
                      onClick={async () => {
                        const description = formData.description?.trim();
                        if (!description) return;
                        setIsSummarising(true);
                        try {
                          const result = await aiApi.summariseIncident(description);
                          const bullets = result?.bullets ?? [];
                          if (bullets.length) {
                            handleInputChange('description', bullets.join('\n• ').replace(/^/, '• '));
                            showToast('Summary applied.', 'success');
                          } else {
                            showToast('No summary generated.', 'info');
                          }
                        } catch (e: any) {
                          showToast(e?.message || 'Summarise failed', 'error');
                        } finally {
                          setIsSummarising(false);
                        }
                      }}
                    >
                      {isSummarising ? '…' : 'Summarise with AI'}
                    </Button>
                  </div>
                  <textarea
                    value={formData.description ?? ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Detailed description of the incident..."
                  />
                </div>
              </div>
            )}

            {/* Section 2: Impact Details */}
            {activeSection === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Impact Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fatal Casualties</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.impact?.casualties?.fatal || 0}
                      onChange={(e) => handleInputChange('impact.casualties.fatal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Injured</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.impact?.casualties?.injured || 0}
                      onChange={(e) => handleInputChange('impact.casualties.injured', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Evacuated</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.impact?.casualties?.evacuated || 0}
                      onChange={(e) => handleInputChange('impact.casualties.evacuated', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Damage Severity</label>
                    <select
                      value={formData.impact?.propertyDamage?.severity || 'none'}
                      onChange={(e) => handleInputChange('impact.propertyDamage.severity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                      <option value="extensive">Extensive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.impact?.propertyDamage?.estimatedCost || 0}
                      onChange={(e) => handleInputChange('impact.propertyDamage.estimatedCost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.impact?.duration || 0}
                      onChange={(e) => handleInputChange('impact.duration', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Affected Area</label>
                    <input
                      type="text"
                      value={formData.impact?.affectedArea || ''}
                      onChange={(e) => handleInputChange('impact.affectedArea', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Building A, Ground Floor"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Response Details */}
            {activeSection === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Response Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Time (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.response?.responseTime || 0}
                      onChange={(e) => handleInputChange('response.responseTime', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effectiveness</label>
                    <select
                      value={formData.response?.effectiveness || 'good'}
                      onChange={(e) => handleInputChange('response.effectiveness', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="adequate">Adequate</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Team</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="responseTeamInput"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter team member/agency name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          handleArrayAdd('response.responseTeam', input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('responseTeamInput') as HTMLInputElement;
                        if (input) {
                          handleArrayAdd('response.responseTeam', input.value);
                          input.value = '';
                        }
                      }}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.response?.responseTeam || []).map((team, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {team}
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('response.responseTeam', index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="actionsInput"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter action taken"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          handleArrayAdd('response.actionsTaken', input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('actionsInput') as HTMLInputElement;
                        if (input) {
                          handleArrayAdd('response.actionsTaken', input.value);
                          input.value = '';
                        }
                      }}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.response?.actionsTaken || []).map((action, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {action}
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('response.actionsTaken', index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Historical Context */}
            {activeSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Historical Context</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Source</label>
                    <select
                      value={formData.historicalDetails?.originalSource || 'records'}
                      onChange={(e) => handleInputChange('historicalDetails.originalSource', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="news">News Article</option>
                      <option value="records">School Records</option>
                      <option value="government">Government Reports</option>
                      <option value="witness">Witness Accounts</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verified By</label>
                    <input
                      type="text"
                      value={formData.historicalDetails?.verifiedBy || ''}
                      onChange={(e) => handleInputChange('historicalDetails.verifiedBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name/Authority who verified"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Date</label>
                    <input
                      type="date"
                      value={formData.historicalDetails?.verificationDate || ''}
                      onChange={(e) => handleInputChange('historicalDetails.verificationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documentation Links</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      id="docInput"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/article"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          handleArrayAdd('historicalDetails.documentation', input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('docInput') as HTMLInputElement;
                        if (input) {
                          handleArrayAdd('historicalDetails.documentation', input.value);
                          input.value = '';
                        }
                      }}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {(formData.historicalDetails?.documentation || []).map((doc, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex items-center justify-between"
                      >
                        <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                          {doc}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleArrayRemove('historicalDetails.documentation', index)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Lessons & Improvements */}
            {activeSection === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lessons & Improvements</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lessons Learned</label>
                  <textarea
                    value={formData.historicalDetails?.lessonsLearned || ''}
                    onChange={(e) => handleInputChange('historicalDetails.lessonsLearned', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="What lessons were learned from this incident?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precautions Taken</label>
                  <textarea
                    value={formData.historicalDetails?.precautionsTaken || ''}
                    onChange={(e) => handleInputChange('historicalDetails.precautionsTaken', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="What precautions were taken after this incident?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Improvements Made</label>
                  <textarea
                    value={formData.historicalDetails?.improvementsMade || ''}
                    onChange={(e) => handleInputChange('historicalDetails.improvementsMade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="What improvements were made to prevent similar incidents?"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {activeSection > 1 && (
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection - 1)}
                    variant="outline"
                  >
                    ← Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {activeSection < sections.length ? (
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection + 1)}
                    variant="outline"
                  >
                    Next →
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Historical Incident'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
