import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState({
    site_name: '',
    tagline: '',
    logo_url: '',
    favicon_url: '',
    google_analytics_id: '',
    google_search_console_id: '',
    meta_pixel_id: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/settings');
      if (response.data) {
        setSettings({
          site_name: response.data.site_name || '',
          tagline: response.data.tagline || '',
          logo_url: response.data.logo_url || '',
          favicon_url: response.data.favicon_url || '',
          google_analytics_id: response.data.google_analytics_id || '',
          google_search_console_id: response.data.google_search_console_id || '',
          meta_pixel_id: response.data.meta_pixel_id || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      showMessage('error', 'Failed to load global settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.put('/superadmin/settings', settings);
      showMessage('success', 'Global settings updated successfully! Refresh to see branding changes.');
    } catch (error) {
      console.error('Failed to save settings', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/superadmin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data && response.data.url) {
        setSettings(prev => ({ ...prev, [field]: response.data.url }));
        showMessage('success', `${field === 'logo_url' ? 'Logo' : 'Favicon'} uploaded! Don't forget to save settings.`);
      }
    } catch (error) {
      console.error('File upload failed', error);
      showMessage('error', 'Failed to upload file');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showMessage('error', 'New passwords do not match');
    }
    
    try {
      setSavingPassword(true);
      await api.put('/superadmin/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      showMessage('success', 'Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to update password', error);
      showMessage('error', error.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <i className="fa-solid fa-cogs text-slate-500 mr-3"></i>
          Global Site Settings
        </h1>
        <p className="text-slate-500">Manage overarching platform branding, SEO, and security.</p>
      </header>

      {message.text && (
        <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex">
            <i className={`fa-solid ${message.type === 'success' ? 'fa-check-circle text-green-400' : 'fa-exclamation-circle text-red-400'} mt-0.5 mr-3`}></i>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Branding & General Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Branding & Identity</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Site Name</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={settings.site_name}
                    onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={settings.tagline}
                    onChange={(e) => setSettings({...settings, tagline: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="input-field w-full"
                    placeholder="https://example.com/logo.png"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => handleFileUpload(e, 'logo_url')}
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded transition-colors flex items-center shrink-0">
                    <i className="fa-solid fa-upload md:mr-2"></i> <span className="hidden md:inline">Upload</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Favicon URL or Upload (.ico, .png)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="input-field w-full"
                    placeholder="https://example.com/favicon.ico"
                    value={settings.favicon_url}
                    onChange={(e) => setSettings({...settings, favicon_url: e.target.value})}
                  />
                  <input
                    type="file"
                    accept=".ico,.png"
                    className="hidden"
                    id="favicon-upload"
                    onChange={(e) => handleFileUpload(e, 'favicon_url')}
                  />
                  <label htmlFor="favicon-upload" className="cursor-pointer bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded transition-colors flex items-center shrink-0">
                    <i className="fa-solid fa-upload md:mr-2"></i> <span className="hidden md:inline">Upload</span>
                  </label>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mt-8 mb-4 border-b border-slate-100 pb-2">SEO & Marketing Integrations</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Analytics ID (GA4)</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="G-XXXXXXXXXX"
                  value={settings.google_analytics_id}
                  onChange={(e) => setSettings({...settings, google_analytics_id: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Search Console Verification</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. jf8a29x... (content attribute value)"
                  value={settings.google_search_console_id}
                  onChange={(e) => setSettings({...settings, google_search_console_id: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Pixel ID</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="123456789012345"
                  value={settings.meta_pixel_id}
                  onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={savingSettings} className="btn-primary">
                  {savingSettings ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-save mr-2"></i>}
                  Save Global Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Security */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Security</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="input-field w-full"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="input-field w-full"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="input-field w-full"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={savingPassword} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center">
                  {savingPassword ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-lock mr-2"></i>}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
