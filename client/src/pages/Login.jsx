import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [email, setEmail] = useState('rep@dealflow360.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'sales_rep', name: 'Alex Rep', email: 'rep@dealflow360.com', title: 'Sales Rep' },
    { role: 'sales_manager', name: 'Sarah Manager', email: 'manager@dealflow360.com', title: 'Sales Manager' },
    { role: 'finance', name: 'David Finance', email: 'finance@dealflow360.com', title: 'Finance' },
    { role: 'admin', name: 'Elena Admin', email: 'admin@dealflow360.com', title: 'Admin' }
  ];

  const handleQuickDemoLogin = (demoUser) => {
    const user = {
      id: 'demo-' + demoUser.role,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      companyId: '11111111-1111-1111-1111-111111111111'
    };
    localStorage.setItem('token', 'demo-jwt-token-' + demoUser.role);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/app/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isCustomerMode ? '/auth/customer/login' : '/auth/login';
      const res = await api.post(endpoint, { email, password });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user || res.data.customer));
        if (isCustomerMode) {
          navigate('/portal/demo-quote-1');
        } else {
          navigate('/app/dashboard');
        }
      }
    } catch (err) {
      // Fallback for demo mode if backend DB credentials aren't configured yet
      const matched = demoAccounts.find(a => a.email === email);
      if (matched) {
        handleQuickDemoLogin(matched);
        return;
      }
      setError(err.response?.data?.error || 'Authentication failed. Try demo accounts below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-primary-600 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-900/50 mb-4">
          DF
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          DealFlow360
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Intelligent, Self-Governing Sales Operations Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => setIsCustomerMode(false)}
              className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition-all ${
                !isCustomerMode 
                  ? 'border-primary-500 text-primary-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal Sales Portal
            </button>
            <button
              onClick={() => setIsCustomerMode(true)}
              className={`flex-1 py-2 text-center text-sm font-semibold border-b-2 transition-all ${
                isCustomerMode 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Portal Login
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-md transition-all text-sm flex justify-center items-center"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                `Sign in to ${isCustomerMode ? 'Customer Portal' : 'Sales Workspace'}`
              )}
            </button>
          </form>

          {/* Quick Hackathon Presets */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              ⚡ 1-Click Hackathon Presets
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(demo => (
                <button
                  key={demo.role}
                  onClick={() => handleQuickDemoLogin(demo)}
                  className="bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2 px-3 rounded-lg text-xs font-medium text-left transition-all flex items-center justify-between"
                >
                  <span>{demo.title}</span>
                  <i className="fa-solid fa-chevron-right text-[10px] text-slate-500"></i>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
