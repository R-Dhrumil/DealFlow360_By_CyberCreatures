import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [discount, setDiscount] = useState(14);
  const [workflowStep, setWorkflowStep] = useState(0);

  // Dynamic simulated margin calculation
  const baseMargin = 78.5;
  const computedMargin = (baseMargin - (discount * 0.72)).toFixed(1);

  const getFinanceGateStyles = () => {
    if (discount >= 20) {
      return {
        bg: 'bg-red-50 border border-[#fecaca]',
        statusBg: 'bg-red-100 border border-[#fecaca] text-[#b91c1c]',
        icon: 'warning',
        text: 'VP REVOPS ESCALATION',
      };
    } else if (discount >= 10) {
      return {
        bg: 'bg-white border border-surface-soft',
        statusBg: 'bg-red-50 border border-[#fecaca] text-[#b91c1c]',
        icon: 'pending',
        text: 'REQUIRED',
      };
    } else {
      return {
        bg: 'bg-white border border-surface-soft',
        statusBg: 'bg-emerald-50 border border-[#bbf7d0] text-[#15803d]',
        icon: 'check_circle',
        text: 'AUTO-BYPASS',
      };
    }
  };

  const financeGate = getFinanceGateStyles();

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start bg-border-soft py-10 px-4 sm:px-6 lg:px-8 font-body-md text-text-main antialiased">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Orbs behind Hero */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
          <div className="absolute top-48 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl pointer-events-none"></div>
          
          {/* Hero Section */}
          <div className="relative flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-surface-soft text-primary text-label-sm font-label-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="tracking-wider uppercase font-bold text-primary">Enterprise Deal OS 4.0</span>
              <span className="text-text-muted/40">/</span>
              <span className="text-text-body font-semibold">SOC-2 Type II Certified</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-headline-xl font-headline-xl text-text-main tracking-tight max-w-3xl">
              Orchestrate Every Deal from <span className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark bg-clip-text text-transparent font-extrabold">Quote to Cash</span> in Real-Time
            </h1>
            
            {/* Subheadline */}
            <p className="text-body-lg font-body-lg text-text-body max-w-2xl text-balance">
              Unify AI-driven CPQ margin limits, matrix approvals, multi-node warehouse fulfillment, and subscription ASC 606 revenue recognition on one single sovereign deal engine.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/login" className="px-7 py-3.5 rounded-lg bg-primary text-white font-headline-sm text-headline-sm shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2 group cursor-pointer">
                <span>Start Free Trial</span>
                <span className="material-symbols-outlined text-white transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
              <button className="px-6 py-3.5 rounded-lg bg-white border border-surface-soft text-primary font-headline-sm text-headline-sm shadow-sm hover:bg-border-soft hover:border-primary/30 transition-all flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-border-soft flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                </span>
                <span>Watch 2-Min Interactive Demo</span>
              </button>
            </div>
            
            {/* Enterprise Client Badges */}
            <div className="pt-10 w-full flex flex-col items-center space-y-4">
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-widest font-semibold">Trusted by Global Deal Desks &amp; RevOps Teams</span>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-85">
                <div className="flex items-center gap-2 text-text-body font-headline-md text-headline-md tracking-wider">
                  <span className="material-symbols-outlined text-primary">diamond</span>
                  <span className="font-headline-md font-bold text-text-main">ACME CORP</span>
                </div>
                <div className="flex items-center gap-2 text-text-body font-headline-md text-headline-md tracking-wider">
                  <span className="material-symbols-outlined text-primary">token</span>
                  <span className="font-headline-md font-bold text-text-main">NOVA RETAIL</span>
                </div>
                <div className="flex items-center gap-2 text-text-body font-headline-md text-headline-md tracking-wider">
                  <span className="material-symbols-outlined text-primary">polyline</span>
                  <span className="font-headline-md font-bold text-text-main">ZENITH</span>
                </div>
                <div className="flex items-center gap-2 text-text-body font-headline-md text-headline-md tracking-wider">
                  <span className="material-symbols-outlined text-primary">hub</span>
                  <span className="font-headline-md font-bold text-text-main">ORION TECH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Interactive CPQ & Margin Calculator Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-xl bg-white border border-surface-soft p-5 sm:p-7 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 bg-border-soft border border-surface-soft px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#15803d]"></span>
                <span className="text-headline-sm font-headline-sm text-text-main">Deal #OR-8921 // CloudCore Global Rollout</span>
                <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-label-sm text-label-sm uppercase tracking-wide font-bold">Dynamic Simulation</span>
              </div>
              <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-body">
                <span className="material-symbols-outlined text-base text-[#15803d]">verified</span>
                <span className="font-bold text-text-main">Target Contract ACV: $428,500</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Deal Parameters */}
              <div className="space-y-4 bg-border-soft border border-surface-soft p-4 rounded-lg">
                <span className="text-label-md font-label-md text-text-muted uppercase tracking-wider block font-bold">1. Deal Composition &amp; Discounting</span>
                <div className="space-y-2">
                  <div className="flex justify-between text-body-sm font-body-sm text-text-body">
                    <span>Platform Tier Seats (500 Enterprise)</span>
                    <span className="font-data-tabular text-data-tabular text-text-main font-bold">$180,000</span>
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-text-body">
                    <span>Edge Rack Hardware (8 Units)</span>
                    <span className="font-data-tabular text-data-tabular text-text-main font-bold">$164,000</span>
                  </div>
                  <div className="flex justify-between text-body-sm font-body-sm text-text-body">
                    <span>24/7 Mission-Critical SLA</span>
                    <span className="font-data-tabular text-data-tabular text-text-main font-bold">$84,500</span>
                  </div>
                </div>
                <div className="pt-2 space-y-2 border-t border-surface-soft">
                  <div className="flex justify-between text-body-sm font-body-sm">
                    <span className="text-text-body font-medium">Contract Discount Override</span>
                    <span className="text-primary font-data-tabular text-data-tabular font-bold">{discount}%</span>
                  </div>
                  <input 
                    className="w-full accent-primary cursor-pointer h-2 bg-purple-200 rounded-lg appearance-none" 
                    max="35" min="0" type="range" 
                    value={discount} 
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-body-sm font-body-sm text-text-muted">
                    <span>0% (Standard)</span>
                    <span className="text-[#b91c1c] font-semibold">25%+ (VP RevOps Flag)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Margin & Gate Visualizer */}
              <div className="space-y-4 bg-border-soft border border-surface-soft p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-label-md font-label-md text-text-muted uppercase tracking-wider block font-bold">2. Blended Margin Health</span>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-headline-md font-headline-md text-text-main">Gross Margin</span>
                    <span className="text-data-metric font-data-metric text-[#15803d]">{computedMargin}%</span>
                  </div>
                  {/* Dynamic Progress Bar */}
                  <div className="w-full bg-surface-soft h-3 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-primary to-[#15803d] transition-all duration-300" style={{ width: `${computedMargin}%` }}></div>
                  </div>
                </div>
                {/* Calculated Leakage & Protection */}
                <div className="p-3 bg-white border border-[#bbf7d0] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#15803d]">security</span>
                    <span className="text-body-sm font-body-sm text-text-main font-medium">Margin Floor Protected</span>
                  </div>
                  <span className="text-data-tabular font-data-tabular text-[#15803d] font-bold">+$24,180 Preserved</span>
                </div>
              </div>

              {/* Route Status Matrix */}
              <div className="space-y-4 bg-border-soft border border-surface-soft p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-label-md font-label-md text-text-muted uppercase tracking-wider block font-bold">3. Autonomous Route Evaluation</span>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-surface-soft text-body-sm font-body-sm">
                      <span className="text-text-main font-medium">Software Auto-Sign</span>
                      <span className="flex items-center gap-1 text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-[#bbf7d0] text-label-sm font-label-sm font-bold">
                        <span className="material-symbols-outlined text-xs">check_circle</span> PASSED
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded text-body-sm font-body-sm ${financeGate.bg}`}>
                      <span className="text-text-main font-medium">Finance Tier 2 Approval</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm font-bold ${financeGate.statusBg}`}>
                        <span className="material-symbols-outlined text-xs">{financeGate.icon}</span> {financeGate.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-surface-soft text-body-sm font-body-sm">
                      <span className="text-text-main font-medium">Stock Availability Check</span>
                      <span className="flex items-center gap-1 text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-[#bbf7d0] text-label-sm font-label-sm font-bold">
                        <span className="material-symbols-outlined text-xs">warehouse</span> ALLOCATED (US-EAST)
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded bg-white border border-primary text-primary text-label-md font-label-md hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-bold shadow-sm">
                  <span className="material-symbols-outlined text-sm text-[#c2410c]">bolt</span>
                  <span>Simulate Route Execution</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-World Enterprise Proof Imagery & Metrics Strip */}
        <div className="w-full bg-border-soft py-12 px-4 sm:px-6 lg:px-8 mt-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-xl bg-white border border-surface-soft shadow-sm">
              <div className="flex justify-center mb-2">
                <span className="material-symbols-outlined text-primary text-headline-lg font-headline-lg">timer</span>
              </div>
              <div className="text-data-metric font-data-metric text-text-main">4.8h</div>
              <div className="text-headline-sm font-headline-sm text-primary mt-1">Average Deal Velocity</div>
              <p className="text-body-sm font-body-sm text-text-body mt-2">Down from 12 business days. Complex matrix authorizations route concurrently in parallel queues.</p>
            </div>
            <div className="p-6 rounded-xl bg-white border border-surface-soft shadow-sm">
              <div className="flex justify-center mb-2">
                <span className="material-symbols-outlined text-[#15803d] text-headline-lg font-headline-lg">receipt_long</span>
              </div>
              <div className="text-data-metric font-data-metric text-text-main">99.4%</div>
              <div className="text-headline-sm font-headline-sm text-[#15803d] mt-1">Billing &amp; Ledger Accuracy</div>
              <p className="text-body-sm font-body-sm text-text-body mt-2">Zero unbilled hardware shipments and automatic proration across multi-year SaaS milestones.</p>
            </div>
            <div className="p-6 rounded-xl bg-white border border-surface-soft shadow-sm">
              <div className="flex justify-center mb-2">
                <span className="material-symbols-outlined text-[#15803d] text-headline-lg font-headline-lg">savings</span>
              </div>
              <div className="text-data-metric font-data-metric text-[#15803d]">+$1.4M</div>
              <div className="text-headline-sm font-headline-sm text-primary mt-1">Preserved Margin Leakage</div>
              <p className="text-body-sm font-body-sm text-text-body mt-2">AI discount guardrails instantly stop unvetted contract concessions prior to e-signature submission.</p>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars / Value Proposition Bento Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-label-sm font-label-sm uppercase tracking-widest text-primary font-bold">Full Stack Deal Infrastructure</span>
            <h2 className="text-headline-lg font-headline-lg text-text-main">Engineered for Complex Products, Tangible Assets, and Global Recurring Rev</h2>
            <p className="text-body-md font-body-md text-text-body">Legacy CPQs stop at quotes. Modern ERPs fail at deal velocity. DealFlow360 unites both worlds into a single executable transaction fabric.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-xl bg-white border border-surface-soft p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-border-soft border border-surface-soft flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-headline-md font-headline-md">tune</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-text-main">1. Dynamic CPQ &amp; AI Margin Optimization</h3>
                <p className="text-body-md font-body-md text-text-body leading-relaxed">
                  Algorithmic discount ceiling guardrails evaluate blended customer lifetime value, historical win rates, and raw material cost spikes before quoting. Stop leaving money on the negotiating table.
                </p>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Contextual discount floors tied to ARR commitment length</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Predictive bill-of-materials cost recalculation at checkout</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-lg overflow-hidden h-44 w-full border border-surface-soft">
                <img alt="Dashboard visual" className="w-full h-full object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgX7Iv5zk1kGCdO4WOxAszjb_rupCCyEKg2YGPCnj6X4rqz_R1SC6-zPG0geqGIKY_EADFEBnGmpoot8GyVZ2O0w3zYcPvpFvjD4ucxEX7FFiKWjviQA9y3jx7zHnYtK4Xwq8ILNvBCp-DaVIPqG-x9lga45PstndJpunJ01mWdhQu9_BIhZ0YLUGUsN76vW92Nh-XWi3viZswvSptndmyFMqtbXtiZTZhOlqyJYie2anVJ550eikgww"/>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl bg-white border border-surface-soft p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-border-soft border border-surface-soft flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-headline-md font-headline-md">account_tree</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-text-main">2. Blended Risk Matrix Approvals</h3>
                <p className="text-body-md font-body-md text-text-body leading-relaxed">
                  Eliminate cross-departmental bottlenecks. Multi-tier approval matrices instantly parse deals containing mixed elements (recurring software licenses, physical equipment, and custom professional services).
                </p>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Parallel reviews across Legal, RevOps, and Solutions Engineering</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>One-click Slack and Microsoft Teams mobile signing webhooks</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-lg overflow-hidden h-44 w-full border border-surface-soft">
                <img alt="Node workflow graph" className="w-full h-full object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBYd7EETUzYsZ8PHdQIsnRXc7hCDpEddVjZ-HI3MZj1Ic4XoLydLVe7gq6lEZagXGyvFR-zSdROdXgTGvY4a2-q7n5mdQcCxFca5Td9ZePCvym2jYl7uQe34b_onSFHzow8hfijns8UrhYBoXZYrux8xIp_pmjfa4PkO_UIBQa-Qj5fcy8J0_f9TUiLGSnaBrH2VZIenbFcvlwUgvcO6UjzN0EtXaedzsyFMyIoZC8Ea9WAENmlCofVQ"/>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl bg-white border border-surface-soft p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-border-soft border border-surface-soft flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-headline-md font-headline-md">forklift</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-text-main">3. Distributed Inventory &amp; Smart Fulfillment</h3>
                <p className="text-body-md font-body-md text-text-body leading-relaxed">
                  Bridge digital software licenses with real-world supply chain commitments. DealFlow360 splits hardware lines, reserves warehouse stock, and dispatches split shipments without pausing the quote flow.
                </p>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Multi-warehouse automated allocation based on customer geo-proximity</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Automated backorder holds and partial delivery notifications</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-lg overflow-hidden h-44 w-full border border-surface-soft">
                <img alt="Logistics map" className="w-full h-full object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK4NJOHXu90ND0ybRgb-rbd05SVbqazFmcBp9s9Hp8Yy9Tu7_nugm0b4Al_SWcHS3yX50cBRWLJ-wB055MoeglyhOHEaub3EsnOqLpqgOPoJaJgL0GWYFK_taaH0rr1kinDkHcFRaxWRWKb2PCiugYn_dpTt7VhfW6cvt3WVuSH69D3bDvqaH84qtmDIw8NgNWNSG5RcHULAPFPU8EPUqPjNytQO2YglaCbLdPsRGU4nmgy76AGuN_Fg"/>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-xl bg-white border border-surface-soft p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-border-soft border border-surface-soft flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-headline-md font-headline-md">account_balance_wallet</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-text-main">4. Unified Billing &amp; ASC 606 Recognition</h3>
                <p className="text-body-md font-body-md text-text-body leading-relaxed">
                  Consolidate ongoing subscriptions with one-off milestone billing and partial shipment invoices. Seamlessly feed compliant journal entries straight into NetSuite, SAP, or QuickBooks.
                </p>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Automated deferred revenue amortization schedules</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                    <span className="material-symbols-outlined text-[#15803d] text-base">check_circle</span>
                    <span>Prorated mid-term contract co-terming and seat upgrades</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-lg overflow-hidden h-44 w-full border border-surface-soft">
                <img alt="Billing ledger" className="w-full h-full object-cover rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR1_44Hss1D4913FudvsHmEzSJdja5XvTDp0Q3VD0yL3dk_Gggc9THJ4i9eCVMjbhjk_XwOsmc1eM-YPtcIx1wBtDTXsOEkJzG8BhkKojPR2-JJi5wdrDxPijI4GGmOC78wvCdA9otLNyJ24KEdhz4y180Kj_cTN_tfk0LhBibTlfRFbsBmDYW8p82fiwydLsZLhupEvt3o9bb5hnslHBwwPKlrkypfFQ45wIwjLkX7zFNzfxCQCZ0Sw"/>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Live Deal Trace: End-to-End Workflow Execution */}
        <div className="w-full bg-border-soft border-y border-surface-soft py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-label-sm font-label-sm uppercase tracking-widest text-primary font-bold">Unified Pipeline In Action</span>
              <h2 className="text-headline-lg font-headline-lg text-text-main">Trace an Enterprise Deal from Quote to Cash</h2>
              <p className="text-body-md font-body-md text-text-body">Experience how DealFlow360 connects previously disjointed tools into a contiguous, zero-friction automated pipeline.</p>
            </div>
            
            {/* Workflow Timeline Navigator */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                className={`p-4 rounded-xl text-left transition-all flex flex-col space-y-2 ${workflowStep === 0 ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/70 border border-surface-soft hover:bg-white hover:border-primary/50'}`}
                onClick={() => setWorkflowStep(0)}
              >
                <span className={`text-label-sm font-label-sm font-bold ${workflowStep === 0 ? 'text-primary' : 'text-text-muted'}`}>PHASE 01</span>
                <span className="text-headline-sm font-headline-sm text-text-main">Quotation Creation</span>
                <span className="text-body-sm font-body-sm text-text-body">CPQ configuration with live margin protection</span>
              </button>
              <button 
                className={`p-4 rounded-xl text-left transition-all flex flex-col space-y-2 ${workflowStep === 1 ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/70 border border-surface-soft hover:bg-white hover:border-primary/50'}`}
                onClick={() => setWorkflowStep(1)}
              >
                <span className={`text-label-sm font-label-sm font-bold ${workflowStep === 1 ? 'text-primary' : 'text-text-muted'}`}>PHASE 02</span>
                <span className="text-headline-sm font-headline-sm text-text-main">Blended Routing</span>
                <span className="text-body-sm font-body-sm text-text-body">Concurrent multi-department sign-offs</span>
              </button>
              <button 
                className={`p-4 rounded-xl text-left transition-all flex flex-col space-y-2 ${workflowStep === 2 ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/70 border border-surface-soft hover:bg-white hover:border-primary/50'}`}
                onClick={() => setWorkflowStep(2)}
              >
                <span className={`text-label-sm font-label-sm font-bold ${workflowStep === 2 ? 'text-primary' : 'text-text-muted'}`}>PHASE 03</span>
                <span className="text-headline-sm font-headline-sm text-text-main">Multi-Warehouse Fulfillment</span>
                <span className="text-body-sm font-body-sm text-text-body">Automated stock split &amp; tracking synch</span>
              </button>
              <button 
                className={`p-4 rounded-xl text-left transition-all flex flex-col space-y-2 ${workflowStep === 3 ? 'bg-white border-2 border-primary shadow-sm' : 'bg-white/70 border border-surface-soft hover:bg-white hover:border-primary/50'}`}
                onClick={() => setWorkflowStep(3)}
              >
                <span className={`text-label-sm font-label-sm font-bold ${workflowStep === 3 ? 'text-primary' : 'text-text-muted'}`}>PHASE 04</span>
                <span className="text-headline-sm font-headline-sm text-text-main">Consolidated Ledger</span>
                <span className="text-body-sm font-body-sm text-text-body">ASC 606 revenue recognition &amp; invoicing</span>
              </button>
            </div>
            
            {/* Step Content Display Window */}
            <div className="p-6 sm:p-8 rounded-xl bg-white border border-surface-soft shadow-lg">
              {workflowStep === 0 && (
                <div className="step-panel grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded bg-border-soft text-primary border border-surface-soft text-label-sm font-label-sm uppercase tracking-wider font-bold">Dynamic CPQ Stage</span>
                    <h3 className="text-headline-md font-headline-md text-text-main">Algorithmic Deal Building Without Spreadsheets</h3>
                    <p className="text-body-md font-body-md text-text-body">Sales reps compose multi-year subscriptions alongside physical appliances. Dynamic pricing guardrails instantly compute unit costs, delivery tariffs, and partner margins, alerting the rep before discounts violate corporate margin policies.</p>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Automated bundle compatibility checks prevent invalid orders</span>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Direct CRM quote sync (Salesforce, HubSpot, Microsoft Dynamics)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-border-soft border border-surface-soft space-y-3">
                    <div className="flex justify-between text-body-sm font-body-sm text-text-main">
                      <span className="font-medium">SKU: ENT-SERVER-GEN4</span>
                      <span className="text-[#15803d] font-data-tabular font-bold">24 Units Allocated</span>
                    </div>
                    <div className="flex justify-between text-body-sm font-body-sm text-text-main">
                      <span className="font-medium">SKU: SAAS-CORE-SEATS</span>
                      <span className="text-[#15803d] font-data-tabular font-bold">1,200 Annual Licenses</span>
                    </div>
                    <div className="w-full bg-white border border-[#bbf7d0] p-3 rounded text-body-sm font-body-sm text-text-body flex justify-between">
                      <span className="font-medium text-text-main">Calculated Deal Margin</span>
                      <span className="text-[#15803d] font-data-tabular font-bold">71.2% (Standard Clearance)</span>
                    </div>
                  </div>
                </div>
              )}
              {workflowStep === 1 && (
                <div className="step-panel grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded bg-border-soft text-primary border border-surface-soft text-label-sm font-label-sm uppercase tracking-wider font-bold">Approval Matrix Stage</span>
                    <h3 className="text-headline-md font-headline-md text-text-main">Parallel Multi-Disciplinary Routing</h3>
                    <p className="text-body-md font-body-md text-text-body">Say goodbye to linear approval chains where deals languish for weeks. Deals automatically branch: non-standard SLA clauses route to Legal, custom hardware specs to Engineering, and discount overrides to RevOps—all concurrently.</p>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>SLA escalation rules re-assign stalled approvals after 4 hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Audit-trailed immutable change-log with e-signature pairing</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-border-soft border border-surface-soft space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-surface-soft text-body-sm">
                      <span className="text-text-main font-medium">General Counsel (Indemnity Clause)</span>
                      <span className="text-[#15803d] font-label-sm font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-[#bbf7d0]"><span className="material-symbols-outlined text-xs">done_all</span> APPROVED</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-surface-soft text-body-sm">
                      <span className="text-text-main font-medium">VP of Sales Operations (18% Discount)</span>
                      <span className="text-[#15803d] font-label-sm font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-[#bbf7d0]"><span className="material-symbols-outlined text-xs">done_all</span> APPROVED</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-white border border-surface-soft text-body-sm">
                      <span className="text-text-main font-medium">Security &amp; InfoSec Compliance</span>
                      <span className="text-[#15803d] font-label-sm font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-[#bbf7d0]"><span className="material-symbols-outlined text-xs">done_all</span> APPROVED</span>
                    </div>
                  </div>
                </div>
              )}
              {workflowStep === 2 && (
                <div className="step-panel grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded bg-border-soft text-primary border border-surface-soft text-label-sm font-label-sm uppercase tracking-wider font-bold">Logistics Dispatch Stage</span>
                    <h3 className="text-headline-md font-headline-md text-text-main">Autonomous Multi-Facility Stock Split</h3>
                    <p className="text-body-md font-body-md text-text-body">The instant contracts are executed, hardware lines transform into warehouse pick-and-pack orders across your fulfillment hubs without human manual entry, while software seats instantly provision via SCIM.</p>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Split order tracking synchronized directly to buyer's portal</span>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Automated 3PL connector (FedEx, DHL, ShipBob, SAP EWM)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-border-soft border border-surface-soft space-y-3">
                    <div className="p-3 rounded bg-white border border-surface-soft text-body-sm space-y-1">
                      <div className="flex justify-between font-medium text-text-main">
                        <span>Warehouse Hub #1 (Frankfurt)</span>
                        <span className="text-[#15803d] font-data-tabular font-bold">Dispatched 14 Racks</span>
                      </div>
                      <div className="text-text-muted text-label-sm">Tracking: DHL-EX-990218-DE</div>
                    </div>
                    <div className="p-3 rounded bg-white border border-surface-soft text-body-sm space-y-1">
                      <div className="flex justify-between font-medium text-text-main">
                        <span>Warehouse Hub #2 (Newark)</span>
                        <span className="text-[#15803d] font-data-tabular font-bold">Dispatched 10 Racks</span>
                      </div>
                      <div className="text-text-muted text-label-sm">Tracking: FDX-PRIORITY-448102</div>
                    </div>
                  </div>
                </div>
              )}
              {workflowStep === 3 && (
                <div className="step-panel grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded bg-border-soft text-primary border border-surface-soft text-label-sm font-label-sm uppercase tracking-wider font-bold">Financial Reconciliation</span>
                    <h3 className="text-headline-md font-headline-md text-text-main">Consolidated Invoicing &amp; ASC 606 Amortization</h3>
                    <p className="text-body-md font-body-md text-text-body">Hardware delivery confirmations trigger immediate partial asset invoicing, while recurring platform tiers amortize neatly onto deferred revenue waterfalls compliant with international audit standards.</p>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>One-click journal entries pushed straight to NetSuite &amp; Workday</span>
                      </div>
                      <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-main">
                        <span className="material-symbols-outlined text-[#15803d]">task_alt</span>
                        <span>Automatic multi-currency VAT &amp; sales tax reconciliation</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-lg bg-border-soft border border-surface-soft space-y-3">
                    <div className="flex justify-between text-body-sm font-body-sm">
                      <span className="text-text-main font-bold">Consolidated Invoice #INV-2025-09</span>
                      <span className="text-primary font-data-tabular font-bold">$428,500.00</span>
                    </div>
                    <div className="w-full bg-white border border-surface-soft p-3 rounded space-y-2">
                      <div className="flex justify-between text-label-sm font-label-sm text-text-body">
                        <span>Delivered Hardware (Immediate Rev)</span>
                        <span className="text-text-main font-data-tabular font-semibold">$164,000.00</span>
                      </div>
                      <div className="flex justify-between text-label-sm font-label-sm text-text-body">
                        <span>Recognized Month 1 SaaS Subscription</span>
                        <span className="text-text-main font-data-tabular font-semibold">$15,000.00</span>
                      </div>
                      <div className="flex justify-between text-label-sm font-label-sm text-primary font-semibold">
                        <span>Deferred ARR (ASC 606 Schedule)</span>
                        <span className="font-data-tabular font-bold">$249,500.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Final Conversion Banner */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="trial">
          <div className="rounded-xl bg-primary p-8 sm:p-14 shadow-xl relative overflow-hidden text-white">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-dark/40 blur-2xl pointer-events-none"></div>
            <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
              <span className="text-label-sm font-label-sm uppercase tracking-widest text-on-primary font-bold">Zero Friction Deployment</span>
              <h2 className="text-headline-lg font-headline-lg text-white font-extrabold">
                Ready to Modernize Your Enterprise Deal Lifecycle?
              </h2>
              <p className="text-body-lg font-body-lg text-on-primary/90 max-w-2xl mx-auto">
                Deploy DealFlow360 across your revenue operations team in under 14 days. Plug directly into your existing CRM, ERP, and logistics infrastructure.
              </p>
              
              <form className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto pt-4" onSubmit={(e) => { e.preventDefault(); alert('Demo environment credentials dispatched to your enterprise inbox.'); }}>
                <input className="w-full sm:flex-1 px-4 py-3.5 rounded-lg bg-white text-text-main placeholder:text-text-muted text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-on-primary shadow-sm" placeholder="Enter corporate email..." required type="email"/>
                <button className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-primary-dark border border-primary-dark text-white font-headline-sm text-headline-sm hover:bg-primary-dark transition-all whitespace-nowrap shadow-md cursor-pointer" type="submit">
                  Get Started with DealFlow360
                </button>
              </form>
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-label-sm font-label-sm text-on-primary">
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span> 14-day dedicated pilot</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span> Pre-built ERP connectors</span>
                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-emerald-status text-sm">check_circle</span> Custom SLA guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LandingPage;
