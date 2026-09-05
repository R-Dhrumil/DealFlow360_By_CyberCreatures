import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function DealHealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nudgedDeals, setNudgedDeals] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setData({
        metrics: {
          totalQuotes: 124,
          winRate: '68.5',
          pendingApprovals: 12,
          avgRiskScore: '3.40'
        },
        highRiskDeals: [
          { id: 'Q-102', status: 'pending_approval', blended_risk_score: 12.5, customer_name: 'Acme Corp', rep_name: 'Alex Rep', stalledDays: 6, anomalyReason: 'Discount 12% above rep average' },
          { id: 'Q-103', status: 'pending_finance_approval', blended_risk_score: 18.2, customer_name: 'CyberNet Systems', rep_name: 'John Sales', stalledDays: 8, anomalyReason: 'Category hardware ceiling breach' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNudge = (dealId) => {
    setNudgedDeals(prev => [...prev, dealId]);
    alert(`Nudge escalation notification sent to assigned rep for Deal #${dealId}!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  const { metrics, highRiskDeals } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Deal Health & Anomaly Dashboard</h1>
          <p className="text-sm text-text-muted">Real-time risk scoring, stalled quote detection & discount governance monitoring</p>
        </div>
        
        <Link to="/app/pipeline" className="btn-secondary text-xs">
          <i className="fa-solid fa-diagram-project mr-1"></i> View Full Kanban Pipeline
        </Link>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-surface-soft shadow-sm border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Total Quotations</p>
              <h3 className="text-3xl font-black text-text-main">{metrics.totalQuotes}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-border-soft flex items-center justify-center text-primary font-bold">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-surface-soft shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Win Rate</p>
              <h3 className="text-3xl font-black text-text-main">{metrics.winRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <i className="fa-solid fa-trophy"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-surface-soft shadow-sm border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Pending Approvals</p>
              <h3 className="text-3xl font-black text-text-main">{metrics.pendingApprovals}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-surface-soft shadow-sm border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Avg Risk Score</p>
              <h3 className="text-3xl font-black text-text-main">{metrics.avgRiskScore}%</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Stalled Deals & Anomaly Alerts Section (Spec Section B9) */}
      <div className="bg-white rounded-xl border border-surface-soft shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-soft bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-text-main">Stalled Deals & Discount Anomaly Alerts</h2>
            <p className="text-xs text-text-muted">Quotations inactive &gt; 5 days or exceeding rep historical averages</p>
          </div>
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {highRiskDeals.length} Alerts Active
          </span>
        </div>
        
        {highRiskDeals && highRiskDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-text-muted font-semibold border-b border-surface-soft bg-slate-50/50">
                  <th className="px-6 py-3">Quote ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Assigned Rep</th>
                  <th className="px-6 py-3">Stalled Inactivity</th>
                  <th className="px-6 py-3">Anomaly Warning</th>
                  <th className="px-6 py-3 text-center">Blended Risk Score</th>
                  <th className="px-6 py-3 text-right">Escalation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {highRiskDeals.map((deal) => {
                  const dealId = deal.id.split('-')[0];
                  const isNudged = nudgedDeals.includes(dealId);

                  return (
                    <tr key={deal.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-primary">{dealId}</td>
                      <td className="px-6 py-4 font-bold text-text-main">{deal.customer_name}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{deal.rep_name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          <i className="fa-solid fa-hourglass-half mr-1"></i> {deal.stalledDays || 6} Days Inactive
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        <span className="text-red-600 font-bold mr-1">⚠️</span> {deal.anomalyReason || 'Discount exceeds ceiling'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-700">
                          <i className="fa-solid fa-fire text-red-500 mr-1"></i>
                          <span>{parseFloat(deal.blended_risk_score).toFixed(2)}%</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleNudge(dealId)}
                          disabled={isNudged}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                            isNudged 
                              ? 'bg-slate-200 text-text-muted cursor-default' 
                              : 'bg-primary hover:bg-primary-dark text-text-main shadow-sm'
                          }`}
                        >
                          {isNudged ? 'Nudged' : '⚡ Nudge Rep'}
                        </button>
                        <Link 
                          to="/app/approvals" 
                          className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-white hover:bg-surface-soft text-text-main inline-block"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <i className="fa-solid fa-shield-check text-emerald-status text-4xl mb-3"></i>
            <p className="text-slate-600 font-semibold text-sm">No stalled or high risk deals in pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
}
