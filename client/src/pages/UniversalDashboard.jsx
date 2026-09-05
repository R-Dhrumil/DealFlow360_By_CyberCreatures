import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
};

const getStageBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending_approval':
    case 'pending_finance_approval':
      return {
        label: 'Approval Gate',
        bg: 'bg-amber-status/10',
        text: 'text-amber-status',
        border: 'border-amber-status/30',
        dot: 'bg-amber-status'
      };
    case 'approved':
      return {
        label: 'Approved',
        bg: 'bg-emerald-status/10',
        text: 'text-emerald-status',
        border: 'border-emerald-status/30',
        dot: 'bg-emerald-status'
      };
    case 'confirmed':
    case 'won':
      return {
        label: 'Confirmed',
        bg: 'bg-secondary/10',
        text: 'text-secondary',
        border: 'border-secondary/30',
        dot: 'bg-secondary'
      };
    case 'sent':
      return {
        label: 'Sent • Viewed',
        bg: 'bg-amber-status/10',
        text: 'text-amber-status',
        border: 'border-amber-status/30',
        dot: 'bg-amber-status'
      };
    case 'draft':
    default:
      return {
        label: 'Draft',
        bg: 'bg-surface-soft/40',
        text: 'text-text-muted',
        border: 'border-surface-soft',
        dot: 'bg-text-muted'
      };
  }
};

const UniversalDashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardDataSilent, 3500);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardDataSilent = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data || []);
    } catch (err) {
      // silent fail during background polling
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations');
      setQuotations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch quotations for dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculation
  const pendingDeals = quotations.filter(q => q.status?.includes('pending'));
  const pendingValue = pendingDeals.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  const openDeals = quotations.filter(q => q.status !== 'rejected');
  const openValue = openDeals.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  const atRiskDeals = quotations.filter(q => (Number(q.blended_risk_score) || 0) >= 5);
  const atRiskValue = atRiskDeals.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  const totalRecognizedValue = quotations
    .filter(q => q.status === 'approved' || q.status === 'confirmed')
    .reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  const draftCount = quotations.filter(q => q.status === 'draft').length;
  const approvalGateCount = pendingDeals.length;

  // Filtered deals for table
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      !filterText ||
      q.customer_name?.toLowerCase().includes(filterText.toLowerCase()) ||
      q.id?.toLowerCase().includes(filterText.toLowerCase()) ||
      q.sales_rep_name?.toLowerCase().includes(filterText.toLowerCase());

    const matchesStage =
      selectedStage === 'all' ||
      (selectedStage === 'draft' && q.status === 'draft') ||
      (selectedStage === 'approval' && q.status?.includes('pending')) ||
      (selectedStage === 'approved' && (q.status === 'approved' || q.status === 'confirmed'));

    return matchesSearch && matchesStage;
  });

  const totalFilteredAcv = filteredQuotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);

  return (
    <div className="flex flex-col w-full min-h-screen px-8 py-8 bg-border-soft font-sans text-text-body">
      {/* Executive Action & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
        <div className="flex flex-col gap-1">
         
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">Revenue Operations Command</h1>
        </div>
        
        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          
          
          <Link to="/app/approvals" className="relative group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-amber-status border border-amber-status/30 hover:bg-amber-status/10 transition-all shadow-sm font-semibold text-xs">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Review Approvals</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-status text-on-primary text-[11px] font-bold">
              {pendingDeals.length}
            </span>
          </Link>
          
          <Link to="/app/quote" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-sm hover:bg-primary-dark transition-all active:scale-[0.99]">
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cockpit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 pb-7">
        {/* Metric 1: Pending Approvals */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
       
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Gatekeeper Queue</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Pending Approvals</span>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-status/10 text-rose-status border border-rose-status/20 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-status"></span> Queue: {pendingDeals.length}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-status">{pendingDeals.length}</span>
              <span className="text-xs text-text-muted font-medium">deals in queue</span>
            </div>
            <span className="font-mono text-sm font-bold text-text-main">{formatCurrency(pendingValue)}</span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between">
            <span className="text-xs text-text-muted">{pendingDeals.length > 0 ? `${pendingDeals.length} awaiting review` : 'All cleared'}</span>
            <Link to="/app/approvals" className="text-xs font-semibold text-rose-status hover:underline flex items-center gap-0.5">
              Resolve <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Metric 2: Open Quotations */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
         
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Deal Desk Active</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Open Quotations</span>
            </div>
            <span className="p-2 rounded-xl bg-amber-status/10 text-amber-status border border-amber-status/20">
              <span className="material-symbols-outlined text-lg">stacked_bar_chart</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-main">{formatCurrency(openValue)}</span>
              <span className="text-xs text-amber-status font-bold">{openDeals.length} active</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3.5 rounded bg-amber-status"></span>
              <span className="w-1.5 h-5 rounded bg-amber-status"></span>
              <span className="w-1.5 h-6 rounded bg-amber-status"></span>
              <span className="w-1.5 h-2 rounded bg-surface-soft"></span>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between">
            <span className="text-xs text-text-muted">Total Active CPQ Quotes</span>
            <span className="font-mono text-xs font-semibold text-text-main">{quotations.length} records</span>
          </div>
        </div>

        {/* Metric 3: At-Risk Deals */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
         
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">AI Deal Sentry</span>
              <span className="font-bold text-sm text-text-main pt-0.5">At-Risk Deals</span>
            </div>
            <span className="p-2 rounded-xl bg-rose-status/10 text-rose-status border border-rose-status/20">
              <span className="material-symbols-outlined text-lg">warning_amber</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-status">{atRiskDeals.length}</span>
              <span className="text-xs text-text-muted font-medium">anomalies tagged</span>
            </div>
            <span className="font-mono text-sm font-bold text-rose-status">{formatCurrency(atRiskValue)}</span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between">
            <span className="text-xs font-medium text-rose-status">Risk Score ≥ 5.0</span>
            <span className="material-symbols-outlined text-text-muted text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
          </div>
        </div>

        {/* Metric 4: Revenue Recognized */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
         
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Financial Performance</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Revenue Approved</span>
            </div>
            <span className="p-2 rounded-xl bg-emerald-status/10 text-emerald-status border border-emerald-status/20">
              <span className="material-symbols-outlined text-lg">payments</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-main">{formatCurrency(totalRecognizedValue)}</span>
              <span className="text-xs font-bold text-emerald-status bg-emerald-status/10 px-2 py-0.5 rounded border border-emerald-status/20">Live</span>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex flex-col gap-1.5">
            <div className="w-full bg-border-soft h-2 rounded-full overflow-hidden border border-surface-soft">
              <div className="bg-emerald-status h-full rounded-full" style={{ width: `${Math.min(100, Math.max(15, quotations.length ? (totalRecognizedValue / (openValue || 1)) * 100 : 0))}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Conversion Ratio</span>
              <span className="text-emerald-status font-mono font-bold">
                {openValue > 0 ? ((totalRecognizedValue / openValue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stage Split-Plane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-7">
        {/* Left / Center Stage: Active Deal Pipeline Board (8 cols on lg, 9 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col rounded-2xl bg-white border border-surface-soft shadow-sm overflow-hidden">
          {/* Table Header & Quick Stage Filter Pills */}
          <div className="p-5 bg-border-soft border-b border-surface-soft flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-white border border-surface-soft text-primary shadow-xs">
                  <span className="material-symbols-outlined text-xl">account_tree</span>
                </span>
                <div>
                  <h2 className="text-base font-bold text-text-main">Active Deal Pipeline</h2>
                  <span className="text-xs text-text-muted">Configured products, multi-tier pricing, and signature status</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <input
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-surface-soft text-text-main text-xs placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Filter pipeline..."
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">search</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stage Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedStage('all')}
                className={`stage-pill px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  selectedStage === 'all'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-white text-text-muted border border-surface-soft hover:bg-border-soft hover:text-text-main'
                }`}
              >
                <span>All Stages</span>
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  selectedStage === 'all' ? 'bg-white text-primary' : 'bg-surface-soft text-text-main'
                }`}>
                  {quotations.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedStage('draft')}
                className={`stage-pill px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  selectedStage === 'draft'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-white text-text-muted border border-surface-soft hover:bg-border-soft hover:text-text-main'
                }`}
              >
                <span>Draft</span>
                <span className="text-[11px] font-semibold">{draftCount}</span>
              </button>

              <button
                onClick={() => setSelectedStage('approval')}
                className={`stage-pill px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  selectedStage === 'approval'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-white text-text-muted border border-surface-soft hover:bg-border-soft hover:text-text-main'
                }`}
              >
                <span>Approval Gate</span>
                <span className="text-[11px] text-amber-status font-bold">{approvalGateCount}</span>
              </button>

              <button
                onClick={() => setSelectedStage('approved')}
                className={`stage-pill px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  selectedStage === 'approved'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-white text-text-muted border border-surface-soft hover:bg-border-soft hover:text-text-main'
                }`}
              >
                <span>Approved</span>
                <span className="text-[11px] text-emerald-status font-bold">
                  {quotations.filter(q => q.status === 'approved' || q.status === 'confirmed').length}
                </span>
              </button>
            </div>
          </div>
          
          {/* Rich Deal Tracker Cards */}
          <div className="divide-y divide-surface-soft">
            {loading ? (
              <div className="py-12 text-center text-text-muted text-sm">
                <i className="fa-solid fa-circle-notch fa-spin text-primary text-2xl mb-3 block"></i>
                Loading deals from database...
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm">
                No matching deals found. Try adjusting the filter.
              </div>
            ) : (
              filteredQuotations.map((deal) => {
                const riskVal = Number(deal.blended_risk_score) || 0;
                const dealValue = Number(deal.total_amount) || 0;
                // Estimate gross margin from risk score (inverse proxy)
                const grossMargin = Math.max(5, Math.min(60, 40 - riskVal * 2)).toFixed(0);

                // Map status → pipeline step index (0-based)
                const PIPELINE_STEPS = [
                  'Query', 'Requirement', 'Quotation', 'Manager',
                  'Finance', 'Client', 'Order', 'Factory', 'Billing', 'Completed'
                ];
                const statusStepMap = {
                  draft: 1,
                  pending_approval: 3,
                  pending_finance_approval: 4,
                  approved: 5,
                  confirmed: 6,
                  rejected: 2,
                  won: 9,
                  completed: 9
                };
                const currentStep = statusStepMap[deal.status?.toLowerCase()] ?? 1;
                const currentStepLabel = PIPELINE_STEPS[currentStep] || 'Requirement';

                const riskColor = riskVal >= 7 ? 'text-red-600 bg-red-50 border-red-200' :
                                  riskVal >= 4 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                                 'text-emerald-600 bg-emerald-50 border-emerald-200';

                return (
                  <div key={deal.id} className="p-5 hover:bg-slate-50/80 transition-colors group">
                    {/* Top Row: Deal Code + Title + KPI Pills */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Deal Code Badge */}
                        <span className="shrink-0 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg">
                          {formatQuoteCode(deal.id)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-primary transition-colors" title={deal.product_summary || deal.customer_name}>
                            {deal.product_summary || deal.customer_name || 'Enterprise Proposal'}
                          </h3>
                          <p className="text-xs text-text-muted mt-0.5">
                            Client: <strong className="text-slate-700">{deal.customer_name || 'N/A'}</strong>
                            {' • '}Sales Rep: <strong className="text-slate-700">{deal.sales_rep_name || 'Assigned Rep'}</strong>
                          </p>
                        </div>
                      </div>

                      {/* KPI Pills Row */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Deal Value */}
                        <div className="text-center border border-slate-200 rounded-xl px-3 py-1.5 bg-white shadow-xs min-w-[90px]">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Deal Value</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">
                            ${dealValue >= 1000000
                              ? `${(dealValue / 1000000).toFixed(2)}M`
                              : dealValue >= 1000
                              ? `${(dealValue / 1000).toFixed(1)}K`
                              : dealValue.toFixed(0)}
                          </p>
                        </div>

                        {/* Gross Margin */}
                        <div className="text-center border border-emerald-200 rounded-xl px-3 py-1.5 bg-emerald-50 shadow-xs min-w-[90px]">
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Gross Margin</p>
                          <p className="text-sm font-black text-emerald-700 mt-0.5">{grossMargin}%</p>
                        </div>

                        {/* Risk Score */}
                        <div className={`text-center border rounded-xl px-3 py-1.5 shadow-xs min-w-[90px] ${riskColor}`}>
                          <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Risk Score</p>
                          <p className="text-sm font-black mt-0.5">{riskVal.toFixed(0)}/100</p>
                        </div>

                        {/* Current Stage */}
                        <div className="text-center border border-blue-200 rounded-xl px-3 py-1.5 bg-blue-50 shadow-xs min-w-[90px]">
                          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Current Stage</p>
                          <p className="text-xs font-black text-blue-700 mt-0.5 uppercase">{currentStepLabel}</p>
                        </div>

                        {/* Action */}
                        {deal.status?.includes('pending') ? (
                          <Link to="/app/approvals" className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-dark transition-colors shadow-xs whitespace-nowrap flex items-center gap-1.5">
                            <i className="fa-solid fa-check text-xs"></i> Approve
                          </Link>
                        ) : (
                          <Link to={`/app/quote/${deal.id}`} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-xs whitespace-nowrap flex items-center gap-1.5">
                            <i className="fa-solid fa-eye text-xs"></i> View
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Pipeline Progress Tracker */}
                    <div className="flex items-center gap-0 overflow-x-auto pb-1 mt-3 pt-3 border-t border-slate-100">
                      {PIPELINE_STEPS.map((step, idx) => {
                        const isDone = idx < currentStep;
                        const isActive = idx === currentStep;
                        const isFuture = idx > currentStep;
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center shrink-0">
                              {/* Step Circle */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border-2 transition-all ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : isActive
                                  ? 'bg-blue-600 border-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
                                  : 'bg-white border-slate-300 text-slate-400'
                              }`}>
                                {isDone ? <i className="fa-solid fa-check text-[9px]"></i> : idx + 1}
                              </div>
                              {/* Step Label */}
                              <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${
                                isDone ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-slate-400'
                              }`}>
                                {idx + 1}. {step}
                              </span>
                            </div>
                            {/* Connector Line */}
                            {idx < PIPELINE_STEPS.length - 1 && (
                              <div className={`h-0.5 w-6 shrink-0 mb-3 ${idx < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 bg-border-soft border-t border-surface-soft flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 font-medium">
              <span>Showing {filteredQuotations.length} of {quotations.length} active deals</span>
              <span>•</span>
              <span className="text-primary font-bold">Total ACV: {formatCurrency(totalFilteredAcv)}</span>
            </div>
            <Link to="/app/pipeline" className="text-primary font-bold hover:underline flex items-center gap-1 transition-colors">
              View Complete Deal Desk <span className="material-symbols-outlined text-xs">chevron_right</span>
            </Link>
          </div>
        </div>
        
        {/* Right Stage: Deal Health & Risk Feed (4 cols on lg, 3 cols on xl) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          <div className="flex flex-col p-4 rounded-2xl bg-white border border-surface-soft shadow-sm overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-surface-soft">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-rose-status/10 text-rose-status border border-rose-status/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-base">crisis_alert</span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-status ring-2 ring-white"></span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-text-main truncate" title="Deal Health & Risk Feed">Deal Risk Feed</h3>
                  <span className="text-[10px] text-text-muted block truncate">Guardrail Telemetry</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-3">
              {atRiskDeals.length === 0 ? (
                <div className="p-3 rounded-xl bg-border-soft border border-surface-soft text-xs text-text-muted text-center">
                  All deals currently within risk guardrails.
                </div>
              ) : (
                atRiskDeals.map((riskDeal) => (
                  <div key={riskDeal.id} className="p-3 rounded-xl bg-border-soft border border-surface-soft flex flex-col gap-2 shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="w-2 h-2 rounded-full bg-rose-status flex-shrink-0"></span>
                        <span className="font-bold text-xs text-text-main truncate" title={riskDeal.customer_name || 'Account'}>
                          {riskDeal.customer_name || 'Account'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-status/10 text-rose-status border border-rose-status/20 uppercase whitespace-nowrap flex-shrink-0">
                        Score: {Number(riskDeal.blended_risk_score || 0).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-text-body leading-relaxed">
                      Quote <strong className="text-text-main font-bold">QT-{riskDeal.id.slice(0, 8).toUpperCase()}</strong> ({formatCurrency(riskDeal.total_amount)}) flagged for threshold evaluation.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-white border border-surface-soft shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pipeline Velocity</span>
              <span className="font-bold text-xs sm:text-sm text-text-main pt-0.5">Q3 CPQ Velocity</span>
              <span className="text-xs font-bold text-emerald-status pt-0.5">14.8 Days Cycle Time</span>
              <span className="text-[10px] text-text-muted pt-1 truncate">Active DB Connected</span>
            </div>
            <div className="relative w-16 h-16 flex-shrink-0 self-center sm:self-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-border-soft stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.5"></path>
                <path className="text-emerald-status stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="82, 100" strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-extrabold text-xs text-text-main">82%</span>
                <span className="font-bold text-text-muted text-[7px] tracking-wide uppercase">HEALTH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalDashboard;
