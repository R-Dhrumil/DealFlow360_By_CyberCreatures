import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ defaultIsSignup = false }) => {
  const [isSignup, setIsSignup] = useState(defaultIsSignup);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('PrecisionDealDesk2024!');
  const navigate = useNavigate();

  const getPasswordStrength = (val) => {
    const len = val.length;
    if (len === 0) return { text: 'Required', color: 'text-[#6b6278]', bars: 0, barColor: 'bg-[#e2d0f5]' };
    if (len < 6) return { text: 'Weak', color: 'text-[#dc2626]', bars: 1, barColor: 'bg-[#dc2626]' };
    if (len < 10) return { text: 'Moderate', color: 'text-[#d97706]', bars: 2, barColor: 'bg-[#d97706]' };
    return { text: 'Enterprise Compliant', color: 'text-[#059669]', bars: 4, barColor: 'bg-[#059669]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/app/dashboard');
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-10 bg-[#f5e8ff] font-body-md text-[#4b4356] antialiased">
      <div className="flex flex-col w-full max-w-7xl">
        <div className="w-full min-h-[760px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Ambient Brand Showcase & Executive Safeguard Preview */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col justify-between p-7 md:p-10 lg:p-12 rounded-2xl bg-white border border-[#e2d0f5] shadow-xl overflow-hidden">
            {/* Soft Ambient Lavender-Purple Radial Glows */}
            <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-[#702963]/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-16 w-96 h-96 rounded-full bg-[#006877]/10 blur-3xl pointer-events-none"></div>
            
            {/* Top Branding & Metric Pill */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img alt="DealFlow360 Logo" className="h-10 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XGyhex6IG8Z50EZiMfwsLtKm6oZPzOaK0T0lbLJVgT1kTZU2Rxvl8Zo-Vz1XU0654dyKKm9zDmdFcoYfDJhsq3_Uu_0gYkln1TOVlETnnPI3sFS6rwQ1pHN7dx8W1_t8hJuVpHtYFBViynoYMc_1cEOz1MYvM6L2SGNPuCDU02laSnPYzChJSivoSlSTXUrEJkRdxUL6NHbKawlUddCXBoRyDO3vGudEUfdMwnTkHPvlt1oVEgrNpk-RAE"/>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#faf2ff] border border-[#e2d0f5] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
                <span className="font-label-sm text-xs text-[#702963] font-semibold tracking-wider uppercase">Live Telemetry</span>
                <span className="font-data-tabular text-xs text-[#110d1a] font-bold pl-1">$42.8M+</span>
                <span className="font-body-sm text-xs text-[#6b6278]">pipeline orchestrated Q3</span>
              </div>
            </div>

            {/* Center Feature: Multi-Tier Approval Safeguard Interactive Preview */}
            <div className="relative z-10 my-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-xs font-semibold text-[#702963] uppercase tracking-widest block mb-1">Architectural CPQ Guardrails</span>
                  <h2 className="font-headline-md text-xl md:text-2xl font-bold text-[#110d1a] tracking-tight">Autonomous Governance &amp; Margin Matrix</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[#702963] text-xl">verified_user</span>
                </div>
              </div>

              {/* Safeguard Mock Card */}
              <div className="p-5 md:p-6 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2d0f5]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-[#dc2626]/10 text-[#dc2626] text-[11px] font-label-sm font-bold tracking-wider border border-[#dc2626]/20">TIER 3 ESCALATION</span>
                    <span className="font-data-tabular text-xs font-medium text-[#6b6278]">Quote #DF-8842-E</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-[#e2d0f5] text-[#059669] font-label-sm text-[11px] font-semibold uppercase flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-xs">tune</span> Auto-Rebalanced
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-lg bg-white border border-[#e2d0f5] shadow-sm">
                    <span className="font-label-sm text-[11px] text-[#6b6278] block uppercase font-semibold">Discount Ceiling</span>
                    <span className="font-data-metric text-2xl font-bold text-[#110d1a] mt-0.5 block">18.5%</span>
                    <span className="font-body-sm text-xs text-[#059669] font-medium flex items-center gap-0.5 mt-1">
                      <span className="material-symbols-outlined text-xs">arrow_downward</span> -3.5% vs list
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white border border-[#e2d0f5] shadow-sm">
                    <span className="font-label-sm text-[11px] text-[#6b6278] block uppercase font-semibold">Net Floor ARR</span>
                    <span className="font-data-metric text-2xl font-bold text-[#110d1a] mt-0.5 block">$248.0K</span>
                    <span className="font-body-sm text-xs text-[#059669] font-medium mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span> Threshold met
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white border border-[#e2d0f5] shadow-sm">
                    <span className="font-label-sm text-[11px] text-[#6b6278] block uppercase font-semibold">Gross Margin</span>
                    <span className="font-data-metric text-2xl font-bold text-[#702963] mt-0.5 block">81.4%</span>
                    <span className="font-body-sm text-xs text-[#702963] font-medium mt-1 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">trending_up</span> +2.1% headroom
                    </span>
                  </div>
                </div>

                {/* Multi-tier workflow nodes */}
                <div className="p-3.5 rounded-lg bg-white border border-[#e2d0f5] flex items-center justify-between text-[#110d1a] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#059669]/15 border border-[#059669]/30 flex items-center justify-center text-[#059669] shrink-0">
                      <span className="material-symbols-outlined text-sm font-bold" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
                    </div>
                    <div>
                      <p className="font-headline-sm text-xs font-bold text-[#110d1a]">Commercial Ops</p>
                      <p className="font-body-sm text-[11px] text-[#059669] font-medium">Validated 14m ago</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#e2d0f5] text-base">chevron_right</span>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center text-[#d97706] shrink-0">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    </div>
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
                  <img alt="Elena Vance VP of Revenue Operations" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida/AEtjO1WTn7TsRVan8HhHxzBsr-fNk_f6HyYmjTdARnUkknSei0-QRKqOLMlFRM-ZxlFfMytR3Ga-hMBDPyKBRb3c3CDgE8QMO_pt_7dMnLMGmfz9UOoxMMWuzF59wbUSojsD6k8066Iok2gSD7m1mkjorUsZ46DF4Di2sZLd9v43VCmS7kEMyHyylJCrypHKPaFlDkvVHnhrRsjgnxTz7bRjFMWgEhZ65IHodb97LOw8eGrq5xybqdTyDqX4L-Od"/>
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
            </div>
          </div>

          {/* Right Column: Authentication Suite */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-7 md:p-10 rounded-2xl bg-white border border-[#e2d0f5] shadow-xl">
            <div>
              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] mb-7">
                <button 
                  className={`flex-1 py-2.5 rounded-lg font-headline-sm text-xs text-center transition-all ${!isSignup ? 'bg-[#702963] text-white font-bold shadow-md hover:bg-[#55104b]' : 'text-[#6b6278] hover:text-[#110d1a] font-semibold'}`}
                  onClick={() => setIsSignup(false)} 
                  type="button"
                >
                  Sign In
                </button>
                <button 
                  className={`flex-1 py-2.5 rounded-lg font-headline-sm text-xs text-center transition-all ${isSignup ? 'bg-[#702963] text-white font-bold shadow-md hover:bg-[#55104b]' : 'text-[#6b6278] hover:text-[#110d1a] font-semibold'}`}
                  onClick={() => setIsSignup(true)} 
                  type="button"
                >
                  Create Workspace
                </button>
              </div>

              {/* Header Titles */}
              <div className="mb-6">
                <span className="font-label-sm text-xs font-bold text-[#702963] uppercase tracking-widest">Command Center Access</span>
                <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-[#110d1a] mt-1.5 tracking-tight">
                  {isSignup ? 'Launch New Workspace' : 'Access Your Terminal'}
                </h1>
                <p className="font-body-md text-sm text-[#6b6278] mt-1">
                  {isSignup ? 'Provision a sovereign enterprise CPQ instance in under 3 minutes.' : 'Sovereign CPQ orchestration and deal structuring suite.'}
                </p>
              </div>

              {/* SSO Rapid Actions */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#faf2ff] hover:bg-[#f5e8ff] border border-[#e2d0f5] transition-all shadow-sm group hover:border-[#702963]/40" type="button">
                  <span className="material-symbols-outlined text-[#006877] group-hover:scale-110 transition-transform">domain</span>
                  <span className="font-label-sm text-xs font-semibold text-[#110d1a]">Okta SSO</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#faf2ff] hover:bg-[#f5e8ff] border border-[#e2d0f5] transition-all shadow-sm group hover:border-[#702963]/40" type="button">
                  <span className="material-symbols-outlined text-[#702963] group-hover:scale-110 transition-transform">mail</span>
                  <span className="font-label-sm text-xs font-semibold text-[#110d1a]">Google IdP</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#faf2ff] hover:bg-[#f5e8ff] border border-[#e2d0f5] transition-all shadow-sm group hover:border-[#702963]/40" type="button">
                  <span className="material-symbols-outlined text-[#006877] group-hover:scale-110 transition-transform">shield</span>
                  <span className="font-label-sm text-xs font-semibold text-[#110d1a]">SAML 2.0</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-6">
                <div className="w-full h-px bg-[#e2d0f5]"></div>
                <span className="absolute px-3 py-0.5 rounded-full bg-white border border-[#e2d0f5] font-label-sm text-[11px] text-[#6b6278] uppercase tracking-wider font-semibold">or business credentials</span>
              </div>

              {/* Primary Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Organization Picker */}
                <div className="space-y-1.5">
                  <label className="block font-label-md text-xs font-semibold text-[#110d1a]">Enterprise Realm</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">corporate_fare</span>
                    <select className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-[#702963] focus:border-transparent appearance-none cursor-pointer">
                      <option>Acme Corp Enterprise (#ORG-0194)</option>
                      <option>Global Logistics EMEA (#ORG-4491)</option>
                      <option>Hyperion Biometrics (#ORG-8921)</option>
                      <option value="custom">+ Create new organization workspace</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-[#6b6278] pointer-events-none text-lg">expand_more</span>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block font-label-md text-xs font-semibold text-[#110d1a]">Work Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">alternate_email</span>
                    <input className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] font-body-md text-sm placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963] focus:border-transparent" placeholder="alex.rivera@acmecorp.com" type="email" required/>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-label-md text-xs font-semibold text-[#110d1a]">Passcode</label>
                    <a className="font-label-sm text-xs font-semibold text-[#702963] hover:text-[#55104b] transition-colors" href="#">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#6b6278] text-lg">lock</span>
                    <input 
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] font-data-tabular text-sm placeholder-[#6b6278]/60 focus:outline-none focus:ring-2 focus:ring-[#702963] focus:border-transparent" 
                      type={showPassword ? "text" : "password"} 
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

                  {/* Dynamic Strength Indicator */}
                  <div className="pt-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-sm text-[11px] font-medium text-[#6b6278]">Entropy Validation</span>
                      <span className={`font-label-sm text-[11px] font-bold ${strength.color}`}>{strength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e2d0f5] rounded-full overflow-hidden flex gap-1 p-0.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-full w-1/4 rounded-full transition-all duration-300 ${i <= strength.bars ? strength.barColor : 'bg-[#e2d0f5]'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-2">
                  <button className="w-full py-3 px-4 rounded-xl bg-[#702963] hover:bg-[#55104b] text-white font-headline-sm text-sm font-bold tracking-wide text-center flex items-center justify-center gap-2 shadow-lg shadow-[#702963]/25 transition-all focus:outline-none focus:ring-2 focus:ring-[#702963] focus:ring-offset-2 active:scale-[0.99]" type="submit">
                    <span>{isSignup ? 'Deploy DealFlow360 Workspace' : 'Sign In to DealFlow360'}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>
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
    </main>
  );
};

export default Login;
