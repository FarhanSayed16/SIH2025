/**
 * Message Templates Page - Enhanced
 * Complete template management with variables, preview, quick use, and more
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { templatesApi, MessageTemplate } from '@/lib/api/templates';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// Available template variables
const AVAILABLE_VARIABLES = [
  { name: 'studentName', description: 'Student name', example: 'John Doe' },
  { name: 'className', description: 'Class name', example: '10-A' },
  { name: 'institutionName', description: 'School name', example: 'Delhi Public School' },
  { name: 'teacherName', description: 'Teacher name', example: 'Ms. Anjali' },
  { name: 'date', description: 'Current date', example: '2025-12-02' },
  { name: 'time', description: 'Current time', example: '10:30 AM' },
  { name: 'drillType', description: 'Type of drill', example: 'Fire Drill' },
  { name: 'location', description: 'Location', example: 'Main Building' },
  { name: 'eventName', description: 'Event name', example: 'Annual Day' },
  { name: 'announcementDate', description: 'Announcement date', example: '2025-12-15' },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [filter, setFilter] = useState<{ category?: string; channel?: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [previewChannel, setPreviewChannel] = useState<'sms' | 'email' | 'push'>('push');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'general' as 'emergency' | 'drill' | 'announcement' | 'parent' | 'general',
    channels: [] as ('sms' | 'email' | 'push')[],
    content: {
      sms: { body: '' },
      email: { subject: '', body: '', htmlBody: '' },
      push: { title: '', body: '' },
    },
    variables: [] as Array<{ name: string; description?: string; defaultValue?: string }>,
    isGlobal: false,
  });

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await templatesApi.getTemplates(filter as any);
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filter, showToast]);

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

    loadTemplates();
  }, [isAuthenticated, router, accessToken, loadTemplates]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a template name', 'warning');
      return;
    }
    if (formData.channels.length === 0) {
      showToast('Please select at least one channel', 'warning');
      return;
    }

    try {
      const response = editingTemplate
        ? await templatesApi.update(editingTemplate._id, formData)
        : await templatesApi.create(formData);

      if (response.success) {
        showToast(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`, 'success');
        setShowEditor(false);
        setEditingTemplate(null);
        resetForm();
        loadTemplates();
      } else {
        showToast(`Failed to save template: ${response.error || response.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      showToast(`Error: ${error.message || 'Failed to save template'}`, 'error');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      channels: template.channels,
      content: template.content as any,
      variables: template.variables || [],
      isGlobal: template.isGlobal || false,
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await templatesApi.delete(id);
      if (response.success) {
        showToast('Template deleted successfully!', 'success');
        loadTemplates();
      } else {
        showToast(`Failed to delete template: ${response.error || response.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      showToast(`Error: ${error.message || 'Failed to delete template'}`, 'error');
    }
  };

  const handleDuplicate = (template: MessageTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `Copy of ${template.name}`,
      category: template.category,
      channels: template.channels,
      content: template.content as any,
      variables: template.variables || [],
      isGlobal: template.isGlobal || false,
    });
    setShowEditor(true);
  };

  const handlePreview = async (template: MessageTemplate, channel: 'sms' | 'email' | 'push') => {
    setPreviewTemplate(template);
    setPreviewChannel(channel);
    setPreviewVariables({});
    setShowPreview(true);
    setIsPreviewLoading(true);

    // Initialize preview variables with defaults
    const vars: Record<string, string> = {};
    if (template.variables) {
      template.variables.forEach(v => {
        vars[v.name] = v.defaultValue || AVAILABLE_VARIABLES.find(av => av.name === v.name)?.example || '';
      });
    }
    setPreviewVariables(vars);

    // Load preview
    try {
      const response = await templatesApi.preview(template._id, channel, vars);
      if (response.success) {
        setPreviewResult(response.data);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      showToast('Failed to preview template', 'error');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const updatePreview = async () => {
    if (!previewTemplate) return;
    setIsPreviewLoading(true);
    try {
      const response = await templatesApi.preview(previewTemplate._id, previewChannel, previewVariables);
      if (response.success) {
        setPreviewResult(response.data);
      }
    } catch (error) {
      console.error('Error updating preview:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    // Navigate to broadcast page with template pre-filled
    const params = new URLSearchParams();
    params.set('templateId', template._id);
    router.push(`/broadcast?${params.toString()}`);
  };

  const insertVariable = (field: string, variable: string) => {
    const varSyntax = `{{${variable}}}`;
    if (field.startsWith('sms.body')) {
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          sms: { ...formData.content.sms, body: formData.content.sms.body + varSyntax }
        }
      });
    } else if (field.startsWith('email.subject')) {
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          email: { ...formData.content.email, subject: formData.content.email.subject + varSyntax }
        }
      });
    } else if (field.startsWith('email.body')) {
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          email: { ...formData.content.email, body: formData.content.email.body + varSyntax }
        }
      });
    } else if (field.startsWith('push.title')) {
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          push: { ...formData.content.push, title: formData.content.push.title + varSyntax }
        }
      });
    } else if (field.startsWith('push.body')) {
      setFormData({
        ...formData,
        content: {
          ...formData.content,
          push: { ...formData.content.push, body: formData.content.push.body + varSyntax }
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'general',
      channels: [],
      content: {
        sms: { body: '' },
        email: { subject: '', body: '', htmlBody: '' },
        push: { title: '', body: '' },
      },
      variables: [],
      isGlobal: false,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'drill': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'announcement': return 'bg-green-100 text-green-800 border-green-200';
      case 'parent': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push': return '📱';
      case 'email': return '📧';
      case 'sms': return '💬';
      default: return '📢';
    }
  };

  // Filter templates by search query
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      (template.content.push?.title?.toLowerCase().includes(query)) ||
      (template.content.push?.body?.toLowerCase().includes(query)) ||
      (template.content.email?.subject?.toLowerCase().includes(query)) ||
      (template.content.email?.body?.toLowerCase().includes(query)) ||
      (template.content.sms?.body?.toLowerCase().includes(query))
    );
  });

  // Get SMS character count
  const getSMSCharCount = (text: string) => {
    return text.length;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
              <p className="text-gray-600 mt-1">Create and manage reusable message templates for broadcasts</p>
            </div>
            <Button onClick={() => { setShowEditor(!showEditor); setEditingTemplate(null); resetForm(); }}>
              {showEditor ? 'Cancel' : '+ New Template'}
            </Button>
          </div>

          {/* Editor */}
          {showEditor && (
            <Card className="mb-6 p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Emergency Drill Alert"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="emergency">Emergency</option>
                      <option value="drill">Drill</option>
                      <option value="announcement">Announcement</option>
                      <option value="parent">Parent</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Channels *</label>
                  <div className="flex gap-4">
                    {['push', 'email', 'sms'].map((channel) => (
                      <label key={channel} className="flex items-center cursor-pointer">
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
                          className="mr-2 w-4 h-4"
                        />
                        <span className="capitalize">{getChannelIcon(channel)} {channel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Template Variables */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Template Variables</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Add variables to personalize messages. Use <code className="bg-white px-1 py-0.5 rounded">{'{{variableName}}'}</code> in your content.
                  </p>
                  <div className="space-y-2">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={variable.name}
                          onChange={(e) => {
                            const newVars = [...formData.variables];
                            newVars[index].name = e.target.value;
                            setFormData({ ...formData, variables: newVars });
                          }}
                          placeholder="Variable name (e.g., studentName)"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={variable.description || ''}
                          onChange={(e) => {
                            const newVars = [...formData.variables];
                            newVars[index].description = e.target.value;
                            setFormData({ ...formData, variables: newVars });
                          }}
                          placeholder="Description"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={variable.defaultValue || ''}
                          onChange={(e) => {
                            const newVars = [...formData.variables];
                            newVars[index].defaultValue = e.target.value;
                            setFormData({ ...formData, variables: newVars });
                          }}
                          placeholder="Default value"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <Button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              variables: formData.variables.filter((_, i) => i !== index)
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          variables: [...formData.variables, { name: '', description: '', defaultValue: '' }]
                        });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      + Add Variable
                    </Button>
                  </div>
                </div>

                {/* Channel Content Editors */}
                {formData.channels.includes('push') && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">📱 Push Notification</h3>
                      <div className="flex gap-2 flex-wrap">
                        {AVAILABLE_VARIABLES.slice(0, 5).map(v => (
                          <button
                            key={v.name}
                            onClick={() => insertVariable('push.title', v.name)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title={v.description}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.content.push.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        content: { ...formData.content, push: { ...formData.content.push, title: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Notification Title"
                    />
                    <textarea
                      value={formData.content.push.body}
                      onChange={(e) => setFormData({
                        ...formData,
                        content: { ...formData.content, push: { ...formData.content.push, body: e.target.value } }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Notification Body"
                    />
                  </div>
                )}

                {formData.channels.includes('email') && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">📧 Email</h3>
                      <div className="flex gap-2 flex-wrap">
                        {AVAILABLE_VARIABLES.slice(0, 5).map(v => (
                          <button
                            key={v.name}
                            onClick={() => insertVariable('email.subject', v.name)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title={v.description}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.content.email.subject}
                      onChange={(e) => setFormData({
                        ...formData,
                        content: { ...formData.content, email: { ...formData.content.email, subject: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Email Subject"
                    />
                    <textarea
                      value={formData.content.email.body}
                      onChange={(e) => setFormData({
                        ...formData,
                        content: { ...formData.content, email: { ...formData.content.email, body: e.target.value } }
                      })}
                      rows={5}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Email Body"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">HTML Body (Optional)</label>
                      <textarea
                        value={formData.content.email.htmlBody}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, email: { ...formData.content.email, htmlBody: e.target.value } }
                        })}
                        rows={5}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                        placeholder="HTML content (optional)"
                      />
                    </div>
                  </div>
                )}

                {formData.channels.includes('sms') && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">💬 SMS</h3>
                      <div className="flex gap-2 flex-wrap">
                        {AVAILABLE_VARIABLES.slice(0, 5).map(v => (
                          <button
                            key={v.name}
                            onClick={() => insertVariable('sms.body', v.name)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            title={v.description}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={formData.content.sms.body}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, sms: { ...formData.content.sms, body: e.target.value } }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="SMS Message"
                        maxLength={160}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Maximum 160 characters</span>
                        <span className={`text-xs ${getSMSCharCount(formData.content.sms.body) > 160 ? 'text-red-600' : 'text-gray-500'}`}>
                          {getSMSCharCount(formData.content.sms.body)}/160
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isGlobal" className="text-sm text-gray-700">
                    Make this template available to all institutions (Global)
                  </label>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={!formData.name || formData.channels.length === 0}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button onClick={() => { setShowEditor(false); resetForm(); setEditingTemplate(null); }} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Filters and Search */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filter.category || ''}
              onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="emergency">Emergency</option>
              <option value="drill">Drill</option>
              <option value="announcement">Announcement</option>
              <option value="parent">Parent</option>
              <option value="general">General</option>
            </select>
            <select
              value={filter.channel || ''}
              onChange={(e) => setFilter({ ...filter, channel: e.target.value || undefined })}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Channels</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
            </select>
          </div>

          {/* Templates Grid */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Templates ({filteredTemplates.length})</h2>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No templates found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div key={template._id} className="border rounded-lg p-4 hover:shadow-lg transition-all bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                            {template.isGlobal && (
                              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                Global
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex gap-2 flex-wrap mb-2">
                          {template.channels.map((channel) => (
                            <span key={channel} className="text-xs px-2 py-1 bg-gray-100 rounded">
                              {getChannelIcon(channel)} {channel}
                            </span>
                          ))}
                        </div>
                        {template.variables && template.variables.length > 0 && (
                          <div className="text-xs text-gray-600 mb-2">
                            Variables: {template.variables.map(v => v.name).join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 mb-3 text-xs text-gray-600">
                        {template.content.push && (
                          <div>
                            <strong>Push:</strong> {template.content.push.title || 'N/A'}
                          </div>
                        )}
                        {template.content.email && (
                          <div>
                            <strong>Email:</strong> {template.content.email.subject || 'N/A'}
                          </div>
                        )}
                        {template.content.sms && (
                          <div>
                            <strong>SMS:</strong> {template.content.sms.body?.substring(0, 40) || 'N/A'}...
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap pt-3 border-t">
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Use Template
                        </Button>
                        <Button
                          onClick={() => handlePreview(template, template.channels[0] || 'push')}
                          size="sm"
                          variant="outline"
                        >
                          Preview
                        </Button>
                        <Button
                          onClick={() => handleEdit(template)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDuplicate(template)}
                          size="sm"
                          variant="outline"
                          title="Duplicate"
                        >
                          📋
                        </Button>
                        <Button
                          onClick={() => handleDelete(template._id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Preview Template: {previewTemplate.name}</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Preview Channel</label>
                <select
                  value={previewChannel}
                  onChange={(e) => {
                    setPreviewChannel(e.target.value as any);
                    handlePreview(previewTemplate, e.target.value as any);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {previewTemplate.channels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                <div className="mb-4 space-y-2">
                  <label className="block text-sm font-medium">Template Variables</label>
                  {previewTemplate.variables.map((variable, index) => (
                    <div key={index} className="flex gap-2">
                      <label className="flex-1 text-sm text-gray-700">{variable.name}:</label>
                      <input
                        type="text"
                        value={previewVariables[variable.name] || ''}
                        onChange={(e) => {
                          setPreviewVariables({
                            ...previewVariables,
                            [variable.name]: e.target.value
                          });
                        }}
                        onBlur={updatePreview}
                        placeholder={variable.defaultValue || variable.description || 'Enter value'}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  ))}
                  <Button onClick={updatePreview} size="sm" disabled={isPreviewLoading}>
                    {isPreviewLoading ? 'Updating...' : 'Update Preview'}
                  </Button>
                </div>
              )}

              {isPreviewLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading preview...</p>
                </div>
              ) : previewResult ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-2">Preview ({previewChannel}):</h3>
                  {previewChannel === 'push' && (
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded border">
                        <div className="font-semibold">{previewResult.title || 'N/A'}</div>
                        <div className="text-sm text-gray-600 mt-1">{previewResult.body || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {previewChannel === 'email' && (
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded border">
                        <div className="text-sm text-gray-600 mb-1">Subject:</div>
                        <div className="font-semibold">{previewResult.subject || 'N/A'}</div>
                        <div className="text-sm text-gray-600 mt-3 mb-1">Body:</div>
                        <div className="whitespace-pre-wrap">{previewResult.body || previewResult.htmlBody || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {previewChannel === 'sms' && (
                    <div className="bg-white p-3 rounded border">
                      <div className="whitespace-pre-wrap">{previewResult.body || 'N/A'}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {previewResult.body?.length || 0} characters
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No preview available</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
