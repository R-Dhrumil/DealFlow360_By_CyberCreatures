import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    is_manual_payment_enabled: false,
    is_upi_payment_enabled: false,
    is_cod_enabled: false,
    upi_id: '',
    manual_payment_instructions: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/companies/payment-settings');
        if (data) {
          setSettings({
            is_manual_payment_enabled: !!data.is_manual_payment_enabled,
            is_upi_payment_enabled: !!data.is_upi_payment_enabled,
            is_cod_enabled: !!data.is_cod_enabled,
            upi_id: data.upi_id || '',
            manual_payment_instructions: data.manual_payment_instructions || ''
          });
        }
      } catch (err) {
        console.error('Failed to load payment settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/companies/payment-settings', settings);
      setMessage(res.data?.message || 'Settings updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Failed to update settings', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Error saving settings.';
      setMessage(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <Settings className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Settings</h1>
          <p className="text-slate-500">Configure accepted payment methods for your customers.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
          
          {/* Manual Payment Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Manual Payment (Bank Transfer)</h3>
                <p className="text-sm text-slate-500">Allow customers to pay via direct bank transfer.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_manual_payment_enabled" checked={settings.is_manual_payment_enabled} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {settings.is_manual_payment_enabled && (
              <div className="pl-0 md:pl-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Instructions / Bank Details</label>
                <textarea
                  name="manual_payment_instructions"
                  value={settings.manual_payment_instructions || ''}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Enter bank account details or wire instructions here..."
                ></textarea>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* UPI Payment Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">UPI Payment</h3>
                <p className="text-sm text-slate-500">Accept payments via UPI.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_upi_payment_enabled" checked={settings.is_upi_payment_enabled} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {settings.is_upi_payment_enabled && (
              <div className="pl-0 md:pl-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">UPI ID</label>
                <input
                  type="text"
                  name="upi_id"
                  value={settings.upi_id || ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. yourbusiness@upi"
                />
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* COD Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cash on Delivery (COD)</h3>
                <p className="text-sm text-slate-500">Allow customers to pay when products are delivered.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_cod_enabled" checked={settings.is_cod_enabled} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {message && (
              <span className={`flex items-center gap-2 ${message.includes('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                {message.includes('Error') ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                {message}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all focus:ring-4 focus:ring-indigo-100 disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentSettings;
