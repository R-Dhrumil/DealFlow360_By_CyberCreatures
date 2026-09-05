import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

const LandingPage = () => {
  const { showNotification } = useNotification();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [siteSettings, setSiteSettings] = useState({ site_name: 'DealFlow360', tagline: '', logo_url: '' });
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    // Fetch global settings for logo
    api.get('/settings/public')
      .then(res => {
        if (res.data) setSiteSettings(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => {});

    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const steps = [
    { num: '01', title: 'Configure', desc: 'Build quotes with AI-powered margin guardrails', icon: 'tune' },
    { num: '02', title: 'Route', desc: 'Parallel multi-department approval matrix', icon: 'account_tree' },
    { num: '03', title: 'Fulfill', desc: 'Multi-warehouse stock split & dispatch', icon: 'local_shipping' },
    { num: '04', title: 'Recognize', desc: 'Consolidated billing & revenue recognition', icon: 'account_balance' },
  ];

  const features = [
    {
      icon: 'shield',
      title: 'AI Margin Guardrails',
      desc: 'Algorithmic discount ceilings evaluate blended value, win-rates, and cost spikes before any quote leaves the desk.',
    },
    {
      icon: 'mediation',
      title: 'Parallel Approval Matrix',
      desc: 'Multi-tier approvals route concurrently across Legal, RevOps, and Engineering — no more serial bottlenecks.',
    },
    {
      icon: 'conversion_path',
      title: 'Quote-to-Cash Pipeline',
      desc: 'From quotation to fulfillment to ASC 606 recognition, every deal stage lives on one unified transaction fabric.',
    },
  ];

  // Derive the logo URL — handle both absolute URLs and relative paths (uploads)
  const getLogoSrc = () => {
    if (!siteSettings.logo_url) return null;
    if (siteSettings.logo_url.startsWith('http')) return siteSettings.logo_url;
    // Relative path — resolve against the API server
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:5001${siteSettings.logo_url}`;
  };

  const logoSrc = getLogoSrc();

  return (
    <div className="min-h-screen w-full bg-border-soft text-text-main font-sans antialiased overflow-x-hidden">

      {/* ─── Sticky Navigation ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-surface-soft'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoSrc ? (
              <img src={logoSrc} alt={siteSettings.site_name} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
                DF
              </div>
            )}
            <span className="font-bold text-text-main text-base tracking-tight">{siteSettings.site_name}</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-text-muted hover:text-primary transition-colors font-medium cursor-pointer">Features</button>
            <button onClick={() => scrollTo(howRef)} className="text-sm text-text-muted hover:text-primary transition-colors font-medium cursor-pointer">How it Works</button>
            <button onClick={() => scrollTo(ctaRef)} className="text-sm text-text-muted hover:text-primary transition-colors font-medium cursor-pointer">Get Started</button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-text-muted hover:text-primary transition-colors font-medium hidden sm:block">
              Sign in
            </Link>
            <Link to="/signup" className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold shadow-sm hover:bg-primary-dark transition-all active:scale-[0.98] cursor-pointer">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Ambient gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 -right-40 w-[450px] h-[450px] rounded-full bg-primary/12 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-secondary/8 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-surface-soft shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-status animate-pulse"></span>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Enterprise Deal OS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-main tracking-tight leading-[1.1]">
            From Quote to Cash,{' '}
            <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Zero Friction
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-text-body max-w-2xl mx-auto leading-relaxed">
            Unify CPQ, approvals, fulfillment, and revenue recognition on one intelligent deal engine built for modern sales teams.
          </p>

          {/* Primary CTA */}
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-on-primary font-bold text-base shadow-lg hover:bg-primary-dark hover:shadow-xl transition-all active:scale-[0.98] group cursor-pointer"
            >
              <span>Start Free Trial</span>
              <span className="material-symbols-outlined text-on-primary transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>

          {/* Floating Metrics Strip */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-text-main">4.8h</div>
              <div className="text-xs text-text-muted font-medium mt-1">Avg Deal Velocity</div>
            </div>
            <div className="w-px h-10 bg-surface-soft hidden sm:block"></div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-text-main">99.4%</div>
              <div className="text-xs text-text-muted font-medium mt-1">Billing Accuracy</div>
            </div>
            <div className="w-px h-10 bg-surface-soft hidden sm:block"></div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-status">+$1.4M</div>
              <div className="text-xs text-text-muted font-medium mt-1">Margin Preserved</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Strip ─── */}
      <section className="py-12 px-6 border-y border-surface-soft bg-white/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Trusted by teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-40">
            {/* Simple abstract SVG logos */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-main">
              <rect x="4" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.7"/>
              <rect x="22" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.4"/>
              <rect x="4" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.4"/>
              <rect x="22" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.7"/>
            </svg>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-main">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" opacity="0.6"/>
              <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.7"/>
            </svg>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-main">
              <polygon points="20,4 36,36 4,36" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
              <circle cx="20" cy="24" r="4" fill="currentColor" opacity="0.5"/>
            </svg>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-main">
              <path d="M20 4 L36 14 L36 28 L20 38 L4 28 L4 14 Z" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
            </svg>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-text-main">
              <rect x="6" y="10" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.6"/>
              <line x1="6" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
              <circle cx="14" cy="26" r="3" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section ref={featuresRef} className="py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
              Everything your deal desk needs
            </h2>
            <p className="text-text-body text-base leading-relaxed">
              Legacy CPQs stop at quotes. ERPs fail at deal velocity. DealFlow360 unites both worlds.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                  <span className="material-symbols-outlined text-xl">{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-text-main">{f.title}</h3>
                <p className="text-sm text-text-body leading-relaxed flex-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section ref={howRef} className="py-24 px-6 bg-white border-y border-surface-soft scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">
              Four steps. One seamless pipeline.
            </h2>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`relative text-left p-6 rounded-2xl transition-all duration-300 cursor-pointer group ${
                  activeStep === i
                    ? 'bg-primary text-on-primary shadow-lg scale-[1.02]'
                    : 'bg-border-soft border border-surface-soft hover:border-primary/30 hover:bg-white'
                }`}
              >
                {/* Step number */}
                <span className={`text-xs font-bold tracking-widest uppercase ${
                  activeStep === i ? 'text-on-primary/60' : 'text-text-muted'
                }`}>
                  Step {step.num}
                </span>

                {/* Icon */}
                <div className={`mt-4 w-10 h-10 rounded-lg flex items-center justify-center ${
                  activeStep === i
                    ? 'bg-on-primary/20 text-on-primary'
                    : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-lg">{step.icon}</span>
                </div>

                {/* Content */}
                <h3 className={`mt-4 text-lg font-bold ${
                  activeStep === i ? 'text-on-primary' : 'text-text-main'
                }`}>
                  {step.title}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${
                  activeStep === i ? 'text-on-primary/80' : 'text-text-muted'
                }`}>
                  {step.desc}
                </p>

                {/* Active indicator */}
                {activeStep === i && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-primary ring-4 ring-white"></div>
                )}
              </button>
            ))}
          </div>

          {/* Connector line (desktop only) */}
          <div className="hidden lg:block relative -mt-12 mx-auto max-w-3xl">
            <div className="h-0.5 bg-surface-soft w-full"></div>
            <div className="h-0.5 bg-primary transition-all duration-500" style={{ width: `${((activeStep + 1) / 4) * 100}%` }}></div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ─── */}
      <section ref={ctaRef} className="py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-primary p-10 sm:p-16 shadow-xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-primary-dark/40 blur-2xl pointer-events-none"></div>
            <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-on-primary/5 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              <span className="text-xs font-bold text-on-primary/70 uppercase tracking-widest">Zero Friction Deployment</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-primary tracking-tight leading-tight">
                Ready to modernize your deal lifecycle?
              </h2>
              <p className="text-on-primary/80 text-base sm:text-lg leading-relaxed">
                Deploy across your revenue operations team in under 14 days. Plug directly into your existing CRM and ERP.
              </p>

              {/* Email form */}
              <form
                className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-4"
                onSubmit={(e) => { e.preventDefault(); showNotification('success', 'Demo environment credentials dispatched to your enterprise inbox.'); }}
              >
                <input
                  className="w-full sm:flex-1 px-4 py-3 rounded-lg bg-white text-text-main placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-on-primary/30 shadow-sm"
                  placeholder="Enter work email..."
                  required
                  type="email"
                />
                <button
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary-dark text-on-primary font-semibold text-sm hover:bg-text-main transition-all whitespace-nowrap shadow-md cursor-pointer"
                  type="submit"
                >
                  Get Started
                </button>
              </form>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-4 text-xs text-on-primary/70 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span>
                  14-day pilot
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span>
                  Pre-built connectors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span>
                  SOC-2 certified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-6 border-t border-surface-soft bg-white/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {logoSrc ? (
              <img src={logoSrc} alt={siteSettings.site_name} className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-on-primary font-bold text-[10px]">
                DF
              </div>
            )}
            <span className="text-sm font-semibold text-text-main">{siteSettings.site_name}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link to="/login" className="hover:text-primary transition-colors cursor-pointer">Sign in</Link>
            <Link to="/marketplace" className="hover:text-primary transition-colors cursor-pointer">Marketplace</Link>
            <a href="mailto:support@dealflow360.com" className="hover:text-primary transition-colors cursor-pointer">Contact</a>
          </div>
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} {siteSettings.site_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
