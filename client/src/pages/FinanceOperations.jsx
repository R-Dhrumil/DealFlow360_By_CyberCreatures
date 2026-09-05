import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

const INITIAL_FINANCE_APPROVALS = [
  { id: 'Q-103', customer: 'CyberNet Systems', amount: 112000, riskScore: 18.20, rep: 'John Sales', status: 'pending_finance_approval', reason: 'Discount 18% requested on high-volume hardware & subscription bundle' },
];

const RECURRING_BILLING_SCHEDULES = [
  { id: 'BS-801', quoteId: 'Q-101', customer: 'Acme Corp', amount: 4250.00, cycle: 'Monthly', nextBillingDate: '2026-10-01', status: 'Active', prorationNotes: 'Standard 1st of month billing' },
  { id: 'BS-802', quoteId: 'Q-105', customer: 'Echo Energy', amount: 12500.00, cycle: 'Quarterly', nextBillingDate: '2026-11-01', status: 'Active', prorationNotes: 'Prorated mid-cycle +10 users added' }
];

const CREDIT_NOTES_LOG = [
  { id: 'CN-301', quoteId: 'Q-99', customer: 'Beta Industries', amount: 1200.00, reason: 'Mid-cycle plan downgrade adjustment', issuedDate: '2026-09-01' }
];

export default function FinanceOperations() {
  const { showNotification } = useNotification();
  const [approvals, setApprovals] = useState(INITIAL_FINANCE_APPROVALS);

  const handleFinanceAction = (quoteId, action) => {
    setApprovals(approvals.filter(a => a.id !== quoteId));
    showNotification('success', `Finance ${action} action recorded for Quote ${quoteId}! Reconciled in accounting ledger.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Finance & Operations Control Center</h1>
          <p className="text-sm text-text-muted">2nd-Level High-Risk Approvals, Billing Schedules, Proration & Credit Notes Reconciliation</p>
        </div>

        <span className="bg-emerald-status/20 text-emerald-100 px-3 py-1 rounded-lg text-xs font-bold font-mono">
          <i className="fa-solid fa-coins mr-1"></i> Finance Authority Active
        </span>
      </header>

      {/* 2nd Level High-Risk Approvals Section */}
      <div className="bg-white rounded-xl border border-surface-soft shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-text-main">High-Risk 2nd-Level Approvals Queue</h2>
            <p className="text-xs text-text-muted">Quotations with blended risk score exceeding 10% requiring Finance clearance</p>
          </div>
          <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {approvals.length} Requiring Action
          </span>
        </div>

        {approvals.length > 0 ? (
          <div className="space-y-3">
            {approvals.map(app => (
              <div key={app.id} className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-purple-700 text-sm">{app.id}</span>
                    <span className="font-bold text-text-main text-sm">{app.customer}</span>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Risk: {app.riskScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Rep: <strong>{app.rep}</strong> &bull; Total Value: <strong>${app.amount.toLocaleString()}</strong></p>
                  <p className="text-xs text-purple-900 italic"><i className="fa-solid fa-circle-info mr-1"></i> {app.reason}</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFinanceAction(app.id, 'Approve')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-text-main text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    <i className="fa-solid fa-check mr-1"></i> Authorize Discount
                  </button>
                  <button
                    onClick={() => handleFinanceAction(app.id, 'Reject')}
                    className="bg-red-600 hover:bg-red-700 text-text-main text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-surface-soft rounded-xl">
            <i className="fa-solid fa-circle-check text-emerald-status text-3xl mb-2"></i>
            <p className="text-slate-700 font-semibold text-sm">No high-risk 2nd-level approvals pending.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Billing Schedule & Proration */}
        <div className="bg-white rounded-xl border border-surface-soft shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-text-main text-sm">Recurring Billing & Proration Schedule</h3>
            <span className="text-xs text-text-muted font-mono">Automated Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-soft text-text-muted font-semibold bg-slate-50">
                  <th className="p-2.5">Schedule ID</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Billing Amount</th>
                  <th className="p-2.5">Cycle</th>
                  <th className="p-2.5">Next Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECURRING_BILLING_SCHEDULES.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-primary">{s.id}</td>
                    <td className="p-2.5 font-bold text-text-main">{s.customer}</td>
                    <td className="p-2.5 font-black text-text-main">${s.amount.toFixed(2)}</td>
                    <td className="p-2.5"><span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">{s.cycle}</span></td>
                    <td className="p-2.5 font-mono text-slate-600">{s.nextBillingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Notes Log */}
        <div className="bg-white rounded-xl border border-surface-soft shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-text-main text-sm">Credit Notes & Adjustments Reconciler</h3>
            <span className="text-xs text-text-muted font-mono">Partial Refunds Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-soft text-text-muted font-semibold bg-slate-50">
                  <th className="p-2.5">Note ID</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Credit Amount</th>
                  <th className="p-2.5">Proration Reason</th>
                  <th className="p-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CREDIT_NOTES_LOG.map(cn => (
                  <tr key={cn.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-emerald-600">{cn.id}</td>
                    <td className="p-2.5 font-bold text-text-main">{cn.customer}</td>
                    <td className="p-2.5 font-black text-emerald-700">${cn.amount.toFixed(2)}</td>
                    <td className="p-2.5 text-slate-600">{cn.reason}</td>
                    <td className="p-2.5 font-mono text-text-muted">{cn.issuedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
