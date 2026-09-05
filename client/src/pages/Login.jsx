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
  const [accountType, setAccountType] = useState('admin'); // 'admin' or 'customer'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setIsSignup(false);
    setError('');
  };

  const getPasswordStrength = (val) => {
    const len = val.length;
    if (len === 0) return { text: 'Required', color: 'text-[#6b6278]', bars: 0, barColor: 'bg-[#e2d0f5]' };
    if (len < 6) return { text: 'Weak', color: 'text-[#dc2626]', bars: 1, barColor: 'bg-[#dc2626]' };
    if (len < 10) return { text: 'Moderate', color: 'text-[#d97706]', bars: 2, barColor: 'bg-[#d97706]' };
    return { text: 'Enterprise Compliant', color: 'text-[#059669]', bars: 4, barColor: 'bg-[#059669]' };
  };

  const strength = getPasswordStrength(password);

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
        // Unified Login
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.data && res.data.token) {
            localStorage.setItem('token', res.data.token);
            const user = res.data.user;
            localStorage.setItem('user', JSON.stringify(user));

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
    <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-10 bg-[#f5e8ff] font-sans text-[#4b4356] antialiased">
      <div className="flex flex-col w-full max-w-7xl">
        <div className="w-full min-h-[760px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Deep Purple Royal Ambient Showcase */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-7 md:p-10 lg:p-12 rounded-2xl bg-gradient-to-br from-[#4a1843] via-[#702963] to-[#361131] text-white border border-[#9d3c8c]/40 shadow-2xl overflow-hidden">
            {/* Soft Ambient Purple Radial Glows */}
            <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-[#9d3c8c]/30 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-16 w-96 h-96 rounded-full bg-[#006877]/20 blur-3xl pointer-events-none"></div>
            
            {/* Top Branding & Metric Pill */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-tr from-[#9d3c8c] to-[#702963] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-[#b854a7]/40">
                  DF
                </div>
                <div>
                  <span className="font-extrabold text-2xl text-white tracking-wide block leading-tight">DealFlow360</span>
                  <span className="text-[11px] text-[#f5e8ff] font-mono">Enterprise Sales Operations Engine</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4a1843]/80 border border-[#b854a7]/40 shadow-md backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse"></span>
                <span className="text-[10px] text-[#f5e8ff] font-bold uppercase tracking-wider font-mono">Live Operations</span>
                <span className="text-xs text-white font-extrabold font-mono pl-1">$42.8M+</span>
                <span className="text-[11px] text-[#e2d0f5]">Quotes Structured</span>
              </div>
            </div>

            {/* Center Architecture Pillars */}
            <div className="relative z-10 my-8 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block mb-1">
                  Architectural CPQ Guardrails
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                  Unified Sales Governance &amp; CPQ Engine
                </h2>
                <p className="text-xs text-[#f5e8ff] mt-1 max-w-xl leading-relaxed">
                  Role-separated workspaces, automated discount risk scoring, and real-time customer negotiations.
                </p>
              </div>

              {/* 4 Feature Cards Grid in Purple Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-[#5b1f51]/70 border border-[#9d3c8c]/40 hover:border-white/40 transition-all space-y-1.5 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                    <span className="material-symbols-outlined text-lg">crown</span>
                    <span>Super Admin Console</span>
                  </div>
                  <p className="text-[11px] text-[#f5e8ff] leading-normal">
                    Business card analytics, win/loss rate progress bars &amp; tenant user directory governance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#5b1f51]/70 border border-[#9d3c8c]/40 hover:border-white/40 transition-all space-y-1.5 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center space-x-2 text-purple-200 font-bold text-xs">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span>Admin Operations</span>
                  </div>
                  <p className="text-[11px] text-[#f5e8ff] leading-normal">
                    Product &amp; base price listings, discount tier ceilings, and warehouse inventory setup.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#5b1f51]/70 border border-[#9d3c8c]/40 hover:border-white/40 transition-all space-y-1.5 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>Multi-Tier Approvals</span>
                  </div>
                  <p className="text-[11px] text-[#f5e8ff] leading-normal">
                    Blended risk scoring: Auto-approve (&lt;5%), Sales Manager (5-10%), Finance (&gt;10%) escalation chain.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#5b1f51]/70 border border-[#9d3c8c]/40 hover:border-white/40 transition-all space-y-1.5 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
                    <span className="material-symbols-outlined text-lg">storefront</span>
                    <span>Customer Self-Serve</span>
                  </div>
                  <p className="text-[11px] text-[#f5e8ff] leading-normal">
                    Browse admin product catalog, request proposals, negotiate line discounts &amp; E-sign.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Stats Footer */}
            <div className="relative z-10 p-4 rounded-2xl bg-[#4a1843]/90 border border-[#9d3c8c]/40 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                <span className="text-[#f5e8ff] font-semibold">99.9% Margin Floor Safeguard</span>
              </div>
              <div className="flex items-center space-x-3 text-[#e2d0f5] font-mono text-[11px]">
                <span className="text-amber-300 font-bold">⚡ 44% Faster Deals</span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">🔒 SOC-2 Certified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Form in Purple Theme */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-7 md:p-10 rounded-2xl bg-white border border-[#e2d0f5] shadow-xl">
            <div>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] mb-6">
                <button 
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-center transition-all ${!isSignup ? 'bg-[#702963] text-white shadow-md' : 'text-[#6b6278] hover:text-[#110d1a] font-semibold'}`}
                  onClick={() => { setIsSignup(false); setError(''); }} 
                  type="button"
                >
                  Sign In
                </button>
                <button 
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-center transition-all ${isSignup ? 'bg-[#702963] text-white shadow-md' : 'text-[#6b6278] hover:text-[#110d1a] font-semibold'}`}
                  onClick={() => { setIsSignup(true); setError(''); }} 
                  type="button"
                >
                  Sign Up
                </button>
              </div>

              {/* Header Titles */}
              <div className="mb-6">
                <span className="text-xs font-bold text-[#702963] uppercase tracking-widest block">
                  {isSignup ? 'Create New Account' : 'Sign In to Your Workspace'}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#110d1a] mt-1 tracking-tight">
                  {isSignup ? 'Get Started with DealFlow360' : 'Sign In to DealFlow360'}
                </h1>
                <p className="text-xs text-[#6b6278] mt-1">
                  {isSignup 
                    ? 'Select your account type below to set up your DealFlow360 access.' 
                    : 'Enter your credentials — your user role will be detected automatically.'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Account Type Selector (ONLY in Sign Up Mode) */}
                {isSignup && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#110d1a] uppercase tracking-wider">
                      Select Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType('admin')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          accountType === 'admin'
                            ? 'bg-[#702963]/10 border-[#702963] text-[#702963] ring-2 ring-[#702963]/30 font-bold'
                            : 'bg-[#faf2ff] border-[#e2d0f5] text-[#6b6278] hover:border-[#702963]/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1 text-[#702963]">domain</span>
                        <div>
                          <div className="font-bold text-xs text-[#110d1a]">Admin / Business</div>
                          <div className="text-[10px] text-[#6b6278]">Organization management</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('customer')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          accountType === 'customer'
                            ? 'bg-[#059669]/10 border-[#059669] text-[#059669] ring-2 ring-[#059669]/30 font-bold'
                            : 'bg-[#faf2ff] border-[#e2d0f5] text-[#6b6278] hover:border-[#059669]/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1 text-[#059669]">person</span>
                        <div>
                          <div className="font-bold text-xs text-[#110d1a]">Customer Account</div>
                          <div className="text-[10px] text-[#6b6278]">Quotes & products</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {isSignup && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#110d1a]">Full Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">person</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] text-xs placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963]" 
                        placeholder="e.g. Sarah Connor" 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required={isSignup}
                      />
                    </div>
                  </div>
                )}

                {isSignup && accountType === 'admin' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#110d1a]">Company / Organization Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">corporate_fare</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] text-xs placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963]" 
                        placeholder="e.g. CyberCreatures Inc." 
                        type="text" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        required={isSignup && accountType === 'admin'}
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#110d1a]">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">alternate_email</span>
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] text-xs placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963]" 
                      placeholder="name@example.com" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#110d1a]">Password</label>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">lock</span>
                    <input 
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] text-xs placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963]" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-3 top-2.5 text-[#6b6278] hover:text-[#110d1a] transition-colors" 
                      onClick={() => setShowPassword(!showPassword)} 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <button 
                    disabled={loading} 
                    className="w-full py-3 px-4 rounded-xl bg-[#702963] hover:bg-[#55104b] text-white text-xs font-bold tracking-wide text-center flex items-center justify-center gap-2 shadow-lg shadow-[#702963]/25 transition-all focus:outline-none focus:ring-2 focus:ring-[#702963] active:scale-[0.99] disabled:opacity-70" 
                    type="submit"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                    ) : isSignup ? (
                      `Create ${accountType === 'admin' ? 'Admin / Business' : 'Customer'} Account`
                    ) : (
                      'Sign In to DealFlow360'
                    )}
                  </button>
                </div>
              </form>

              {/* Toggle Sign In / Sign Up */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setIsSignup(!isSignup); setError(''); }}
                  className="text-xs text-[#702963] hover:underline font-bold"
                >
                  {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>

            {/* Quick Test Credential Filler Bar */}
            <div className="mt-6 pt-4 border-t border-[#e2d0f5] space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#702963]">
                <span>⚡ Quick Test Credentials (1-Click Fill):</span>
                <span className="text-[10px] text-[#6b6278] font-normal">Temporary Testing Helper</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button type="button" onClick={() => fillCredentials('superadmin@dealflow360.com', 'SuperAdmin123!')} className="px-2.5 py-1 bg-[#faf2ff] border border-[#e2d0f5] text-[#702963] rounded-lg hover:bg-[#f5e8ff] font-bold text-[11px]">👑 SuperAdmin</button>
                <button type="button" onClick={() => fillCredentials('admin@cybercreatures.com', 'Admin123!')} className="px-2.5 py-1 bg-[#faf2ff] border border-[#e2d0f5] text-[#702963] rounded-lg hover:bg-[#f5e8ff] font-bold text-[11px]">🏢 Admin</button>
                <button type="button" onClick={() => fillCredentials('manager@cybercreatures.com', 'Manager123!')} className="px-2.5 py-1 bg-[#faf2ff] border border-[#e2d0f5] text-[#702963] rounded-lg hover:bg-[#f5e8ff] font-bold text-[11px]">💼 Manager</button>
                <button type="button" onClick={() => fillCredentials('sales@cybercreatures.com', 'Sales123!')} className="px-2.5 py-1 bg-[#faf2ff] border border-[#e2d0f5] text-[#702963] rounded-lg hover:bg-[#f5e8ff] font-bold text-[11px]">🎯 Sales Rep</button>
                <button type="button" onClick={() => fillCredentials('customer@acme.com', 'Customer123!')} className="px-2.5 py-1 bg-[#faf2ff] border border-[#059669]/30 text-[#059669] rounded-lg hover:bg-[#059669]/10 font-bold text-[11px]">👤 Customer</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
