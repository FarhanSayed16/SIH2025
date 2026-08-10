/**
 * Broadcast Messages Page - Enhanced UI
 * Professional broadcast management with history, stats, and filtering
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { broadcastApi, BroadcastMessage, BroadcastRecipients } from '@/lib/api/broadcast';
import { templatesApi, MessageTemplate } from '@/lib/api/templates';
import { aiApi } from '@/lib/api/ai';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | 'emergency' | 'announcement' | 'drill' | 'general';
type FilterStatus = 'all' | 'sent' | 'sending' | 'scheduled' | 'failed' | 'draft';

export default function BroadcastPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // G1: Translate loading
  const [isTranslating, setIsTranslating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Simplify: single, fast path that works for admin and teacher alike
    type: 'announcement' as 'emergency' | 'announcement' | 'drill' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    recipientType: 'all' as 'all' | 'students' | 'teachers' | 'parents' | 'admins' | 'custom',
    channels: ['push'] as ('sms' | 'email' | 'push')[], // force push by default for reliability
    subject: '',
    title: '',
    message: '',
    templateId: '',
    scheduledAt: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (accessToken) {
      import('@/lib/api/client').then(({ apiClient }) => {
        apiClient.setToken(accessToken);
      });
    }

    loadBroadcasts();
    loadTemplates();
  }, [isAuthenticated, router, accessToken]);

  // O7: Pre-fill message from incident "Send via broadcast" (e.g. /broadcast?message=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const messageParam = params.get('message');
    if (messageParam) {
      const decoded = decodeURIComponent(messageParam);
      setFormData(prev => ({ ...prev, message: decoded }));
      setShowComposer(true);
      router.replace('/broadcast', { scroll: false });
    }
  }, [router]);

  // Handle templateId from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
    
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        // Pre-fill form with template data
        setFormData({
          type: template.category === 'emergency' ? 'emergency' : 
                template.category === 'drill' ? 'drill' : 
                template.category === 'announcement' ? 'announcement' : 'general',
          priority: 'medium',
          recipientType: 'all',
          channels: template.channels,
          subject: template.content.email?.subject || '',
          title: template.content.push?.title || template.content.email?.subject || '',
          message: template.content.push?.body || template.content.email?.body || template.content.sms?.body || '',
          templateId: template._id,
          scheduledAt: '',
        });
        setShowComposer(true);
        // Clear URL params
        router.replace('/broadcast', { scroll: false });
      }
    }
  }, [templates, router]);

  const loadBroadcasts = async () => {
    setIsLoading(true);
    try {
      const response = await broadcastApi.getBroadcasts({ limit: 100 });
      if (response.success && response.data) {
        // Handle both formats: { broadcasts: [...] } or direct array
        const broadcastsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.broadcasts || []);
        setBroadcasts(broadcastsList);
      }
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.getTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSend = async (scheduled: boolean = false) => {
    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      // Force broadcast to everyone with push for reliability (same behavior for admin/teacher)
      const recipients: BroadcastRecipients = {
        type: 'all',
      };

      const broadcastData: any = {
        type: formData.type,
        priority: formData.priority,
        recipients,
        channels: ['push'],
        message: formData.message,
      };

      if (formData.subject) broadcastData.subject = formData.subject;
      if (formData.title) broadcastData.title = formData.title;
      if (formData.templateId) broadcastData.templateId = formData.templateId;

      let response;
      if (scheduled && formData.scheduledAt) {
        broadcastData.scheduledAt = formData.scheduledAt;
        response = await broadcastApi.schedule(broadcastData);
      } else {
        response = await broadcastApi.send(broadcastData);
      }

      if (response.success) {
        alert('Broadcast sent successfully!');
        setShowComposer(false);
        resetForm();
        await loadBroadcasts();
      } else {
        alert(`Failed to send broadcast: ${response.error || response.message}`);
      }
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      alert(`Error: ${error.message || 'Failed to send broadcast'}`);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'announcement',
      priority: 'medium',
      recipientType: 'all',
      channels: ['push'],
      subject: '',
      title: '',
      message: '',
      templateId: '',
      scheduledAt: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 border-green-200';
      case 'sending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'announcement': return '📢';
      case 'drill': return '🔔';
      case 'general': return '📝';
      default: return '📨';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push': return '📱';
      case 'email': return '📧';
      case 'sms': return '💬';
      default: return '📨';
    }
  };

  // Filter broadcasts
  const filteredBroadcasts = broadcasts.filter(broadcast => {
    // Type filter
    if (filterType !== 'all' && broadcast.type !== filterType) return false;
    
    // Status filter
    if (filterStatus !== 'all' && broadcast.status !== filterStatus) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        broadcast.title || '',
        broadcast.subject || '',
        broadcast.message || '',
        broadcast.type || '',
        broadcast.createdBy?.name || ''
      ].join(' ').toLowerCase();
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  });

  // Calculate summary stats
  const totalBroadcasts = broadcasts.length;
  const sentCount = broadcasts.filter(b => b.status === 'sent').length;
  const failedCount = broadcasts.filter(b => b.status === 'failed').length;
  const scheduledCount = broadcasts.filter(b => b.status === 'scheduled').length;
  const totalRecipients = broadcasts.reduce((sum, b) => sum + (b.stats?.totalRecipients || 0), 0);
  const totalDelivered = broadcasts.reduce((sum, b) => sum + (b.stats?.delivered || 0), 0);
  const totalFailed = broadcasts.reduce((sum, b) => sum + (b.stats?.failed || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Broadcast Messages</h1>
              <p className="text-gray-600 mt-1">Send announcements, alerts, and messages to users</p>
            </div>
            <Button 
              onClick={() => setShowComposer(!showComposer)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {showComposer ? '✕ Cancel' : '+ New Broadcast'}
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Broadcasts</p>
                  <p className="text-2xl font-bold text-blue-900">{totalBroadcasts}</p>
                </div>
                <div className="text-3xl">📨</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Successfully Sent</p>
                  <p className="text-2xl font-bold text-green-900">{sentCount}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Recipients</p>
                  <p className="text-2xl font-bold text-purple-900">{totalRecipients}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{failedCount}</p>
                </div>
                <div className="text-3xl">❌</div>
              </div>
            </Card>
          </div>

          {/* Composer Form */}
          {showComposer && (
            <Card className="mb-6 p-6 border-2 border-blue-200 bg-blue-50/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>✏️</span> Compose New Broadcast
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="emergency">🚨 Emergency</option>
                      <option value="announcement">📢 Announcement</option>
                      <option value="drill">🔔 Drill</option>
                      <option value="general">📝 General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.recipientType}
                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">👥 All Users</option>
                    <option value="students">🎓 Students</option>
                    <option value="teachers">👨‍🏫 Teachers</option>
                    <option value="parents">👨‍👩‍👧 Parents</option>
                    <option value="admins">👤 Admins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channels <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['push', 'email', 'sms'].map((channel) => (
                      <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.channels.includes(channel as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, channels: [...formData.channels, channel as any] });
                            } else {
                              setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {getChannelIcon(channel)} {channel}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title/Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter broadcast title or subject"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDrafting}
                        onClick={async () => {
                          setIsDrafting(true);
                          try {
                            const result = await aiApi.draftAlertMessage(formData.type, formData.priority);
                            if (result?.message) {
                              setFormData((prev) => ({ ...prev, message: result.message }));
                            }
                          } catch (e: any) {
                            console.error('Draft failed:', e);
                          } finally {
                            setIsDrafting(false);
                          }
                        }}
                      >
                        {isDrafting ? '…' : 'Draft with AI'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTranslating || !formData.message.trim()}
                        onClick={async () => {
                          if (!formData.message.trim()) return;
                          setIsTranslating(true);
                          try {
                            const result = await aiApi.translate(formData.message, 'hi');
                            if (result?.translated) {
                              setFormData((prev) => ({ ...prev, message: result.translated }));
                            }
                          } catch (e: any) {
                            console.error('Translate failed:', e);
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                      >
                        {isTranslating ? '…' : 'हिंदी'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTranslating || !formData.message.trim()}
                        onClick={async () => {
                          if (!formData.message.trim()) return;
                          setIsTranslating(true);
                          try {
                            const result = await aiApi.translate(formData.message, 'mr');
                            if (result?.translated) {
                              setFormData((prev) => ({ ...prev, message: result.translated }));
                            }
                          } catch (e: any) {
                            console.error('Translate failed:', e);
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                      >
                        {isTranslating ? '…' : 'मराठी'}
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your message content..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.message.length} characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Use Template (Optional)
                  </label>
                  <select
                    value={formData.templateId}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (templateId) {
                        const template = templates.find(t => t._id === templateId);
                        if (template) {
                          setFormData({
                            ...formData,
                            templateId: template._id,
                            type: template.category === 'emergency' ? 'emergency' : 
                                  template.category === 'drill' ? 'drill' : 
                                  template.category === 'announcement' ? 'announcement' : 'general',
                            channels: template.channels,
                            subject: template.content.email?.subject || '',
                            title: template.content.push?.title || template.content.email?.subject || '',
                            message: template.content.push?.body || template.content.email?.body || template.content.sms?.body || '',
                          });
                        }
                      } else {
                        setFormData({ ...formData, templateId: '' });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Or <a href="/templates" className="text-blue-600 hover:underline">create a new template</a></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleSend(false)}
                    disabled={isSending || !formData.message.trim() || !formData.title.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isSending ? '⏳ Sending...' : '📤 Send Now'}
                  </Button>
                  {formData.scheduledAt && (
                    <Button
                      onClick={() => handleSend(true)}
                      disabled={isSending || !formData.message.trim() || !formData.title.trim()}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6"
                    >
                      {isSending ? '⏳ Scheduling...' : '📅 Schedule'}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowComposer(false);
                      resetForm();
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Filters and Search */}
          <Card className="mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Search broadcasts by title, message, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="drill">🔔 Drill</option>
                  <option value="general">📝 General</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="sent">✅ Sent</option>
                  <option value="sending">⏳ Sending</option>
                  <option value="scheduled">📅 Scheduled</option>
                  <option value="failed">❌ Failed</option>
                  <option value="draft">📝 Draft</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Broadcast History */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📜 Broadcast History</h2>
              <span className="text-sm text-gray-500">
                Showing {filteredBroadcasts.length} of {totalBroadcasts} broadcasts
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading broadcasts...</p>
              </div>
            ) : filteredBroadcasts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No broadcasts found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create your first broadcast to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBroadcasts.map((broadcast) => {
                  const deliveryRate = broadcast.stats?.totalRecipients 
                    ? ((broadcast.stats.delivered || 0) / broadcast.stats.totalRecipients * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div 
                      key={broadcast._id} 
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getTypeIcon(broadcast.type)}</span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {broadcast.title || broadcast.subject || broadcast.type}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(broadcast.priority)}`}>
                              {broadcast.priority.toUpperCase()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(broadcast.status)}`}>
                              {broadcast.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{broadcast.message}</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium">Recipients</p>
                          <p className="text-lg font-bold text-blue-900">{broadcast.stats?.totalRecipients || 0}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                          <p className="text-xs text-green-600 font-medium">Sent</p>
                          <p className="text-lg font-bold text-green-900">{broadcast.stats?.sent || 0}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                          <p className="text-xs text-purple-600 font-medium">Delivered</p>
                          <p className="text-lg font-bold text-purple-900">{broadcast.stats?.delivered || 0}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                          <p className="text-xs text-red-600 font-medium">Failed</p>
                          <p className="text-lg font-bold text-red-900">{broadcast.stats?.failed || 0}</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-100">
                          <p className="text-xs text-yellow-600 font-medium">Delivery Rate</p>
                          <p className="text-lg font-bold text-yellow-900">{deliveryRate}%</p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Channels:</span>
                          <div className="flex gap-1">
                            {broadcast.channels.map((ch) => (
                              <span key={ch} className="px-2 py-0.5 bg-gray-100 rounded">
                                {getChannelIcon(ch)} {ch.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Recipients:</span>
                          <span className="capitalize">{broadcast.recipients.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Created by:</span>
                          <span>{broadcast.createdBy?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Sent:</span>
                          <span>{broadcast.sentAt 
                            ? new Date(broadcast.sentAt).toLocaleString() 
                            : new Date(broadcast.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
