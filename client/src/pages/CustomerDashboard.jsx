import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const customer = userStr ? JSON.parse(userStr) : {
    name: 'Acme Procurement Team',
    email: 'purchasing@acmecorp.com',
    role: 'customer',
    company_name: 'Acme Corporation'
  };

  const [activeTab, setActiveTab] = useState('quotations');
  const [quotations, setQuotations] = useState([
    {
      id: 'Q-101',
      title: 'Enterprise Server & Cloud SaaS Proposal',
      totalAmount: 18500.00,
      status: 'presented',
      created_at: '2026-09-04',
      sales_rep: 'Alex Rep (CyberCreatures)',
      lines_count: 4
    },
    {
      id: 'Q-102',
      title: 'Hardware Upgrade & Annual Support',
      totalAmount: 45000.00,
      status: 'pending_approval',
      created_at: '2026-09-05',
      sales_rep: 'Sarah Manager (CyberCreatures)',
      lines_count: 3
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Customer Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md">
              {customer.name ? customer.name.charAt(0) : 'C'}
            </div>
            <div>
              <span className="font-bold text-white text-base block leading-tight">{customer.company_name || 'Customer Portal'}</span>
              <span className="text-xs text-slate-400">Authenticated Customer Workspace</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{customer.name}</p>
              <p className="text-[11px] text-slate-400">{customer.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-1.5"></i> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg border border-slate-700 flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              Customer Account Active
            </span>
            <h1 className="text-2xl font-bold">Welcome back, {customer.name}!</h1>
            <p className="text-sm text-slate-300 mt-1">Review live proposals, request line discounts, or E-sign quotations from your sales rep.</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quotations'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-file-invoice mr-1.5"></i> My Proposals ({quotations.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-id-card mr-1.5"></i> My Personal Profile
            </button>
          </div>
        </div>

        {/* TAB 1: Proposals List */}
        {activeTab === 'quotations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Active Proposals & Quotations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quotations.map(q => (
                <div 
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-primary-600 text-sm bg-primary-50 px-2.5 py-1 rounded-md">
                        {q.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        q.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        q.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {q.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{q.title}</h3>
                    <p className="text-xs text-slate-500">Prepared by <strong>{q.sales_rep}</strong> &bull; {q.lines_count} line items</p>

                    <div className="pt-2 flex justify-between items-baseline border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Total Proposal Value:</span>
                      <span className="text-2xl font-black text-slate-900">${q.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-3">
                    <Link
                      to={`/portal/${q.id}`}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center shadow transition-colors flex items-center justify-center"
                    >
                      <i className="fa-solid fa-pen-to-square mr-2"></i> View & Negotiate Proposal
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Personal Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {customer.name ? customer.name.charAt(0) : 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                <p className="text-xs text-slate-500">{customer.email}</p>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">
                  Verified Customer Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-1">Company / Organization</span>
                <span className="text-slate-900 font-bold text-sm">{customer.company_name || 'Acme Corporation'}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-1">Account Role</span>
                <span className="text-slate-900 font-bold text-sm">Customer Portal User</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-1">Customer History Status</span>
                <span className="text-emerald-700 font-bold text-sm">Gold Tier Customer</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block mb-1">Security Authentication</span>
                <span className="text-slate-900 font-bold text-sm">Encrypted JWT Session</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
