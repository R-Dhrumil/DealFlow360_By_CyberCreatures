import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotification } from '../contexts/NotificationContext';

// Realistic fallback metrics in case backend is offline/restarting
const FALLBACK_REPORT_DATA = {
  summary: {
    totalQuotations: 18,
    wonDeals: 11,
    pendingDeals: 4,
    rejectedDeals: 3,
    totalWonRevenue: 284500,
    totalPipelineValue: 412000,
    avgDiscount: 9.4,
    avgMargin: 34.2,
    winRate: 61.1
  },
  repPerformance: [
    {
      id: 'u4',
      repName: 'M. Shah',
      repEmail: 'sales@cybercreatures.com',
      repRole: 'sales_rep',
      totalQuotes: 8,
      dealsWon: 6,
      dealsPending: 1,
      totalRevenue: 142000,
      pipelineValue: 185000,
      avgDiscount: 8.2,
      avgMargin: 35.9,
      winRate: 75.0
    },
    {
      id: 'u6',
      repName: 'J. Rao',
      repEmail: 'j.rao@cybercreatures.com',
      repRole: 'sales_rep',
      totalQuotes: 6,
      dealsWon: 3,
      dealsPending: 2,
      totalRevenue: 86500,
      pipelineValue: 132000,
      avgDiscount: 11.5,
      avgMargin: 34.2,
      winRate: 50.0
    },
    {
      id: 'u7',
      repName: 'Jim Halpert',
      repEmail: 'j.halpert@cybercreatures.com',
      repRole: 'sales_rep',
      totalQuotes: 4,
      dealsWon: 2,
      dealsPending: 1,
      totalRevenue: 56000,
      pipelineValue: 95000,
      avgDiscount: 9.0,
      avgMargin: 35.5,
      winRate: 50.0
    }
  ],
  productPerformance: [
    {
      id: 'p1',
      name: 'Industrial Router Pro',
      category: 'Hardware',
      basePrice: 1200,
      floorPrice: 1000,
      quotesCount: 7,
      unitsQuoted: 140,
      totalRevenue: 134400,
      wonRevenue: 96000,
      avgDiscount: 8.5,
      maxDiscount: 15.0,
      isBestSeller: true,
      isMostDiscounted: false
    },
    {
      id: 'p6',
      name: 'NextGen Enterprise Firewall',
      category: 'Hardware',
      basePrice: 3800,
      floorPrice: 3200,
      quotesCount: 5,
      unitsQuoted: 25,
      totalRevenue: 85500,
      wonRevenue: 68400,
      avgDiscount: 10.0,
      maxDiscount: 18.0,
      isBestSeller: true,
      isMostDiscounted: false
    },
    {
      id: 'p2',
      name: 'Edge Compute Node X1',
      category: 'Hardware',
      basePrice: 2500,
      floorPrice: 2100,
      quotesCount: 4,
      unitsQuoted: 30,
      totalRevenue: 67500,
      wonRevenue: 45000,
      avgDiscount: 14.2,
      maxDiscount: 22.0,
      isBestSeller: false,
      isMostDiscounted: true
    },
    {
      id: 'p7',
      name: 'CPQ Engine Enterprise Suite',
      category: 'Software',
      basePrice: 350,
      floorPrice: 280,
      quotesCount: 6,
      unitsQuoted: 120,
      totalRevenue: 37800,
      wonRevenue: 28000,
      avgDiscount: 10.0,
      maxDiscount: 15.0,
      isBestSeller: false,
      isMostDiscounted: false
    },
    {
      id: 'p4',
      name: '24/7 Premium Support SLA',
      category: 'Services',
      basePrice: 500,
      floorPrice: 400,
      quotesCount: 8,
      unitsQuoted: 60,
      totalRevenue: 27000,
      wonRevenue: 21000,
      avgDiscount: 12.5,
      maxDiscount: 20.0,
      isBestSeller: false,
      isMostDiscounted: true
    }
  ],
  recentQuotations: [
    {
      id: 'q101',
      customer_name: 'Delta Systems LLC',
      customer_tier: 'Gold',
      sales_rep_name: 'M. Shah',
      sales_rep_role: 'sales_rep',
      product_summary: 'Industrial Router Pro, 24/7 Premium Support SLA',
      total_amount: 67200,
      max_discount_applied: 22.0,
      status: 'pending_approval',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'q103',
      customer_name: 'Acme Corp',
      customer_tier: 'Platinum Enterprise',
      sales_rep_name: 'M. Shah',
      sales_rep_role: 'sales_rep',
      product_summary: 'NextGen Enterprise Firewall',
      total_amount: 54150,
      max_discount_applied: 5.0,
      status: 'approved',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'q102',
      customer_name: 'Hyperion Logistics',
      customer_tier: 'Silver',
      sales_rep_name: 'J. Rao',
      sales_rep_role: 'sales_rep',
      product_summary: 'Edge Compute Node X1',
      total_amount: 70500,
      max_discount_applied: 6.0,
      status: 'pending_finance_approval',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'q104',
      customer_name: 'Globex Corporation',
      customer_tier: 'Bronze',
      sales_rep_name: 'Jim Halpert',
      sales_rep_role: 'sales_rep',
      product_summary: 'CPQ Engine Enterprise Suite',
      total_amount: 8750,
      max_discount_applied: 0.0,
      status: 'draft',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ]
};

const FALLBACK_FILTER_OPTIONS = {
  salesReps: [
    { id: 'u4', name: 'M. Shah', role: 'sales_rep' },
    { id: 'u6', name: 'J. Rao', role: 'sales_rep' },
    { id: 'u7', name: 'Jim Halpert', role: 'sales_rep' },
    { id: 'u3', name: 'Sarah Manager', role: 'sales_manager' }
  ],
  categories: ['Hardware', 'Software', 'Services'],
  products: [
    { id: 'p1', name: 'Industrial Router Pro', category: 'Hardware' },
    { id: 'p2', name: 'Edge Compute Node X1', category: 'Hardware' },
    { id: 'p4', name: '24/7 Premium Support SLA', category: 'Services' },
    { id: 'p6', name: 'NextGen Enterprise Firewall', category: 'Hardware' },
    { id: 'p7', name: 'CPQ Engine Enterprise Suite', category: 'Software' }
  ]
};

export default function Reporting() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();

  // Loading & Connection State
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Main Report Dataset
  const [reportData, setReportData] = useState(FALLBACK_REPORT_DATA);

  // Filter Dropdown Options
  const [filterOptions, setFilterOptions] = useState(FALLBACK_FILTER_OPTIONS);

  // Active Filter States
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRep, setSelectedRep] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'draft'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Search filter for the recent quotations log
  const [logSearchText, setLogSearchText] = useState('');

  // Product table view tab: 'all' | 'best_seller' | 'most_discounted'
  const [productViewTab, setProductViewTab] = useState('all');

  // Fetch Filter Dropdown Options
  const fetchFilters = useCallback(async () => {
    try {
      const res = await api.get('/reporting/filters');
      if (res.data) {
        setFilterOptions({
          salesReps: res.data.salesReps?.length > 0 ? res.data.salesReps : FALLBACK_FILTER_OPTIONS.salesReps,
          categories: res.data.categories?.length > 0 ? res.data.categories : FALLBACK_FILTER_OPTIONS.categories,
          products: res.data.products?.length > 0 ? res.data.products : FALLBACK_FILTER_OPTIONS.products
        });
      }
    } catch (err) {
      console.warn('Backend reporting/filters unavailable, using local options.', err.message);
    }
  }, []);

  // Fetch Dynamic Report Data
  const fetchReport = useCallback(async (showFeedback = false) => {
    try {
      setLoading(true);
      const params = {};
      if (period !== 'all') params.period = period;
      if (period === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (selectedRep !== 'all') params.repId = selectedRep;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedProduct !== 'all') params.productId = selectedProduct;

      const res = await api.get('/reporting', { params });
      if (res.data && res.data.summary) {
        setReportData(res.data);
        setIsLiveConnected(true);
        setConnectionError(null);
        if (showFeedback) showNotification('success', 'Reporting analytics updated from database.');
      }
    } catch (err) {
      console.warn('Reporting API failed:', err.message);
      setIsLiveConnected(false);
      setConnectionError(
        err.message?.includes('Network Error') || err.code === 'ERR_NETWORK'
          ? 'Backend server (port 5001) is currently unreachable. Displaying cached/sample metrics.'
          : err.response?.data?.error || 'Could not connect to reporting service.'
      );
      // Fallback with client-side filter emulation so UI remains responsive
      emulateClientFilters();
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, selectedRep, selectedStatus, selectedCategory, selectedProduct, showNotification]);

  // Emulate filtering on local fallback data when offline
  const emulateClientFilters = useCallback(() => {
    let filteredQuotes = [...FALLBACK_REPORT_DATA.recentQuotations];
    if (selectedRep !== 'all') {
      const repObj = filterOptions.salesReps.find(r => r.id === selectedRep);
      if (repObj) filteredQuotes = filteredQuotes.filter(q => q.sales_rep_name === repObj.name);
    }
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'pending') filteredQuotes = filteredQuotes.filter(q => q.status.includes('pending'));
      else if (selectedStatus === 'approved') filteredQuotes = filteredQuotes.filter(q => ['approved', 'confirmed'].includes(q.status));
      else filteredQuotes = filteredQuotes.filter(q => q.status === selectedStatus);
    }
    if (selectedCategory !== 'all') {
      filteredQuotes = filteredQuotes.filter(q => q.product_summary?.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    const wonList = filteredQuotes.filter(q => ['approved', 'confirmed'].includes(q.status));
    const totalWon = wonList.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const totalPipeline = filteredQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const wonCount = wonList.length;
    const totalCount = filteredQuotes.length;
    const winRate = totalCount > 0 ? parseFloat(((wonCount / totalCount) * 100).toFixed(1)) : 0;

    setReportData(prev => ({
      ...prev,
      summary: {
        totalQuotations: totalCount,
        wonDeals: wonCount,
        pendingDeals: filteredQuotes.filter(q => q.status.includes('pending')).length,
        rejectedDeals: filteredQuotes.filter(q => q.status === 'rejected').length,
        totalWonRevenue: totalWon,
        totalPipelineValue: totalPipeline,
        avgDiscount: 9.4,
        avgMargin: 34.2,
        winRate
      },
      recentQuotations: filteredQuotes
    }));
  }, [selectedRep, selectedStatus, selectedCategory, filterOptions.salesReps]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset Filters
  const handleResetFilters = () => {
    setPeriod('all');
    setStartDate('');
    setEndDate('');
    setSelectedRep('all');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedProduct('all');
    setLogSearchText('');
  };

  const isFiltered = useMemo(() => {
    return period !== 'all' || selectedRep !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedProduct !== 'all' || logSearchText.trim() !== '';
  }, [period, selectedRep, selectedStatus, selectedCategory, selectedProduct, logSearchText]);

  // Product tab sorting & filtering
  const displayedProducts = useMemo(() => {
    const list = reportData.productPerformance || [];
    if (productViewTab === 'best_seller') {
      return [...list].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 8);
    }
    if (productViewTab === 'most_discounted') {
      return [...list].sort((a, b) => b.avgDiscount - a.avgDiscount).slice(0, 8);
    }
    return list;
  }, [reportData.productPerformance, productViewTab]);

  // Filtered recent quotations with search
  const filteredQuotationsLog = useMemo(() => {
    const list = reportData.recentQuotations || [];
    if (!logSearchText.trim()) return list;
    const q = logSearchText.toLowerCase();
    return list.filter(item =>
      (item.id && item.id.toLowerCase().includes(q)) ||
      (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
      (item.sales_rep_name && item.sales_rep_name.toLowerCase().includes(q)) ||
      (item.product_summary && item.product_summary.toLowerCase().includes(q))
    );
  }, [reportData.recentQuotations, logSearchText]);

  // CSV Export
  const handleExportCSV = () => {
    const rows = filteredQuotationsLog;
    if (rows.length === 0) {
      showNotification('warning', 'No quotations to export with current filters.');
      return;
    }

    const headers = ['Quotation ID', 'Customer', 'Tier', 'Sales Rep', 'Products', 'Amount', 'Max Discount %', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.id}"`,
        `"${r.customer_name || ''}"`,
        `"${r.customer_tier || ''}"`,
        `"${r.sales_rep_name || ''}"`,
        `"${(r.product_summary || '').replace(/"/g, '""')}"`,
        r.total_amount || 0,
        r.max_discount_applied || 0,
        `"${r.status}"`,
        `"${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DealFlow360-Report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Report data exported to CSV.');
  };

  const { summary, repPerformance } = reportData;

  return (
    <div className="p-6 md:p-10 space-y-7 max-w-[1600px] mx-auto">
      {/* ── Offline / Reconnection Banner ── */}
      {!isLiveConnected && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-amber-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold shrink-0">
              <i className="fa-solid fa-cloud-bolt text-sm"></i>
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight">Database Service Notice</h4>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                {connectionError || 'API server is offline. Displaying local cache & simulated metrics.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchReport(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <i className={`fa-solid fa-rotate-right text-[11px] ${loading ? 'animate-spin' : ''}`}></i>
            <span>Reconnect Live DB</span>
          </button>
        </div>
      )}

      {/* ── Executive Header ── */}
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary uppercase tracking-wider">
              Deal Desk Intelligence
            </span>
            <span className="text-xs text-text-muted">
              ASC 606 &amp; CPQ Performance
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-main tracking-tight mt-1.5">
            Sales &amp; Performance Reporting
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time pipeline revenue, individual sales representative velocity, and product margin discipline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-surface-soft text-text-main hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2 shadow-2xs active:scale-[0.98]"
          >
            <i className="fa-solid fa-file-csv text-emerald-600 text-sm"></i>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => fetchReport(true)}
            className="p-2 rounded-xl bg-white border border-surface-soft text-text-main hover:bg-slate-50 transition-all text-xs shadow-2xs active:scale-[0.98]"
            title="Refresh analytics from server"
          >
            <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin text-primary' : ''}`}></i>
          </button>
        </div>
      </header>

      {/* ── Reporting Filters (Placed directly after the heading text) ── */}
      <section className="bg-white rounded-2xl border border-surface-soft p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-surface-soft pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              <i className="fa-solid fa-filter"></i>
            </div>
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider">
              Multi-Dimensional Reporting Filters
            </h2>
            {isFiltered && (
              <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full shadow-2xs">
                Active
              </span>
            )}
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <i className="fa-solid fa-rotate-left text-[10px]"></i>
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter 1: Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-main flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-regular fa-calendar text-primary text-xs"></i>
                <span>Period / Date Range</span>
              </span>
              {period !== 'all' && (
                <span className="text-[10px] font-bold text-primary capitalize">{period}</span>
              )}
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-2xs"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days (Week)</option>
              <option value="month">Past 30 Days (Month)</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Filter 2: Sales Team / Rep */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-main flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-user-tie text-primary text-xs"></i>
                <span>Sales Team / Rep</span>
              </span>
              {selectedRep !== 'all' && (
                <span className="text-[10px] font-bold text-primary">Filtered</span>
              )}
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-2xs"
            >
              <option value="all">All Sales Reps &amp; Managers</option>
              {filterOptions.salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.role ? rep.role.replace('_', ' ') : 'rep'})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Approval Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-main flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-stamp text-primary text-xs"></i>
                <span>Approval Status</span>
              </span>
              {selectedStatus !== 'all' && (
                <span className="text-[10px] font-bold text-primary capitalize">{selectedStatus}</span>
              )}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval (Manager / Finance)</option>
              <option value="approved">Approved &amp; Won Deals</option>
              <option value="rejected">Rejected Quotations</option>
              <option value="draft">Draft Proposals</option>
            </select>
          </div>

          {/* Filter 4: Product / Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-main flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-primary text-xs"></i>
                <span>Product Category</span>
              </span>
              {selectedCategory !== 'all' && (
                <span className="text-[10px] font-bold text-primary">{selectedCategory}</span>
              )}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedProduct('all');
              }}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-2xs"
            >
              <option value="all">All Product Categories</option>
              {filterOptions.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (conditionally rendered) */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-surface-soft flex flex-wrap items-center gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-surface-soft animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-main">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-main">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {isFiltered && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-text-muted">Filtering By:</span>
            {period !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-surface-soft font-semibold text-text-main text-[11px]">
                <span>Period: {period}</span>
                <button type="button" onClick={() => setPeriod('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedRep !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-surface-soft font-semibold text-text-main text-[11px]">
                <span>Rep: {filterOptions.salesReps.find(r => r.id === selectedRep)?.name || selectedRep}</span>
                <button type="button" onClick={() => setSelectedRep('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-surface-soft font-semibold text-text-main text-[11px]">
                <span>Status: {selectedStatus}</span>
                <button type="button" onClick={() => setSelectedStatus('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-surface-soft font-semibold text-text-main text-[11px]">
                <span>Category: {selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('all')} className="hover:text-rose-600">✕</button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── Executive KPI Metric Cockpit ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Won Revenue */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Total Recognized Revenue</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Approved &amp; Closed Deals</span>
            </div>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <i className="fa-solid fa-dollar-sign text-sm"></i>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{formatMoney(summary.totalWonRevenue)}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {summary.wonDeals} Won
            </span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Total Pipeline Value:</span>
            <span className="font-mono font-bold text-text-main">{formatMoney(summary.totalPipelineValue)}</span>
          </div>
        </div>

        {/* Metric 2: Quotation Volume */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Quotation Volume</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Pipeline Conversion Funnel</span>
            </div>
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalQuotations}</span>
              <span className="text-xs text-text-muted font-medium">total deals</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {summary.pendingDeals} In Review
            </span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Rejected / Cancelled:</span>
            <span className="font-mono font-bold text-rose-600">{summary.rejectedDeals}</span>
          </div>
        </div>

        {/* Metric 3: Win Rate */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Conversion Velocity</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Win / Close Rate</span>
            </div>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <i className="fa-solid fa-trophy text-sm"></i>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.winRate}%</span>
            <span className="text-xs text-text-muted font-semibold">
              {summary.wonDeals} / {summary.totalQuotations} Closed
            </span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, summary.winRate)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Metric 4: Gross Margin & Discount Discipline */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-surface-soft shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Pricing Integrity</span>
              <span className="font-bold text-sm text-text-main pt-0.5">Avg Gross Margin</span>
            </div>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <i className="fa-solid fa-chart-pie text-sm"></i>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{summary.avgMargin}%</span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Health Grade: A
            </span>
          </div>
          <div className="pt-3 mt-4 border-t border-surface-soft flex items-center justify-between text-xs text-text-muted font-medium">
            <span>Avg Applied Discount:</span>
            <span className="font-mono font-bold text-slate-800">{summary.avgDiscount}%</span>
          </div>
        </div>
      </section>

      {/* ── Sales Team & Rep Performance Table ── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-text-main">Sales Team Performance Leaderboard</h2>
            <p className="text-text-muted text-xs">Closing volume, revenue generation, and discount discipline per representative.</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-surface-soft text-text-muted shadow-2xs">
            {repPerformance.length} Reps Monitored
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-surface-soft shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-3.5 font-bold">Sales Representative</th>
                  <th className="px-6 py-3.5 font-bold text-center">Total Quotes</th>
                  <th className="px-6 py-3.5 font-bold text-center">Deals Won</th>
                  <th className="px-6 py-3.5 font-bold text-center">Win Rate</th>
                  <th className="px-6 py-3.5 font-bold text-center">Avg Discount</th>
                  <th className="px-6 py-3.5 font-bold text-center">Est Margin</th>
                  <th className="px-6 py-3.5 font-bold text-right">Recognized Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {repPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-user-slash text-2xl text-slate-300 mb-2 block"></i>
                      No sales representatives match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  repPerformance.map((rep, idx) => (
                    <tr key={rep.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0 text-xs">
                            {rep.repName ? rep.repName.charAt(0).toUpperCase() : 'R'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-text-main text-sm">{rep.repName}</span>
                              {idx === 0 && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Top Closer
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted block capitalize">{rep.repRole?.replace('_', ' ')} &bull; {rep.repEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-text-main text-sm">{rep.totalQuotes}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600 text-sm">{rep.dealsWon}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-bold text-slate-800">{rep.winRate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1">
                            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${Math.min(100, rep.winRate)}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-text-main">{rep.avgDiscount}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                          rep.avgMargin >= 30
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {rep.avgMargin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-text-main text-sm font-mono">
                        {formatMoney(rep.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Product Performance: Best Selling & Most Discounted Items ── */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-text-main">Product &amp; Category Profitability</h2>
            <p className="text-text-muted text-xs">Isolate best-selling volume drivers and flag most discounted items.</p>
          </div>

          {/* Segmented View Selector */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-surface-soft shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => setProductViewTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                productViewTab === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              All Catalog
            </button>
            <button
              type="button"
              onClick={() => setProductViewTab('best_seller')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                productViewTab === 'best_seller'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <i className="fa-solid fa-crown text-[10px]"></i>
              <span>Best Selling Items</span>
            </button>
            <button
              type="button"
              onClick={() => setProductViewTab('most_discounted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                productViewTab === 'most_discounted'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <i className="fa-solid fa-percent text-[10px]"></i>
              <span>Most Discounted</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-soft shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-3.5 font-bold">Product Name</th>
                  <th className="px-6 py-3.5 font-bold">Category</th>
                  <th className="px-6 py-3.5 font-bold text-right">Base Price</th>
                  <th className="px-6 py-3.5 font-bold text-center">Units Quoted</th>
                  <th className="px-6 py-3.5 font-bold text-center">Avg Discount</th>
                  <th className="px-6 py-3.5 font-bold text-center">Max Discount</th>
                  <th className="px-6 py-3.5 font-bold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-box-open text-2xl text-slate-300 mb-2 block"></i>
                      No products found matching the reporting filters.
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-main text-sm">{p.name}</span>
                          {p.isBestSeller && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              <i className="fa-solid fa-crown text-[9px]"></i> Best Seller
                            </span>
                          )}
                          {p.isMostDiscounted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <i className="fa-solid fa-tag text-[9px]"></i> Margin Alert
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-surface-soft">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-text-main">{formatMoney(p.basePrice)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">{p.unitsQuoted}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${p.avgDiscount >= 12 ? 'text-rose-600' : 'text-text-main'}`}>
                          {p.avgDiscount}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-text-muted">{p.maxDiscount}%</td>
                      <td className="px-6 py-4 text-right font-black text-text-main text-sm font-mono">
                        {formatMoney(p.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Filtered Quotations & Orders Log ── */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-text-main">Quotations &amp; Orders Log</h2>
            <p className="text-text-muted text-xs">Individual quotations matching active filter criteria. Click any row to review.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-text-muted text-xs"></i>
              <input
                type="text"
                value={logSearchText}
                onChange={(e) => setLogSearchText(e.target.value)}
                placeholder="Search quotes or customer..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-surface-soft text-xs text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs w-56"
              />
            </div>
            <span className="text-xs font-bold text-text-muted">
              {filteredQuotationsLog.length} Records
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-soft shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-3.5 font-bold">Quote Code</th>
                  <th className="px-6 py-3.5 font-bold">Customer Account</th>
                  <th className="px-6 py-3.5 font-bold">Assigned Rep</th>
                  <th className="px-6 py-3.5 font-bold">Product Summary</th>
                  <th className="px-6 py-3.5 font-bold text-right">Net Amount</th>
                  <th className="px-6 py-3.5 font-bold text-center">Status</th>
                  <th className="px-6 py-3.5 font-bold text-center">Date</th>
                  <th className="px-6 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {filteredQuotationsLog.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-folder-open text-2xl text-slate-300 mb-2 block"></i>
                      No quotation records match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredQuotationsLog.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/app/quote/${q.id}`)}
                      className="hover:bg-primary/5 cursor-pointer transition-colors group"
                      title="Click anywhere on this row to open quotation proposal"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-primary transition-colors text-sm">
                          {q.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-text-main block">{q.customer_name}</span>
                        {q.customer_tier && (
                          <span className="text-[10px] text-text-muted block">{q.customer_tier}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-main font-medium">
                        {q.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 text-text-muted max-w-xs truncate font-medium" title={q.product_summary}>
                        {q.product_summary}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-text-main text-sm font-mono">
                        {formatMoney(q.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize border ${
                          q.status === 'approved' || q.status === 'confirmed' || q.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : q.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : q.status?.includes('pending')
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-surface-soft'
                        }`}>
                          {q.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-text-muted font-medium">
                        {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/quote/${q.id}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-surface-soft text-text-main hover:text-primary hover:border-primary/40 font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          <span>Review</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
