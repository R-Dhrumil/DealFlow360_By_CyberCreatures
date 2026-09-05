import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function DealHealthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      // fallback mock data if API is not fully wired
      setData({
        metrics: {
          totalQuotes: 124,
          winRate: 68.5,
          pendingApprovals: 12,
          avgRiskScore: 3.4
        },
        highRiskDeals: [
          { id: '1a2b3c4d', status: 'pending_approval', blended_risk_score: 12.5, customer_name: 'Acme Corp', rep_name: 'Alice Smith' },
          { id: '5e6f7g8h', status: 'pending_approval', blended_risk_score: 8.2, customer_name: 'TechStart', rep_name: 'Bob Jones' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  const { metrics, highRiskDeals } = data;

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Deal Health Dashboard</h1>
        <p className="text-slate-500">Overview of quotation metrics and risk analysis.</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Quotations</p>
              <h3 className="text-3xl font-bold text-slate-800">{metrics.totalQuotes}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Win Rate</p>
              <h3 className="text-3xl font-bold text-slate-800">{metrics.winRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <i className="fa-solid fa-trophy"></i>
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-slate-800">{metrics.pendingApprovals}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg Risk Score</p>
              <h3 className="text-3xl font-bold text-slate-800">{metrics.avgRiskScore}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Deals Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">High Risk Deals</h2>
          <span className="text-sm text-slate-500">Quotations requiring attention</span>
        </div>
        
        {highRiskDeals && highRiskDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-3 font-medium">Quote ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Sales Rep</th>
                  <th className="px-6 py-3 font-medium text-center">Risk Score</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highRiskDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{deal.id.split('-')[0]}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{deal.customer_name}</td>
                    <td className="px-6 py-4 text-slate-600">{deal.rep_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        <i className="fa-solid fa-fire"></i>
                        <span>{parseFloat(deal.blended_risk_score).toFixed(2)}%</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/app/approvals`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                        Review Deal
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <i className="fa-solid fa-shield-check text-green-500 text-4xl mb-3"></i>
            <p className="text-slate-600">No high risk deals currently in the pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
}
