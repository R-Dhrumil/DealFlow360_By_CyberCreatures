import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Sliders,
  Layers,
  Warehouse,
  Cpu,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Activity,
  Check,
  Scale,
  Building2,
  FileText,
  Clock,
  Globe
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

const LandingPage = () => {
  const { showNotification } = useNotification();
  const [scrolled, setScrolled] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'DealFlow360',
    tagline: 'Enterprise Deal OS',
    logo_url: ''
  });

  // Interactive Live Deal Simulator State
  const [dealDiscount, setDealDiscount] = useState(16);
  const basePrice = 145000;
  const costBasis = 82000;

  const dealSim = useMemo(() => {
    const finalPrice = Math.round(basePrice * (1 - dealDiscount / 100));
    const grossProfit = finalPrice - costBasis;
    const marginPct = Math.round((grossProfit / finalPrice) * 100);
    const discountAmount = basePrice - finalPrice;

    let status = 'SAFE';
    let statusText = 'Auto-Approved by RevOps Engine';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let progressColor = 'bg-emerald-500';

    if (marginPct < 25) {
      status = 'BREACHED';
      statusText = 'Tier-3 Executive Approval Required';
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      progressColor = 'bg-rose-500';
    } else if (marginPct < 35) {
      status = 'WARNING';
      statusText = 'Sales VP Sign-Off Triggered';
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      progressColor = 'bg-amber-500';
    }

    return {
      finalPrice,
      grossProfit,
      marginPct,
      discountAmount,
      status,
      statusText,
      badgeClass,
      progressColor
    };
  }, [dealDiscount]);

  // Interactive Approval State
  const [approvals, setApprovals] = useState({
    revops: true,
    finance: true,
    legal: false
  });

  // Interactive ROI Calculator State
  const [quotesPerMonth, setQuotesPerMonth] = useState(85);
  const [avgDealValue, setAvgDealValue] = useState(65000);

  const roiCalc = useMemo(() => {
    const hoursSaved = Math.round(quotesPerMonth * 4.8);
    const marginRecovered = Math.round(quotesPerMonth * avgDealValue * 12 * 0.036);
    const cycleReductionDays = 11.4;
    return {
      hoursSaved,
      marginRecovered,
      cycleReductionDays
    };
  }, [quotesPerMonth, avgDealValue]);

  // Interactive 4-Stage Lifecycle State
  const [activeStage, setActiveStage] = useState(0);

  // Section Refs for smooth navigation
  const simulatorRef = useRef(null);
  const capabilitiesRef = useRef(null);
  const lifecycleRef = useRef(null);
  const roiRef = useRef(null);
  const comparisonRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    api.get('/settings/public')
      .then(res => {
        if (res.data) setSiteSettings(prev => ({ ...prev, ...res.data }));
      })
      .catch(() => { });

    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getLogoSrc = () => {
    if (!siteSettings.logo_url) return null;
    if (siteSettings.logo_url.startsWith('http')) return siteSettings.logo_url;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:5001${siteSettings.logo_url}`;
  };

  const logoSrc = getLogoSrc();

  const handleSimulateFastApproval = () => {
    setApprovals({ revops: true, finance: true, legal: true });
    showNotification('success', 'Parallel matrix cleared! Deal routed instantly to Order Split & Fulfillment.');
  };

  const lifecycleStages = [
    {
      id: 'cpq',
      num: '01',
      title: 'Algorithmic CPQ',
      subtitle: 'Dynamic Pricing & Margin Guardrails',
      desc: 'Sales reps configure multi-line complex proposals with automated discount ceilings that protect gross margin before quotes are sent.',
      badge: 'Margin-Safe Engine',
      metrics: ['Sub-second recalculation', 'Live multi-currency FX', 'Zero spreadsheet errors']
    },
    {
      id: 'matrix',
      num: '02',
      title: 'Parallel Matrix',
      subtitle: 'Multi-Department Concurrent Governance',
      desc: 'Eliminate serial approval bottlenecks. Concurrent routing dispatches review tokens to Legal, RevOps, and Finance simultaneously.',
      badge: 'Zero Serial Delay',
      metrics: ['4.2h average velocity', 'Automated SLA escalation', 'Cryptographic audit trail']
    },
    {
      id: 'split',
      num: '03',
      title: 'Split-Warehouse',
      subtitle: 'Intelligent Inventory Routing & Dispatch',
      desc: 'Automatically decompose single quotes into multi-warehouse fulfillment runs with partial shipping and backorder tracking.',
      badge: 'Smart Logistics',
      metrics: ['Multi-depot stock routing', 'Backorder split logic', 'Carrier manifest integration']
    },
    {
      id: 'asc606',
      num: '04',
      title: 'ASC 606 Engine',
      subtitle: 'Consolidated Billing & Revenue Recognition',
      desc: 'Automatic revenue waterfall schedules, milestone billing, and seamless payment reconciliation through simulated card and QR gateways.',
      badge: 'Compliance Ready',
      metrics: ['ASC 606 / IFRS 15 rules', 'Milestone invoicing', 'Real-time ledger postings']
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#fbf9fe] text-[#110d1a] font-sans antialiased selection:bg-[#702963] selection:text-white relative overflow-x-hidden">

      {/* ─── Ambient Glow Optics (Executive Soft Luminous Meshes) ─── */}
      <div className="fixed top-[-12%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-[#702963]/10 via-[#e2d0f5]/25 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[28%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-bl from-[#006877]/10 via-[#e0f4f7]/30 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-[#702963]/10 via-transparent to-transparent rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Subtle Dot Grid */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none opacity-40 -z-10" />

      {/* ─── Sticky Glass Executive Navbar ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-[#e2d0f5]/70 shadow-sm shadow-[#702963]/5 py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            {logoSrc ? (
              <img src={logoSrc} alt={siteSettings.site_name} className="w-9 h-9 rounded-xl object-contain shadow-sm ring-1 ring-black/5" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#702963] to-[#55104b] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#702963]/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-extrabold text-[#110d1a] text-base tracking-tight group-hover:text-[#702963] transition-colors flex items-center gap-1.5">
                {siteSettings.site_name}
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#702963]/10 border border-[#702963]/20 text-[#702963]">
                  Enterprise
                </span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-7 px-5 py-1.5 rounded-full bg-white/70 border border-[#e2d0f5] shadow-xs backdrop-blur-md">
            <button
              onClick={() => scrollTo(simulatorRef)}
              className="text-xs font-semibold text-[#6b6278] hover:text-[#702963] transition-colors cursor-pointer"
            >
              Live Cockpit
            </button>
            <button
              onClick={() => scrollTo(capabilitiesRef)}
              className="text-xs font-semibold text-[#6b6278] hover:text-[#702963] transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollTo(lifecycleRef)}
              className="text-xs font-semibold text-[#6b6278] hover:text-[#702963] transition-colors cursor-pointer"
            >
              Deal Journey
            </button>
            <button
              onClick={() => scrollTo(roiRef)}
              className="text-xs font-semibold text-[#6b6278] hover:text-[#702963] transition-colors cursor-pointer"
            >
              ROI Engine
            </button>
            <button
              onClick={() => scrollTo(comparisonRef)}
              className="text-xs font-semibold text-[#6b6278] hover:text-[#702963] transition-colors cursor-pointer"
            >
              Why DealFlow360
            </button>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3">
            <Link
              to="/marketplace"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#702963] hover:text-[#55104b] px-3 py-2 rounded-lg hover:bg-[#702963]/5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#006877]" />
              B2B Catalog
            </Link>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#110d1a] hover:text-[#702963] px-3.5 py-2 rounded-lg border border-[#e2d0f5] hover:border-[#702963]/30 bg-white shadow-xs transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-[#702963] to-[#8d377d] hover:from-[#55104b] hover:to-[#702963] shadow-md shadow-[#702963]/25 hover:shadow-[#702963]/40 transition-all active:scale-[0.98]"
            >
              <span>Test Drive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section: The Enterprise Deal Operating System ─── */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Eyebrow Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-[#e2d0f5] shadow-xs text-xs font-medium text-[#702963]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">Autonomous Deal Execution</span>
            <span className="text-[#d4c1cc]">•</span>
            <span className="text-[#006877] font-mono text-[11px] font-bold">Quote-to-Cash 2.0</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[#110d1a]">
            Transform Raw Quotes Into{' '}
            <span className="bg-gradient-to-r from-[#702963] via-[#8d377d] to-[#006877] bg-clip-text text-transparent">
              Protected Revenue.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-[#4b4356] max-w-3xl mx-auto leading-relaxed font-normal">
            Unify algorithmic CPQ, parallel multi-department approvals, multi-warehouse fulfillment, and ASC 606 revenue recognition into one frictionless, high-velocity enterprise fabric.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => scrollTo(simulatorRef)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#702963] via-[#853276] to-[#006877] text-white font-bold text-base shadow-xl shadow-[#702963]/25 hover:shadow-[#702963]/35 hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <span>Launch Live Deal Cockpit</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white hover:bg-[#faf2ff] text-[#110d1a] font-semibold text-base border border-[#e2d0f5] shadow-sm hover:border-[#702963]/30 transition-all group"
            >
              <Globe className="w-4 h-4 text-[#006877]" />
              <span>Explore B2B Catalog</span>
              <ArrowUpRight className="w-4 h-4 text-[#6b6278] group-hover:text-[#702963] transition-colors" />
            </Link>
          </div>

          {/* Enterprise Real-World Telemetry Ticker */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-[#e2d0f5] max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white border border-[#e2d0f5] shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#110d1a] font-mono">4.2h</div>
              <div className="text-xs text-[#6b6278] mt-1 flex items-center justify-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Avg Quote Velocity
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2d0f5] shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">+$2.4M</div>
              <div className="text-xs text-[#6b6278] mt-1 flex items-center justify-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Margin Preserved
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2d0f5] shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#702963] font-mono">99.94%</div>
              <div className="text-xs text-[#6b6278] mt-1 flex items-center justify-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006877]" />
                ASC 606 Accuracy
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2d0f5] shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#110d1a] font-mono">0 sec</div>
              <div className="text-xs text-[#6b6278] mt-1 flex items-center justify-center gap-1 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Parallel Serial Delay
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Hero Visual: The Live Deal Execution Cockpit ─── */}
      <section ref={simulatorRef} className="py-12 px-6 max-w-6xl mx-auto scroll-mt-24">
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-[#e2d0f5] via-[#faf2ff] to-[#e2d0f5] shadow-xl shadow-[#702963]/10">
          <div className="rounded-[22px] bg-white p-6 sm:p-10 border border-[#e2d0f5] relative overflow-hidden">

            {/* Ambient inner soft glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#702963]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#006877]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header of Cockpit */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#e2d0f5]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#702963]/10 border border-[#702963]/25 text-[#702963]">
                    INTERACTIVE DEMO
                  </span>
                  <span className="text-xs text-emerald-700 flex items-center gap-1 font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Q2C Engine Connected
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#110d1a] tracking-tight">
                  Deal Margin Cockpit &amp; Guardrail Visualizer
                </h2>
                <p className="text-sm text-[#6b6278]">
                  Adjust the commercial discount slider below to witness real-time AI margin protection, SLA matrix routing, and multi-warehouse allocations.
                </p>
              </div>

              {/* Status Indicator Chip */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 shadow-xs ${dealSim.badgeClass}`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{dealSim.status}: {dealSim.statusText}</span>
                </div>
              </div>
            </div>

            {/* Cockpit Grid Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">

              {/* Left Column: Interactive Controls & Financial Breakdown (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">

                {/* Discount Slider Control */}
                <div className="p-6 rounded-2xl bg-[#faf2ff] border border-[#e2d0f5] space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="discount-slider" className="text-sm font-semibold text-[#110d1a] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#702963]" />
                      Contract Discount Level
                    </label>
                    <span className="text-xl font-bold font-mono text-[#702963] bg-white px-3 py-1 rounded-lg border border-[#e2d0f5] shadow-xs">
                      {dealDiscount}%
                    </span>
                  </div>

                  <input
                    id="discount-slider"
                    type="range"
                    min="0"
                    max="45"
                    step="1"
                    value={dealDiscount}
                    onChange={(e) => setDealDiscount(Number(e.target.value))}
                    className="w-full h-2.5 bg-[#e2d0f5] rounded-lg appearance-none cursor-pointer accent-[#702963]"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-[#6b6278] font-medium">
                    <span className="text-emerald-700">0% (Safe Ceiling)</span>
                    <span className="text-amber-700">20% (VP Escalation)</span>
                    <span className="text-rose-700">35%+ (Board Level Block)</span>
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white border border-[#e2d0f5] shadow-xs">
                    <div className="text-[11px] font-semibold text-[#6b6278] uppercase tracking-wider">Contract Total</div>
                    <div className="text-lg sm:text-xl font-bold text-[#110d1a] font-mono mt-1">
                      ${dealSim.finalPrice.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-rose-600 font-mono mt-0.5 font-medium">
                      -${dealSim.discountAmount.toLocaleString()} disc
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e2d0f5] shadow-xs">
                    <div className="text-[11px] font-semibold text-[#6b6278] uppercase tracking-wider">Gross Profit</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono mt-1">
                      ${dealSim.grossProfit.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6b6278] font-mono mt-0.5">
                      cost: ${costBasis.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#e2d0f5] shadow-xs">
                    <div className="text-[11px] font-semibold text-[#6b6278] uppercase tracking-wider">Gross Margin</div>
                    <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${dealSim.marginPct >= 35 ? 'text-emerald-700' : dealSim.marginPct >= 25 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                      {dealSim.marginPct}%
                    </div>
                    <div className="w-full bg-[#f0e4fa] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${dealSim.progressColor} transition-all duration-300`}
                        style={{ width: `${Math.min(100, dealSim.marginPct * 2)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Warehouse Dispatch Routing Visualizer */}
                <div className="p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#110d1a]">
                    <span className="flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4 text-[#006877]" />
                      Split-Warehouse Allocation Preview
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 font-bold">100% Stock Allocated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5]">
                      <div className="text-[#6b6278] text-[10px]">US-East Hub</div>
                      <div className="text-[#110d1a] font-bold">540 Units</div>
                      <div className="text-emerald-700 text-[10px] font-semibold">Dispatch Ready</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5]">
                      <div className="text-[#6b6278] text-[10px]">EU-Central Hub</div>
                      <div className="text-[#110d1a] font-bold">320 Units</div>
                      <div className="text-emerald-700 text-[10px] font-semibold">Dispatch Ready</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5]">
                      <div className="text-[#6b6278] text-[10px]">APAC Depot</div>
                      <div className="text-[#110d1a] font-bold">140 Units</div>
                      <div className="text-amber-700 text-[10px] font-semibold">Backorder Split</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Parallel Approval Matrix Live Node (5 Cols) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#faf2ff] border border-[#e2d0f5] shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#110d1a] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#702963]" />
                    Parallel Approval Matrix
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#e2d0f5] text-[#702963] font-bold">
                    SLA: Active
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* RevOps Node */}
                  <div className="p-3 rounded-xl bg-white border border-[#e2d0f5] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-[#110d1a] font-bold">RevOps Desk</div>
                        <div className="text-[10px] text-[#6b6278]">Pricing &amp; Margin Model</div>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-bold">0.4s (Auto)</span>
                  </div>

                  {/* Finance Node */}
                  <div className="p-3 rounded-xl bg-white border border-[#e2d0f5] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${dealSim.marginPct < 25 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {dealSim.marginPct < 25 ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-[#110d1a] font-bold">Finance &amp; Credit</div>
                        <div className="text-[10px] text-[#6b6278]">ASC 606 &amp; Net-30 Terms</div>
                      </div>
                    </div>
                    <span className={dealSim.marginPct < 25 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {dealSim.marginPct < 25 ? 'Blocked (<25%)' : 'Approved'}
                    </span>
                  </div>

                  {/* Legal Node */}
                  <div className="p-3 rounded-xl bg-white border border-[#e2d0f5] flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${approvals.legal ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {approvals.legal ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-[#110d1a] font-bold">Legal Counsel</div>
                        <div className="text-[10px] text-[#6b6278]">Indemnity &amp; SLA Terms</div>
                      </div>
                    </div>
                    <span className={approvals.legal ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {approvals.legal ? 'Signed' : 'In Review (01m 45s)'}
                    </span>
                  </div>
                </div>

                {/* Simulate Approval Action */}
                <div className="pt-2">
                  <button
                    onClick={handleSimulateFastApproval}
                    className="w-full py-3 rounded-xl bg-white hover:bg-[#faf2ff] text-[#702963] font-bold text-xs border border-[#702963]/30 hover:border-[#702963] shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    Simulate 1-Click Parallel Sign-Off
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── Social Proof & Enterprise Customers ─── */}
      <section className="py-16 px-6 border-y border-[#e2d0f5] bg-white">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6b6278] font-bold">
            Powering Quote-to-Cash For High-Velocity B2B Enterprises
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 text-[#110d1a] font-bold text-lg font-mono">
              <Building2 className="w-5 h-5 text-[#702963]" /> VORTEX LOGISTICS
            </div>
            <div className="flex items-center gap-2 text-[#110d1a] font-bold text-lg font-mono">
              <Cpu className="w-5 h-5 text-[#006877]" /> HYPERION CLOUD
            </div>
            <div className="flex items-center gap-2 text-[#110d1a] font-bold text-lg font-mono">
              <Layers className="w-5 h-5 text-amber-700" /> STRATA INDUSTRIAL
            </div>
            <div className="flex items-center gap-2 text-[#110d1a] font-bold text-lg font-mono">
              <Warehouse className="w-5 h-5 text-emerald-700" /> NEXUS COMMERCE
            </div>
            <div className="flex items-center gap-2 text-[#110d1a] font-bold text-lg font-mono">
              <Globe className="w-5 h-5 text-[#702963]" /> AXIOM GLOBAL
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid: 5 Pillars of DealFlow360 ─── */}
      <section ref={capabilitiesRef} className="py-24 px-6 max-w-7xl mx-auto scroll-mt-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#702963]/10 border border-[#702963]/25 text-[#702963]">
            CORE ARCHITECTURAL PILLARS
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#110d1a] tracking-tight">
            Engineered For Scale, Margin &amp; Velocity
          </h2>
          <p className="text-base text-[#4b4356]">
            Traditional ERPs fail at deal velocity. Traditional CPQs stop at quotes. DealFlow360 connects every stakeholder on one reactive data substrate.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Bento Card 1: AI Margin Guardrails (Col Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md hover:border-[#702963]/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#702963]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#702963]/10 border border-[#702963]/20 flex items-center justify-center text-[#702963]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#110d1a] tracking-tight">
                Algorithmic CPQ &amp; AI Margin Guardrails
              </h3>
              <p className="text-sm text-[#4b4356] max-w-xl leading-relaxed">
                Protect bottom-line profitability before quotes are dispatched. Our rule engine calculates real-time margin thresholds, flags unauthorized discount slippage, and locks deal integrity automatically.
              </p>
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                  ✓ Dynamic Margin Formulas
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] font-semibold">
                  ✓ Tiered Volume Pricing
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#e0f4f7] border border-[#b2e4ec] text-[#006877] font-semibold">
                  ✓ Multi-Currency FX Conversion
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Parallel Multi-Department Matrix (Col Span 1) */}
          <div className="p-8 rounded-3xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md hover:border-[#006877]/40 transition-all group relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#006877]/10 border border-[#006877]/20 flex items-center justify-center text-[#006877]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#110d1a] tracking-tight">
                Parallel Matrix Approvals
              </h3>
              <p className="text-sm text-[#4b4356] leading-relaxed">
                Zero serial bottlenecks. Dispatches review tokens to Legal, RevOps, and Finance concurrently with automated SLA countdowns and threshold escalations.
              </p>
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] font-mono text-xs text-[#6b6278]">
                  Velocity: <span className="text-emerald-700 font-bold">4.2h</span> vs 14 days legacy
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Split-Order & Multi-Warehouse (Col Span 1) */}
          <div className="p-8 rounded-3xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md hover:border-amber-400/40 transition-all group relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#110d1a] tracking-tight">
                Split-Order Fulfillment
              </h3>
              <p className="text-sm text-[#4b4356] leading-relaxed">
                Seamlessly split a signed enterprise contract across multiple regional warehouses, manage partial stock dispatches, and track backorders in one view.
              </p>
              <div className="pt-2 text-xs font-mono text-emerald-700 font-bold">
                ✓ Multi-Depot Allocation
              </div>
            </div>
          </div>

          {/* Bento Card 4: ASC 606 & Revenue Recognition (Col Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md hover:border-[#702963]/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#006877]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#110d1a] tracking-tight">
                Consolidated Billing &amp; ASC 606 Recognition
              </h3>
              <p className="text-sm text-[#4b4356] max-w-xl leading-relaxed">
                Automated revenue waterfall recognition schedules compliant with ASC 606 &amp; IFRS 15. Supports milestone billings, deposit invoices, and simulated multi-gateway payments with QR codes.
              </p>
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#110d1a] font-semibold">
                  ✓ Milestone Waterfall Schedules
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                  ✓ Automated Ledger Journal Entries
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#e0f4f7] border border-[#b2e4ec] text-[#006877] font-semibold">
                  ✓ Multi-Currency Payment Simulation
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── Interactive 4-Stage Deal Lifecycle Engine ─── */}
      <section ref={lifecycleRef} className="py-24 px-6 border-t border-[#e2d0f5] bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#006877]/10 border border-[#006877]/25 text-[#006877]">
              THE COMPLETE DEAL LIFECYCLE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#110d1a] tracking-tight">
              One Unified Transaction Fabric
            </h2>
            <p className="text-base text-[#4b4356]">
              Select a stage below to inspect how data seamlessly transitions without duplicate entry or spreadsheet handoffs.
            </p>
          </div>

          {/* Stage Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lifecycleStages.map((stage, idx) => (
              <button
                key={stage.id}
                onClick={() => setActiveStage(idx)}
                className={`p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer border relative ${activeStage === idx
                    ? 'bg-[#faf2ff] border-[#702963] shadow-md shadow-[#702963]/10 scale-[1.02]'
                    : 'bg-white border-[#e2d0f5] hover:border-[#702963]/30 hover:bg-[#fbf9fe]'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#702963]">STAGE {stage.num}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#e2d0f5] text-[#4b4356] font-semibold">
                    {stage.badge}
                  </span>
                </div>
                <div className="text-lg font-bold text-[#110d1a] mt-3">{stage.title}</div>
                <div className="text-xs text-[#6b6278] mt-1">{stage.subtitle}</div>
                {activeStage === idx && (
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[#702963]" />
                )}
              </button>
            ))}
          </div>

          {/* Active Stage Deep Inspection Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-[#faf2ff] border border-[#e2d0f5] shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#e2d0f5] text-xs font-mono text-[#702963] font-bold shadow-xs">
                  <span>Active Inspection: Stage {lifecycleStages[activeStage].num}</span>
                </div>
                <h3 className="text-3xl font-extrabold text-[#110d1a]">
                  {lifecycleStages[activeStage].title}
                </h3>
                <p className="text-base text-[#4b4356] leading-relaxed">
                  {lifecycleStages[activeStage].desc}
                </p>
                <div className="space-y-3 pt-2">
                  {lifecycleStages[activeStage].metrics.map((metric, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#110d1a] font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Visual Artifact Mockup */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-[#e2d0f5] shadow-md space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2d0f5]">
                  <span className="text-[#6b6278] font-bold">TRANSACTION PAYLOAD // DEEP-FLOW-OS</span>
                  <span className="text-emerald-700 font-bold">STATE: VERIFIED</span>
                </div>

                {activeStage === 0 && (
                  <div className="space-y-2 text-[#4b4356]">
                    <div className="text-[#110d1a] font-bold">&gt; INITIATE_CPQ_CONFIGURATION</div>
                    <div className="p-3 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] space-y-1">
                      <div>Product: Enterprise Cloud Cluster v4</div>
                      <div>Quantity: 24 Nodes | Term: 36 Months</div>
                      <div>Base List: $240,000 USD</div>
                      <div className="text-emerald-700 font-bold">Calculated Discount: 14.5% (Within RevOps Guardrail)</div>
                      <div className="text-[#110d1a] font-bold">Approved Margin: 44.8% (Target: &gt;35%)</div>
                    </div>
                  </div>
                )}

                {activeStage === 1 && (
                  <div className="space-y-2 text-[#4b4356]">
                    <div className="text-[#110d1a] font-bold">&gt; PARALLEL_ROUTING_MATRIX_DISPATCH</div>
                    <div className="p-3 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] space-y-1">
                      <div>Token [RevOps]: CLEARED in 0.4s (Automated Rule #412)</div>
                      <div>Token [Finance]: CLEARED in 12s (Credit Score A+)</div>
                      <div>Token [Legal]: CLEARED in 3m 12s (Standard Mutual SLA)</div>
                      <div className="text-emerald-700 font-bold">Matrix Status: 3/3 Approvals Achieved | Escrow Lock Released</div>
                    </div>
                  </div>
                )}

                {activeStage === 2 && (
                  <div className="space-y-2 text-[#4b4356]">
                    <div className="text-[#110d1a] font-bold">&gt; MULTI_WAREHOUSE_ORCHESTRATION</div>
                    <div className="p-3 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] space-y-1">
                      <div>Depot US-East: 12 Units allocated (Carrier: FedEx Freight)</div>
                      <div>Depot EU-Central: 8 Units allocated (Carrier: DHL Express)</div>
                      <div>Depot APAC: 4 Units allocated (Local Courier)</div>
                      <div className="text-emerald-700 font-bold">Split Dispatch ID: #DSP-9042-SPLIT // Tracking Synced</div>
                    </div>
                  </div>
                )}

                {activeStage === 3 && (
                  <div className="space-y-2 text-[#4b4356]">
                    <div className="text-[#110d1a] font-bold">&gt; ASC_606_RECOGNITION_POSTING</div>
                    <div className="p-3 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] space-y-1">
                      <div>Performance Obligation 1 (Hardware): $140,000 Recognizable upon delivery</div>
                      <div>Performance Obligation 2 (SaaS Support): $100,000 Ratable over 36m</div>
                      <div>Journal Entry #JE-891 posted to General Ledger</div>
                      <div className="text-emerald-700 font-bold">Compliance Status: Fully Audited (ASC 606 &amp; IFRS 15)</div>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-[#6b6278] flex items-center justify-between border-t border-[#e2d0f5]">
                  <span>Cryptographic Hash: 0x9f4a...e12b</span>
                  <span className="text-emerald-700 font-bold">Synced to Client Portal</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── Interactive ROI & Velocity Calculator ─── */}
      <section ref={roiRef} className="py-24 px-6 max-w-5xl mx-auto scroll-mt-24 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            BUSINESS IMPACT MODEL
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#110d1a] tracking-tight">
            Calculate Your Deal Velocity ROI
          </h2>
          <p className="text-base text-[#4b4356]">
            Discover the tangible revenue saved and operational hours eliminated by deploying DealFlow360 across your revenue operations.
          </p>
        </div>

        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#e2d0f5] shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Sliders (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Quotes Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold text-[#110d1a]">
                  <label htmlFor="monthly-quotes-slider" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#702963]" />
                    Monthly Enterprise Quotes Generated
                  </label>
                  <span className="font-mono text-base font-bold text-[#702963] bg-[#faf2ff] border border-[#e2d0f5] px-3 py-1 rounded-lg">
                    {quotesPerMonth} quotes
                  </span>
                </div>
                <input
                  id="monthly-quotes-slider"
                  type="range"
                  min="15"
                  max="300"
                  step="5"
                  value={quotesPerMonth}
                  onChange={(e) => setQuotesPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-[#e2d0f5] rounded-lg appearance-none cursor-pointer accent-[#702963]"
                />
              </div>

              {/* Deal Size Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold text-[#110d1a]">
                  <label htmlFor="avg-deal-size-slider" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Average Deal Size (ACV)
                  </label>
                  <span className="font-mono text-base font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                    ${avgDealValue.toLocaleString()}
                  </span>
                </div>
                <input
                  id="avg-deal-size-slider"
                  type="range"
                  min="10000"
                  max="250000"
                  step="5000"
                  value={avgDealValue}
                  onChange={(e) => setAvgDealValue(Number(e.target.value))}
                  className="w-full h-2 bg-[#e2d0f5] rounded-lg appearance-none cursor-pointer accent-[#006877]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] text-xs text-[#6b6278] leading-relaxed">
                * Based on benchmark metrics across 120+ B2B enterprises replacing legacy serial CPQ &amp; manual quote routing spreadsheets with DealFlow360.
              </div>
            </div>

            {/* Results Display (5 Cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-[#faf2ff] via-white to-[#e0f4f7] border border-[#e2d0f5] shadow-md space-y-6">

              <div>
                <div className="text-xs font-mono text-[#702963] font-bold uppercase">Annual Margin Leakage Recovered</div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#110d1a] font-mono mt-1">
                  +${roiCalc.marginRecovered.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-700 font-mono mt-1 font-bold">
                  Protected from rogue discount slippage
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2d0f5]">
                <div className="text-xs font-mono text-[#702963] font-bold uppercase">Rep &amp; RevOps Hours Saved / Year</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#110d1a] font-mono mt-1">
                  {(roiCalc.hoursSaved * 12).toLocaleString()} hrs
                </div>
                <div className="text-[11px] text-[#6b6278] font-mono mt-1">
                  Zero manual approval status pinging
                </div>
              </div>

              <div className="pt-4 border-t border-[#e2d0f5]">
                <div className="text-xs font-mono text-[#006877] font-bold uppercase">Quote Velocity Acceleration</div>
                <div className="text-xl font-bold text-amber-700 font-mono mt-1">
                  {roiCalc.cycleReductionDays} Days Shaved Off Cycle
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── Enterprise Benchmark: Legacy vs DealFlow360 ─── */}
      <section ref={comparisonRef} className="py-24 px-6 max-w-6xl mx-auto scroll-mt-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#702963]/10 border border-[#702963]/25 text-[#702963]">
            ENTERPRISE BENCHMARK
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#110d1a] tracking-tight">
            Why Modern RevOps Choose DealFlow360
          </h2>
          <p className="text-base text-[#4b4356]">
            Stop patching together bloated CPQ plugins and ERP spreadsheets. See how DealFlow360 fundamentally re-architects quote-to-cash.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#e2d0f5] shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2d0f5] bg-[#faf2ff]">
                <th className="py-4 px-6 text-xs font-mono uppercase tracking-wider text-[#6b6278]">Capability</th>
                <th className="py-4 px-6 text-xs font-mono uppercase tracking-wider text-rose-700">Legacy CPQ &amp; Spreadsheets</th>
                <th className="py-4 px-6 text-xs font-mono uppercase tracking-wider text-[#702963] font-bold bg-[#702963]/10">DealFlow360 Enterprise OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d0f5] font-sans text-sm">
              <tr className="hover:bg-[#faf2ff]/50">
                <td className="py-4 px-6 font-bold text-[#110d1a]">Approval Architecture</td>
                <td className="py-4 px-6 text-[#6b6278]">Serial waterfall (one manager blocks the entire chain)</td>
                <td className="py-4 px-6 text-[#702963] font-bold bg-[#702963]/5">Concurrent Parallel Matrix with SLA auto-escalation</td>
              </tr>
              <tr className="hover:bg-[#faf2ff]/50">
                <td className="py-4 px-6 font-bold text-[#110d1a]">Discount &amp; Margin Controls</td>
                <td className="py-4 px-6 text-[#6b6278]">Post-facto manual auditing after discount was granted</td>
                <td className="py-4 px-6 text-[#702963] font-bold bg-[#702963]/5">Pre-dispatch Algorithmic Margin Guardrails</td>
              </tr>
              <tr className="hover:bg-[#faf2ff]/50">
                <td className="py-4 px-6 font-bold text-[#110d1a]">Warehouse Logistics</td>
                <td className="py-4 px-6 text-[#6b6278]">Disconnected WMS sync, duplicate manual order entry</td>
                <td className="py-4 px-6 text-[#702963] font-bold bg-[#702963]/5">Native Split-Order Routing &amp; Backorder Management</td>
              </tr>
              <tr className="hover:bg-[#faf2ff]/50">
                <td className="py-4 px-6 font-bold text-[#110d1a]">Revenue Recognition</td>
                <td className="py-4 px-6 text-[#6b6278]">Month-end manual Excel reconcile, high compliance risk</td>
                <td className="py-4 px-6 text-[#702963] font-bold bg-[#702963]/5">Instant ASC 606 &amp; IFRS 15 Waterfall Schedules</td>
              </tr>
              <tr className="hover:bg-[#faf2ff]/50">
                <td className="py-4 px-6 font-bold text-[#110d1a]">Client Experience</td>
                <td className="py-4 px-6 text-[#6b6278]">Static PDF attachment via email, slow manual signatures</td>
                <td className="py-4 px-6 text-[#702963] font-bold bg-[#702963]/5">Interactive Customer Portal, Digital Sign-off &amp; QR Pay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Executive Testimonials & Trust ─── */}
      <section className="py-24 px-6 border-t border-[#e2d0f5] bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
              TRUSTED BY REVENUE LEADERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#110d1a] tracking-tight">
              What Sales &amp; Finance VPs Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-[#faf2ff] border border-[#e2d0f5] shadow-xs space-y-4">
              <div className="flex text-amber-500 gap-1 text-sm">
                ★★★★★
              </div>
              <p className="text-sm text-[#4b4356] italic leading-relaxed">
                "Our average enterprise approval cycle collapsed from 12 days to under 4 hours. The parallel matrix completely removed RevOps as a bottleneck."
              </p>
              <div className="pt-2 border-t border-[#e2d0f5]">
                <div className="text-[#110d1a] font-bold text-sm">Sarah Jenkins</div>
                <div className="text-xs text-[#6b6278]">VP of Revenue Operations, CloudScale</div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#faf2ff] border border-[#e2d0f5] shadow-xs space-y-4">
              <div className="flex text-amber-500 gap-1 text-sm">
                ★★★★★
              </div>
              <p className="text-sm text-[#4b4356] italic leading-relaxed">
                "The AI margin guardrail recovered over $1.8M in profit this year alone. Sales reps can't give away margin without automated escalation."
              </p>
              <div className="pt-2 border-t border-[#e2d0f5]">
                <div className="text-[#110d1a] font-bold text-sm">Marcus Vance</div>
                <div className="text-xs text-[#6b6278]">Chief Financial Officer, Strata Logistics</div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#faf2ff] border border-[#e2d0f5] shadow-xs space-y-4">
              <div className="flex text-amber-500 gap-1 text-sm">
                ★★★★★
              </div>
              <p className="text-sm text-[#4b4356] italic leading-relaxed">
                "Split-warehouse fulfillment combined with the real-time client portal gave our enterprise buyers the consumer-grade experience they demanded."
              </p>
              <div className="pt-2 border-t border-[#e2d0f5]">
                <div className="text-[#110d1a] font-bold text-sm">Elena Rostova</div>
                <div className="text-xs text-[#6b6278]">Global VP of Commercial Sales, Apex Health</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final High-Conversion CTA Banner ─── */}
      <section ref={ctaRef} className="py-24 px-6 max-w-6xl mx-auto scroll-mt-24">
        <div className="relative rounded-3xl p-1 bg-gradient-to-r from-[#702963] via-[#853276] to-[#006877] shadow-xl shadow-[#702963]/20">
          <div className="rounded-[22px] bg-gradient-to-br from-[#55104b] via-[#702963] to-[#45123d] p-8 sm:p-16 text-center space-y-8 relative overflow-hidden text-white">

            {/* Ambient inner lights */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#006877]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white">
                RAPID 14-DAY PILOT
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Modernize Your Entire Deal Lifecycle Today
              </h2>
              <p className="text-base text-white/80 leading-relaxed">
                Deploy across your revenue team in under 14 days. Plug into existing systems with zero downtime and instant margin protection.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#702963] font-bold text-base shadow-xl hover:bg-[#faf2ff] hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <span>Start 14-Day Free Pilot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/marketplace"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/25 transition-all"
                >
                  <Globe className="w-4 h-4 text-emerald-300" />
                  <span>Browse B2B Marketplace</span>
                  <ArrowUpRight className="w-4 h-4 text-white/70" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-white/80 font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  SOC-2 Type II Certified
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ASC 606 Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  99.99% SLA Uptime
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Executive Footer ─── */}
      <footer className="py-12 px-6 border-t border-[#e2d0f5] bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt={siteSettings.site_name} className="w-7 h-7 rounded-lg object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#702963] flex items-center justify-center text-white font-bold text-xs">
                DF
              </div>
            )}
            <span className="text-sm font-bold text-[#110d1a]">{siteSettings.site_name}</span>
            <span className="text-xs text-[#6b6278] font-mono pl-2">Enterprise Deal OS</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#6b6278]">
            <Link to="/marketplace" className="hover:text-[#702963] transition-colors">B2B Marketplace</Link>
            <Link to="/login" className="hover:text-[#702963] transition-colors">Internal Login</Link>
            <Link to="/signup" className="hover:text-[#702963] transition-colors">Register</Link>
            <span className="text-[#d4c1cc]">•</span>
            <span className="text-emerald-700 flex items-center gap-1 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
          </div>

          <p className="text-xs text-[#6b6278]">
            © {new Date().getFullYear()} {siteSettings.site_name}. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
