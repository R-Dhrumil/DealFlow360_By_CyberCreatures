import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotification } from '../contexts/NotificationContext';

export default function Reporting() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    summary: {
      totalQuotations: 0,
      wonDeals: 0,
      pendingDeals: 0,
      rejectedDeals: 0,
      totalWonRevenue: 0,
      totalPipelineValue: 0,
      avgDiscount: 0,
      avgMargin: 0,
      winRate: 0
    },
    repPerformance: [],
    productPerformance: [],
    recentQuotations: []
  });

  // Filter Dropdown Options (fetched from backend)
  const [filterOptions, setFilterOptions] = useState({
    salesReps: [],
    categories: [],
    products: []
  });

  // Active Filter States
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRep, setSelectedRep] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'draft'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');

  // Product table view tab: 'all' | 'best_seller' | 'most_discounted'
  const [productViewTab, setProductViewTab] = useState('all');

  // Fetch Available Filter Options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await api.get('/reporting/filters');
        if (res.data) {
          setFilterOptions({
            salesReps: res.data.salesReps || [],
            categories: res.data.categories || [],
            products: res.data.products || []
          });
        }
      } catch (err) {
        console.error('Failed to load reporting filter options', err);
      }
    }
    fetchFilters();
  }, []);

  // Fetch Dynamic Report Data
  const fetchReport = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reporting analytics', err);
      if (!silent) showNotification('error', 'Failed to load reporting data.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [period, startDate, endDate, selectedRep, selectedStatus, selectedCategory, selectedProduct, showNotification]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Reset Filters to default
  const handleResetFilters = () => {
    setPeriod('all');
    setStartDate('');
    setEndDate('');
    setSelectedRep('all');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedProduct('all');
  };

  const isFiltered = useMemo(() => {
    return period !== 'all' || selectedRep !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedProduct !== 'all';
  }, [period, selectedRep, selectedStatus, selectedCategory, selectedProduct]);

  // Filter products by tab: all, best sellers, or most discounted
  const displayedProducts = useMemo(() => {
    const list = reportData.productPerformance || [];
    if (productViewTab === 'best_seller') {
      return [...list].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
    }
    if (productViewTab === 'most_discounted') {
      return [...list].sort((a, b) => b.avgDiscount - a.avgDiscount).slice(0, 10);
    }
    return list;
  }, [reportData.productPerformance, productViewTab]);

  // CSV Export Function
  const handleExportCSV = () => {
    const rows = reportData.recentQuotations || [];
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
    showNotification('success', 'Reporting data exported to CSV.');
  };

  const { summary, repPerformance, recentQuotations } = reportData;

  return (
    <div className="p-6 md:p-12 space-y-8">
      {/* ── Heading ── */}
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Sales &amp; Performance Reporting</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Live Database
            </span>
          </div>
          <p className="text-text-muted mt-1 text-xs">
            Multi-dimensional reporting filters to track quotation velocity, team quotas, and product margin health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-surface-soft text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <i className="fa-solid fa-file-csv text-emerald-600 text-sm"></i>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => fetchReport(false)}
            className="p-2 rounded-xl bg-white border border-surface-soft text-slate-700 hover:bg-slate-50 transition-all text-xs shadow-2xs"
            title="Refresh analytics"
          >
            <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin text-primary' : ''}`}></i>
          </button>
        </div>
      </header>

      {/* ── Filters Section (Placed directly after the heading text) ── */}
      <section className="bg-white rounded-2xl border border-surface-soft p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-surface-soft pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-filter text-primary text-sm"></i>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reporting Filters
            </h2>
            {isFiltered && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Active Filters Applied
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
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter 1: Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar text-primary text-xs"></i>
              <span>Period / Date Range</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
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
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i className="fa-solid fa-user-tie text-primary text-xs"></i>
              <span>Sales Team / Rep</span>
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            >
              <option value="all">All Sales Reps &amp; Managers</option>
              {filterOptions.salesReps.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Approval Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i className="fa-solid fa-stamp text-primary text-xs"></i>
              <span>Approval Status</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
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
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i className="fa-solid fa-tags text-primary text-xs"></i>
              <span>Product Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedProduct('all'); // Reset specific product when category shifts
              }}
              className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            >
              <option value="all">All Product Categories</option>
              {filterOptions.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers (rendered when period === 'custom') */}
        {period === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/70 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Summary KPI Cards ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Total Won Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-dollar-sign"></i>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatMoney(summary.totalWonRevenue)}</p>
          <div className="flex items-center justify-between text-[11px] text-text-muted font-medium pt-1 border-t border-slate-100">
            <span>Pipeline Value</span>
            <span className="font-bold text-slate-700">{formatMoney(summary.totalPipelineValue)}</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Quotation Volume</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.totalQuotations} <span className="text-xs font-normal text-text-muted">deals</span></p>
          <div className="flex items-center justify-between text-[11px] text-text-muted font-medium pt-1 border-t border-slate-100">
            <span>Won / Pending / Rejected</span>
            <span className="font-bold text-slate-700">{summary.wonDeals} / {summary.pendingDeals} / {summary.rejectedDeals}</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Win / Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-trophy"></i>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.winRate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, summary.winRate)}%` }}></div>
          </div>
          <div className="text-[11px] text-text-muted font-medium">
            <span>{summary.wonDeals} won out of {summary.totalQuotations} total quotes</span>
          </div>
        </div>

        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Gross Margin</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-chart-pie"></i>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.avgMargin}%</p>
          <div className="flex items-center justify-between text-[11px] text-text-muted font-medium pt-1 border-t border-slate-100">
            <span>Avg Discount Applied</span>
            <span className="font-bold text-slate-700">{summary.avgDiscount}%</span>
          </div>
        </div>
      </section>

      {/* ── Sales Team & Rep Performance ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Sales Team Performance</h2>
            <p className="text-text-muted text-xs">Closing volume, revenue generation, and discount discipline per representative.</p>
          </div>
          <span className="text-xs font-bold text-text-muted">{repPerformance.length} Active Reps</span>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-4 font-semibold">Sales Representative</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Quotes</th>
                  <th className="px-6 py-4 font-semibold text-center">Deals Won</th>
                  <th className="px-6 py-4 font-semibold text-center">Win Rate</th>
                  <th className="px-6 py-4 font-semibold text-center">Avg Discount</th>
                  <th className="px-6 py-4 font-semibold text-center">Avg Margin</th>
                  <th className="px-6 py-4 font-semibold text-right">Won Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {repPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-user-slash text-2xl text-slate-300 mb-2 block"></i>
                      No sales representatives matching current filters.
                    </td>
                  </tr>
                ) : (
                  repPerformance.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 border border-primary/20 shrink-0">
                            {rep.repName ? rep.repName.charAt(0).toUpperCase() : 'R'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-sm">{rep.repName}</span>
                            <span className="text-[10px] text-text-muted block capitalize">{rep.repRole?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{rep.totalQuotes}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-700">{rep.dealsWon}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          {rep.winRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{rep.avgDiscount}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                          rep.avgMargin > 25
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {rep.avgMargin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
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

      {/* ── Product & Category Performance: Best Selling & Most Discounted Items ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Product &amp; Category Performance</h2>
            <p className="text-text-muted text-xs">Track best-selling volume drivers and highest discounted items to safeguard margins.</p>
          </div>

          {/* View Mode Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setProductViewTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                productViewTab === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => setProductViewTab('best_seller')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                productViewTab === 'best_seller'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-fire text-amber-500"></i>
              <span>Best Selling</span>
            </button>
            <button
              type="button"
              onClick={() => setProductViewTab('most_discounted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                productViewTab === 'most_discounted'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-percent text-rose-500"></i>
              <span>Most Discounted</span>
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-4 font-semibold">Product Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Base Price</th>
                  <th className="px-6 py-4 font-semibold text-center">Units Quoted</th>
                  <th className="px-6 py-4 font-semibold text-center">Avg Discount</th>
                  <th className="px-6 py-4 font-semibold text-center">Max Discount</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-box-open text-2xl text-slate-300 mb-2 block"></i>
                      No products found matching the current reporting criteria.
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                          {p.isBestSeller && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <i className="fa-solid fa-crown text-[9px]"></i> Best Seller
                            </span>
                          )}
                          {p.isMostDiscounted && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <i className="fa-solid fa-tag text-[9px]"></i> High Discount
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">{formatMoney(p.basePrice)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{p.unitsQuoted}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${p.avgDiscount > 15 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {p.avgDiscount}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{p.maxDiscount}%</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quotations &amp; Orders Log</h2>
            <p className="text-text-muted text-xs">Filtered transaction records. Click any row to review the quotation.</p>
          </div>
          <span className="text-xs font-bold text-text-muted">{recentQuotations.length} Matching Records</span>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                  <th className="px-6 py-4 font-semibold">Quotation</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Sales Rep</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Date</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-soft text-xs">
                {recentQuotations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-text-muted">
                      <i className="fa-solid fa-folder-open text-2xl text-slate-300 mb-2 block"></i>
                      No quotation records match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  recentQuotations.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/app/quote/${q.id}`)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                      title="Click to view proposal"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 group-hover:text-primary transition-colors">
                          {q.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">{q.customer_name}</span>
                        {q.customer_tier && (
                          <span className="text-[10px] text-text-muted block">{q.customer_tier}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {q.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={q.product_summary}>
                        {q.product_summary}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatMoney(q.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          q.status === 'approved' || q.status === 'confirmed' || q.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : q.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : q.status?.includes('pending')
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {q.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-text-muted">
                        {q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/quote/${q.id}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-surface-soft text-slate-700 hover:text-primary hover:border-primary/40 font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1"
                        >
                          <span>View</span>
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
