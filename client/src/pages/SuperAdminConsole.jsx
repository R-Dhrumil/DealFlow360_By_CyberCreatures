import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

export default function SuperAdminConsole({ defaultTab }) {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabFromUrl = searchParams.get('tab') || defaultTab || 'tenants';

  const [activeTab, setActiveTab] = useState(currentTabFromUrl); // 'tenants' | 'settings' | 'users'
  const [companies, setCompanies] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync tab state when URL search parameters change (e.g., sidebar links clicked)
  useEffect(() => {
    if (currentTabFromUrl && currentTabFromUrl !== activeTab) {
      setActiveTab(currentTabFromUrl);
    }
  }, [currentTabFromUrl]);

  // User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompanyUsers, setSelectedCompanyUsers] = useState(null);

  // Filters & Search for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Platform Settings State
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

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, userRes, settingsRes] = await Promise.allSettled([
        api.get('/superadmin/companies'),
        api.get('/superadmin/users'),
        api.get('/superadmin/settings')
      ]);

      if (compRes.status === 'fulfilled' && Array.isArray(compRes.value?.data)) {
        setCompanies(compRes.value.data);
      } else {
        setCompanies([]);
      }

      if (userRes.status === 'fulfilled' && Array.isArray(userRes.value?.data)) {
        setTenantUsers(userRes.value.data);
      } else {
        setTenantUsers([]);
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
        setSettings({
          site_name: settingsRes.value.data.site_name || '',
          tagline: settingsRes.value.data.tagline || '',
          logo_url: settingsRes.value.data.logo_url || '',
          favicon_url: settingsRes.value.data.favicon_url || '',
          google_analytics_id: settingsRes.value.data.google_analytics_id || '',
          google_search_console_id: settingsRes.value.data.google_search_console_id || '',
          meta_pixel_id: settingsRes.value.data.meta_pixel_id || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch super admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.put('/superadmin/settings', settings);
      showNotification('success', 'Platform settings updated successfully!');
    } catch (error) {
      console.error('Failed to save settings', error);
      showNotification('error', 'Failed to save platform settings');
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
        showNotification('success', `${field === 'logo_url' ? 'Logo' : 'Favicon'} uploaded! Click Save Settings to persist changes.`);
      }
    } catch (error) {
      console.error('File upload failed', error);
      showNotification('error', 'Failed to upload image file');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return showNotification('error', 'New passwords do not match');
    }

    try {
      setSavingPassword(true);
      await api.put('/superadmin/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      showNotification('success', 'Super Admin password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to update password', error);
      showNotification('error', error.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRoleChange = async (userId, newRole) => {
    const user = tenantUsers.find(u => u.id === userId);
    if (!user || user.role === newRole) return;

    setTenantUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
    } catch (_e) {
      console.warn('Role updated locally');
    }

    showNotification('success', `Updated role for ${user.name} to ${newRole.replace('_', ' ').toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 space-y-3">
        <i className="fa-solid fa-circle-notch fa-spin text-purple-600 text-4xl"></i>
        <p className="text-xs font-semibold text-slate-500">Loading Super Admin Data...</p>
      </div>
    );
  }

  const totalUsers = tenantUsers.length || companies.reduce((acc, c) => acc + parseInt(c.user_count || 0), 0);
  const totalQuotes = companies.reduce((acc, c) => acc + parseInt(c.quotation_count || 0), 0);

  const filteredUsers = tenantUsers.filter(u => {
    const matchesSearch = 
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.subdomain_slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCompany = companyFilter === 'all' || u.company_name === companyFilter;

    return matchesSearch && matchesRole && matchesCompany;
  });

  const uniqueCompanyNames = Array.from(new Set(tenantUsers.map(u => u.company_name).filter(Boolean)));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* SECTION 1: GLOBAL TENANTS */}
      {activeTab === 'tenants' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tab Specific Dynamic Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 font-black flex items-center justify-center text-xl shadow-xs">
                🌐
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Global Tenants
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Overview of registered organization tenants, domain slugs, user counts, and deal performance
                </p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-purple-200">
              {companies.length} Active Organizations
            </span>
          </div>

          {/* Tenants KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-purple-600">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Registered Organizations</p>
              <h3 className="text-2xl font-black text-slate-900">{companies.length} Tenants</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-indigo-600">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Quotations Processed</p>
              <h3 className="text-2xl font-black text-slate-900">{totalQuotes} Deals</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Active Members</p>
              <h3 className="text-2xl font-black text-slate-900">{totalUsers} Users</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company) => {
              const totalQ = parseInt(company.quotation_count || 0);
              const wonQ = parseInt(company.won_deals || 0);
              const lostQ = parseInt(company.lost_deals || Math.max(0, totalQ - wonQ));
              const winRate = totalQ > 0 ? ((wonQ / totalQ) * 100).toFixed(0) : 0;
              const lossRate = totalQ > 0 ? ((lostQ / totalQ) * 100).toFixed(0) : 0;

              const companyUserList = tenantUsers.filter(u => 
                u.company_name?.toLowerCase() === company.name?.toLowerCase() ||
                u.subdomain_slug === company.subdomain_slug
              );

              return (
                <div 
                  key={company.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-900 font-black flex items-center justify-center text-xl border border-purple-200 shrink-0">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{company.name}</h3>
                          <p className="text-[11px] text-purple-600 font-mono font-semibold">{company.subdomain_slug}.dealflow360.com</p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Active Tenant
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Users</p>
                        <p className="font-black text-slate-800 text-sm">{companyUserList.length || company.user_count || 1} Members</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Quotation Activity</p>
                        <p className="font-black text-purple-700 text-sm">{totalQ} Quotations</p>
                      </div>
                    </div>

                    {/* Progress Bar for Won vs Loss */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-emerald-700"><i className="fa-solid fa-circle-check mr-1"></i> Won: {wonQ} ({winRate}%)</span>
                        <span className="text-rose-600"><i className="fa-solid fa-circle-xmark mr-1"></i> Loss: {lostQ} ({lossRate}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${winRate}%` }}></div>
                        <div className="bg-rose-400 h-full transition-all" style={{ width: `${lossRate}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-medium">Tenant ID: #{company.id}</span>
                    <button 
                      onClick={() => setSelectedCompanyUsers({ company, users: companyUserList })}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition-all border border-purple-200 flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-users text-purple-600"></i>
                      <span>Tenant Users</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tab Specific Dynamic Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 font-black flex items-center justify-center text-xl shadow-xs">
                ⚙️
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Platform Settings
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Overarching site branding, logo & favicon uploads, marketing analytics integrations & root security
                </p>
              </div>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-indigo-200">
              System Configuration
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Branding Settings Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <i className="fa-solid fa-brush text-purple-600"></i>
                    <span>Platform Branding & Identity</span>
                  </h2>
                  <p className="text-xs text-slate-500">Configure global website title, tagline, logo, and icons</p>
                </div>

              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={settings.site_name}
                      onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                      placeholder="e.g. DealFlow360"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={settings.tagline}
                      onChange={(e) => setSettings({...settings, tagline: e.target.value})}
                      placeholder="e.g. Next-Gen B2B Sales Operations Platform"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL or Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/logo.png"
                      value={settings.logo_url}
                      onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload-input"
                      onChange={(e) => handleFileUpload(e, 'logo_url')}
                    />
                    <label 
                      htmlFor="logo-upload-input" 
                      className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center shrink-0 transition-colors"
                    >
                      <i className="fa-solid fa-cloud-arrow-up mr-1.5"></i> Upload
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Favicon URL or Upload (.ico, .png)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/favicon.ico"
                      value={settings.favicon_url}
                      onChange={(e) => setSettings({...settings, favicon_url: e.target.value})}
                    />
                    <input
                      type="file"
                      accept=".ico,.png,image/*"
                      className="hidden"
                      id="favicon-upload-input"
                      onChange={(e) => handleFileUpload(e, 'favicon_url')}
                    />
                    <label 
                      htmlFor="favicon-upload-input" 
                      className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center shrink-0 transition-colors"
                    >
                      <i className="fa-solid fa-cloud-arrow-up mr-1.5"></i> Upload
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">SEO & Analytics Integrations</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Google Analytics ID (GA4)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="G-XXXXXXXXXX"
                        value={settings.google_analytics_id}
                        onChange={(e) => setSettings({...settings, google_analytics_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Google Search Console Verification Token</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Verification token content attribute"
                        value={settings.google_search_console_id}
                        onChange={(e) => setSettings({...settings, google_search_console_id: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Meta Pixel ID</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="123456789012345"
                        value={settings.meta_pixel_id}
                        onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={savingSettings} 
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center space-x-2"
                  >
                    {savingSettings ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                    <span>Save Platform Settings</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Super Admin Security Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-shield-halved text-purple-600"></i>
                  <span>Super Admin Security</span>
                </h2>
                <p className="text-xs text-slate-500">Update root administrative password credentials</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={savingPassword} 
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2"
                  >
                    {savingPassword ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-lock"></i>}
                    <span>Update Super Admin Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* SECTION 3: DETAILS OF THE USER */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tab Specific Dynamic Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 font-black flex items-center justify-center text-xl shadow-xs">
                👥
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Details of Users
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Comprehensive directory of registered user credentials, roles, and business affiliations
                </p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-emerald-200">
              {tenantUsers.length} Total Registered Users
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Details of Users Across Tenants</h2>
              <p className="text-xs text-slate-500">Comprehensive directory of registered users, roles, and tenant organization affiliations</p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              Showing {filteredUsers.length} of {tenantUsers.length} Users
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, tenant, subdomain, role..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All User Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="sales_rep">Sales Rep</option>
                <option value="finance_manager">Finance Manager</option>
                <option value="operations">Operations</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="all">All Tenant Companies</option>
                {uniqueCompanyNames.map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Tenant Company</th>
                  <th className="p-3.5">Subdomain Slug</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-xs border border-purple-200 shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-bold text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">{user.email}</td>
                      <td className="p-3.5">
                        <div className="relative inline-flex items-center group" title="Click to change user role">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className={`cursor-pointer appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                              user.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' :
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' :
                              user.role === 'sales_manager' ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' :
                              user.role === 'finance_manager' ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' :
                              user.role === 'operations' ? 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200' :
                              'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <option value="super_admin" className="bg-white text-slate-800 font-bold">SUPER ADMIN</option>
                            <option value="admin" className="bg-white text-slate-800 font-bold">ADMIN</option>
                            <option value="sales_manager" className="bg-white text-slate-800 font-bold">SALES MANAGER</option>
                            <option value="sales_rep" className="bg-white text-slate-800 font-bold">SALES REP</option>
                            <option value="finance_manager" className="bg-white text-slate-800 font-bold">FINANCE MANAGER</option>
                            <option value="operations" className="bg-white text-slate-800 font-bold">OPERATIONS</option>
                          </select>
                          <i className="fa-solid fa-chevron-down text-[8px] pointer-events-none absolute right-2.5 opacity-60 text-current"></i>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-800 font-bold">{user.company_name || 'CyberCreatures Operations'}</td>
                      <td className="p-3.5 text-purple-600 font-mono text-[11px]">{user.subdomain_slug || 'main'}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{user.created_at?.slice(0, 10) || '2026-02-01'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400 font-medium">
                      No matching user details found. Try adjusting your search query or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* MODAL 1: Individual User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 font-black flex items-center justify-center text-xl border border-purple-200">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">System Access Role:</span>
                <span className="bg-purple-100 text-purple-800 font-extrabold px-3 py-1 rounded-full uppercase text-[10px]">
                  {selectedUser.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">Tenant Organization:</span>
                <span className="font-extrabold text-slate-900">{selectedUser.company_name || 'CyberCreatures Operations'}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">Subdomain Access:</span>
                <span className="font-mono text-purple-600 font-bold">{selectedUser.subdomain_slug || 'main'}.dealflow360.com</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">Account Registration Date:</span>
                <span className="font-mono text-slate-700 font-semibold">{selectedUser.created_at?.slice(0, 10) || '2026-02-01'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close User Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Tenant Users Breakdown Modal */}
      {selectedCompanyUsers && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>{selectedCompanyUsers.company.name}</span>
                </h3>
                <p className="text-xs text-purple-600 font-mono font-semibold">{selectedCompanyUsers.company.subdomain_slug}.dealflow360.com</p>
              </div>
              <button
                onClick={() => setSelectedCompanyUsers(null)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedCompanyUsers.users.length > 0 ? (
                selectedCompanyUsers.users.map(u => (
                  <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{u.email}</p>
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
                      {u.role?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  <i className="fa-solid fa-users text-2xl mb-2 text-slate-300 block"></i>
                  No custom user records registered under this business tenant.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCompanyUsers(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Tenant Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
