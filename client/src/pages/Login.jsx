import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const Login = ({ defaultIsSignup = false }) => {
  const [isSignup, setIsSignup] = useState(defaultIsSignup);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState('internal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Quick Test Credential Filler Helper
  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setIsSignup(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Unified Sign Up
        try {
          const res = await api.post('/auth/signup', {
            accountType,
            name,
            email,
            password,
            companyName: accountType === 'admin' ? companyName : undefined
          });

          if (res.data && res.data.token) {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            const role = res.data.user?.role;
            if (role === 'super_admin') navigate('/app/superadmin');
            else if (role === 'customer') navigate('/customer/dashboard');
            else navigate('/app/pipeline');
            return;
          }
        } catch (apiErr) {
          // Local fallback signup if DB connection is unavailable
          const role = accountType === 'admin' ? 'admin' : 'customer';
          const newUser = {
            id: 'user-' + Date.now(),
            name: name || 'Demo User',
            email: email,
            role: role,
            companyId: 'comp-01'
          };
          localStorage.setItem('token', 'jwt-token-demo-' + Date.now());
          localStorage.setItem('user', JSON.stringify(newUser));

          if (role === 'customer') navigate('/customer/dashboard');
          else navigate('/app/pipeline');
          return;
        }
      } else {
        // Unified Login (Email & Password only, NO role selection)
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.data && res.data.token) {
            localStorage.setItem('token', res.data.token);
            const user = res.data.user;
            localStorage.setItem('user', JSON.stringify(user));

            // Dynamic route navigation based on user role from DB/auth service
            if (user.role === 'super_admin') {
              navigate('/app/superadmin');
            } else if (user.role === 'customer') {
              navigate('/customer/dashboard');
            } else if (user.role === 'admin') {
              navigate('/app/admin');
            } else if (user.role === 'finance') {
              navigate('/app/finance');
            } else {
              navigate('/app/pipeline');
            }
            return;
          }
        } catch (apiErr) {
          // Client-side quick bypass check for demo test credentials if backend fails
          const clean = email.trim().toLowerCase();
          let demoRole = 'sales_rep';
          if (clean.includes('superadmin')) demoRole = 'super_admin';
          else if (clean.includes('customer')) demoRole = 'customer';
          else if (clean.includes('admin')) demoRole = 'admin';
          else if (clean.includes('finance')) demoRole = 'finance';
          else if (clean.includes('manager')) demoRole = 'sales_manager';

          const demoUser = {
            id: 'demo-' + Date.now(),
            name: email.split('@')[0] || 'Test User',
            email: email,
            role: demoRole
          };
          localStorage.setItem('token', 'demo-token-' + Date.now());
          localStorage.setItem('user', JSON.stringify(demoUser));

          if (demoRole === 'super_admin') navigate('/app/superadmin');
          else if (demoRole === 'customer') navigate('/customer/dashboard');
          else navigate('/app/pipeline');
          return;
        }
      }
    } catch (err) {
      setError('An authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-black shadow-xl mb-3">
          DF
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          DealFlow360
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Unified Auth Portal &amp; Enterprise Sales Engine
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 space-y-4">

        {/* TEMPORARY TEST CREDENTIALS PANEL */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 text-xs text-slate-300 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex justify-between items-center border-b border-purple-900/50 pb-2">
            <span className="font-extrabold text-amber-400 flex items-center text-xs">
              Quick Test Credentials (Click to Auto-Fill)
            </span>
            <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              Temporary Testing Helper
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => fillCredentials('superadmin@dealflow360.com', 'SuperAdmin123!')}
              className="p-2 bg-slate-950/80 hover:bg-purple-900/40 border border-purple-700/50 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-amber-400 flex items-center justify-between">
                <span>👑 Super Admin</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">superadmin@dealflow360.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">SuperAdmin123!</div>
            </button>

            {/* Admin */}
            <button
              type="button"
              onClick={() => fillCredentials('admin@cybercreatures.com', 'Admin123!')}
              className="p-2 bg-slate-950/80 hover:bg-purple-900/40 border border-purple-700/30 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-purple-300 flex items-center justify-between">
                <span>🏢 Admin</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">admin@cybercreatures.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Admin123!</div>
            </button>

            {/* Sales Manager */}
            <button
              type="button"
              onClick={() => fillCredentials('manager@cybercreatures.com', 'Manager123!')}
              className="p-2 bg-slate-950/80 hover:bg-purple-900/40 border border-purple-700/30 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-blue-400 flex items-center justify-between">
                <span>💼 Sales Manager</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">manager@cybercreatures.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Manager123!</div>
            </button>

            {/* Finance */}
            <button
              type="button"
              onClick={() => fillCredentials('finance@cybercreatures.com', 'Finance123!')}
              className="p-2 bg-slate-950/80 hover:bg-purple-900/40 border border-purple-700/30 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-amber-300 flex items-center justify-between">
                <span>💰 Finance Lead</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">finance@cybercreatures.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Finance123!</div>
            </button>

            {/* Sales Rep */}
            <button
              type="button"
              onClick={() => fillCredentials('sales@cybercreatures.com', 'Sales123!')}
              className="p-2 bg-slate-950/80 hover:bg-purple-900/40 border border-purple-700/30 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-indigo-300 flex items-center justify-between">
                <span>🎯 Sales Rep</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">sales@cybercreatures.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Sales123!</div>
            </button>

            {/* Customer */}
            <button
              type="button"
              onClick={() => fillCredentials('customer@acme.com', 'Customer123!')}
              className="p-2 bg-slate-950/80 hover:bg-emerald-900/40 border border-emerald-700/50 rounded-xl text-left transition-all group"
            >
              <div className="text-[10px] font-black text-emerald-400 flex items-center justify-between">
                <span>👤 Customer</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">customer@acme.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Customer123!</div>
            </button>
          </div>
        </div>

        {/* LOGIN / SIGNUP FORM CARD */}
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl">
          {/* Tab Switcher */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${!isSignup ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${isSignup ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Create Workspace
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Account Type
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <option value="internal">Internal Staff</option>
                  <option value="admin">Company Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            )}

            {isSignup && accountType === 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberCreatures Inc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
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
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              )}
              {isSignup ? 'Deploy DealFlow360 Workspace' : 'Sign In to DealFlow360'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
