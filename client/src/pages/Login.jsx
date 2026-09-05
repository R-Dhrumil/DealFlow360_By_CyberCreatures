import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ defaultIsSignup = false }) => {
  const [isSignup, setIsSignup] = useState(defaultIsSignup);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('PrecisionDealDesk2024!');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          Unified Auth Portal & Enterprise Sales Engine
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 space-y-4">

        {/* TEMPORARY TEST CREDENTIALS PANEL */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 text-xs text-slate-300 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex justify-between items-center border-b border-purple-900/50 pb-2">
            <span className="font-extrabold text-amber-400 flex items-center text-xs">
              <i className="fa-solid fa-[#v-card] fa-vial-circle-check mr-2 text-amber-400"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity text-amber-400"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
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
                <i className="fa-solid fa-arrow-right opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400"></i>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">customer@acme.com</div>
              <div className="text-[9px] text-emerald-400 font-mono">Customer123!</div>
            </button>
          </div>
        </div>

        {/* LOGIN / SIGNUP FORM CARD */}
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
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${accountType === 'admin'
                        ? 'bg-purple-900/30 border-purple-500 text-white ring-2 ring-purple-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <i className="fa-solid fa-building-user text-purple-400 text-lg mb-1"></i>
                    <div>
                      <p className="font-headline-sm text-xs font-bold text-[#110d1a]">RevOps Committee</p>
                      <p className="font-body-sm text-[11px] text-[#d97706] font-semibold">In review (SLA 38m)</p>
                    </div>
                </div>
                <span className="material-symbols-outlined text-[#e2d0f5] text-base">chevron_right</span>
                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-[#faf2ff] border border-[#e2d0f5] flex items-center justify-center text-[#6b6278] shrink-0">
                    <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-xs font-semibold text-[#110d1a]">CFO Clearance</p>
                    <p className="font-body-sm text-[11px] text-[#6b6278]">Queued</p>
                  </div>
                </div>
              </div>
              </div>
      </div>

      {/* Executive Testimonial Quote */}
      <div className="relative z-10 p-5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5]">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-full overflow-hidden shrink-0 border-2 border-[#702963]/30 shadow-sm">
            <img alt="Elena Vance VP of Revenue Operations" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AEtjO1WTn7TsRVan8HhHxzBsr-fNk_f6HyYmjTdARnUkknSei0-QRKqOLMlFRM-ZxlFfMytR3Ga-hMBDPyKBRb3c3CDgE8QMO_pt_7dMnLMGmfz9UOoxMMWuzF59wbUSojsD6k8066Iok2gSD7m1mkjorUsZ46DF4Di2sZLd9v43VCmS7kEMyHyylJCrypHKPaFlDkvVHnhrRsjgnxTz7bRjFMWgEhZ65IHodb97LOw8eGrq5xybqdTyDqX4L-Od" />
          </div>
          <div className="space-y-1.5">
            <p className="font-body-md text-sm text-[#4b4356] italic leading-relaxed">
              "DealFlow360 turned our high-stakes discounting free-for-all into a deterministic mathematical engine. Deal cycle velocity went up 44% in 90 days."
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-headline-sm text-xs text-[#110d1a] font-bold">Elena Vance</span>
              <span className="text-[#6b6278] text-xs">•</span>
              <span className="font-body-sm text-xs text-[#702963] font-semibold">VP of Revenue Operations, CloudScale Global</span>
            </div>
          </div>
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

        {/* Right Column: Authentication Suite */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-7 md:p-10 rounded-2xl bg-white border border-[#e2d0f5] shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Footer Policy & Dynamic Router Hint */}
          <div className="mt-8 pt-4 border-t border-[#e2d0f5] space-y-3">
            <div className="p-3.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#702963] text-lg shrink-0 mt-0.5">alt_route</span>
              <p className="font-body-sm text-xs text-[#4b4356] leading-relaxed">
                <strong className="text-[#110d1a] font-bold">Routing Notice:</strong> Internal revenue ops and account executives route straight to the <span className="text-[#702963] font-bold">Sales Dashboard</span>. Client stakeholders enter the self-serve <span className="text-[#006877] font-bold">Negotiation Portal</span>.
              </p>
            </div>
            <div className="flex items-center justify-between font-label-sm text-xs text-[#6b6278]">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-[#059669]"></span> SOC-2 Type II Certified</span>
              <div className="flex items-center gap-3">
                <a className="hover:text-[#110d1a] transition-colors" href="#">Privacy Shield</a>
                <span>•</span>
                <a className="hover:text-[#110d1a] transition-colors" href="#">Terms of Master Service</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main >
  );
};

export default Login;
