import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isCustomerMode && isSignup) {
        const res = await api.post('/auth/customer/signup', { name, email, password });
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.customer));
          navigate('/customer/dashboard');
          return;
        }
      }

      const endpoint = isCustomerMode ? '/auth/customer/login' : '/auth/login';
      const res = await api.post(endpoint, { email, password });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        const userData = res.data.user || res.data.customer;
        localStorage.setItem('user', JSON.stringify(userData));

        if (isCustomerMode || userData.role === 'customer') {
          navigate('/customer/dashboard');
        } else {
          navigate('/app/pipeline');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg mb-4">
          DF
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          DealFlow360
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Enterprise Sales Operations Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          
          {/* Portal Switcher */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => { setIsCustomerMode(false); setIsSignup(false); setError(''); }}
              className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
                !isCustomerMode 
                  ? 'border-primary-500 text-primary-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal Sales Portal
            </button>
            <button
              type="button"
              onClick={() => { setIsCustomerMode(true); setError(''); }}
              className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
                isCustomerMode 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer Portal Login
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isCustomerMode && isSignup && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-xs ${
                  isCustomerMode ? 'focus:ring-emerald-500' : 'focus:ring-primary-500'
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-xs ${
                  isCustomerMode ? 'focus:ring-emerald-500' : 'focus:ring-primary-500'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-md transition-all text-xs flex justify-center items-center ${
                isCustomerMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : 'bg-primary-600 hover:bg-primary-500'
              }`}
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                `Sign in to ${isCustomerMode ? 'Customer Portal' : 'Sales Workspace'}`
              )}
            </button>
          </form>

          {isCustomerMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                {isSignup ? 'Already have a customer account? Sign in' : "Don't have a customer account? Sign up"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
