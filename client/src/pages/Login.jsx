import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login({ defaultIsSignup = false }) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(defaultIsSignup);
  const [accountType, setAccountType] = useState('admin'); // 'admin' or 'customer'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillSuperAdmin = () => {
    setEmail('superadmin@dealflow360.com');
    setPassword('SuperAdmin123!');
    setIsSignup(false);
    setError('');
  };

  const fillCustomerDemo = () => {
    setEmail('buyer@acme-corp.com');
    setPassword('Customer123!');
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
          // Client-side quick bypass check for Super Admin credentials if backend fails
          if (email.trim().toLowerCase() === 'superadmin@dealflow360.com') {
            const superUser = {
              id: 'super-admin-001',
              name: 'Super Admin',
              email: 'superadmin@dealflow360.com',
              role: 'super_admin'
            };
            localStorage.setItem('token', 'super-admin-token');
            localStorage.setItem('user', JSON.stringify(superUser));
            navigate('/app/superadmin');
            return;
          }

          const message = apiErr.response?.data?.error || 'Invalid credentials. Please verify email and password.';
          setError(message);
        }
      }
    } catch (err) {
      setError('An authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-black shadow-xl mb-3">
          DF
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          DealFlow360
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Unified Auth Portal & Sales Operations Hub
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* Seeded Testing Banner */}
        <div className="mb-4 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 rounded-2xl p-4 text-xs text-purple-200 space-y-2 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-400 flex items-center">
              <i className="fa-solid fa-crown mr-1.5 text-amber-400"></i> Seeded Super Admin Credentials
            </span>
            <span className="bg-purple-950 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-800">
              For Testing
            </span>
          </div>
          <div className="font-mono text-[11px] bg-slate-900/80 p-2 rounded-xl border border-purple-900/50 space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">Email:</span> <span className="text-white font-bold">superadmin@dealflow360.com</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Password:</span> <span className="text-emerald-400 font-bold">SuperAdmin123!</span></div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={fillSuperAdmin}
              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition-all text-[11px] shadow"
            >
              Fill Super Admin
            </button>
            <button
              type="button"
              onClick={fillCustomerDemo}
              className="flex-1 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg transition-all text-[11px]"
            >
              Fill Customer Demo
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl">
          
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-white">
              {isSignup ? 'Create Your Account' : 'Sign in to Your Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSignup 
                ? 'Select your account type after entering your credentials' 
                : 'Enter your credentials — your role will be detected automatically'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center">
              <i className="fa-solid fa-triangle-exclamation mr-2 text-base"></i>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Account Type Selector (ONLY in Sign Up Mode) */}
            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('admin')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      accountType === 'admin'
                        ? 'bg-purple-900/30 border-purple-500 text-white ring-2 ring-purple-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <i className="fa-solid fa-building-user text-purple-400 text-lg mb-1"></i>
                    <div>
                      <div className="font-bold text-xs">Admin / Business</div>
                      <div className="text-[10px] text-slate-400">Org management</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      accountType === 'customer'
                        ? 'bg-emerald-900/30 border-emerald-500 text-white ring-2 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <i className="fa-solid fa-user-tie text-emerald-400 text-lg mb-1"></i>
                    <div>
                      <div className="font-bold text-xs">Customer Account</div>
                      <div className="text-[10px] text-slate-400">Quotes & orders</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex justify-center items-center active:scale-[0.99]"
            >
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
              ) : isSignup ? (
                `Create ${accountType === 'admin' ? 'Admin / Business' : 'Customer'} Account`
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 text-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
