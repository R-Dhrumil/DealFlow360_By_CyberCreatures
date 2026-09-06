import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';



export default function FinanceOperations() {
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();
  const [approvals, setApprovals] = useState([]);
  const [billingSchedules, setBillingSchedules] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);

  useEffect(() => {
    fetchApprovals();
    fetchBillingSchedules();
    fetchCreditNotes();
  }, []);

  const fetchBillingSchedules = async () => {
    try {
      const res = await api.get('/finance/billing-schedules');
      setBillingSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch billing schedules:', err);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      const res = await api.get('/finance/credit-notes');
      setCreditNotes(res.data || []);
    } catch (err) {
      console.error('Failed to fetch credit notes:', err);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals/pending');
      // Finance operations is mainly interested in pending_finance_approval
      const financeApprovals = res.data?.filter(a => a.status === 'pending_finance_approval') || [];
      setApprovals(financeApprovals);
    } catch (err) {
      console.error('Failed to fetch finance approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceAction = async (quoteId, action) => {
    let reason = `Finance ${action} action recorded.`;
    if (action === 'reject') {
      const input = window.prompt("Enter reason for rejection:");
      if (input === null) return; // cancelled
      if (!input.trim()) {
        showNotification('error', 'Reason is required for rejection.');
        return;
      }
      reason = input.trim();
    }

    try {
      await api.post(`/approvals/${quoteId}/action`, { action, reason });
      showNotification('success', `Finance ${action} action recorded for Quote ${quoteId}! Reconciled in accounting ledger.`);
      fetchApprovals();
    } catch (err) {
      showNotification('error', err.response?.data?.error || 'Failed to process action.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Finance & Operations Control Center</h1>
          <p className="text-sm text-text-muted">2nd-Level High-Risk Approvals, Billing Schedules, Proration & Credit Notes Reconciliation</p>
        </div>

        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-lg text-xs font-bold font-mono">
          <i className="fa-solid fa-coins mr-1 text-emerald-700"></i> Finance Authority Active
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

        {loading ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-surface-soft rounded-xl">
            <i className="fa-solid fa-spinner fa-spin text-primary text-3xl mb-2"></i>
            <p className="text-slate-700 font-semibold text-sm">Loading queue...</p>
          </div>
        ) : approvals.length > 0 ? (
          <div className="space-y-3">
            {approvals.map(app => (
              <div key={app.id} className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-purple-700 text-sm">{app.id}</span>
                    <span className="font-bold text-text-main text-sm">{app.customer_name}</span>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Risk: {Number(app.blended_risk_score || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Rep: <strong>{app.sales_rep_name}</strong> &bull; Total Value: <strong>{formatMoney(app.total_amount)}</strong></p>
                  <p className="text-xs text-purple-900 italic">
                    <i className="fa-solid fa-circle-info mr-1"></i> Awaiting final finance authorization due to high risk profile.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFinanceAction(app.id, 'approve')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    <i className="fa-solid fa-check mr-1"></i> Authorize Discount
                  </button>
                  <button
                    onClick={() => handleFinanceAction(app.id, 'reject')}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
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
              <tbody>
                {billingSchedules.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-xs text-text-muted">No pending billing schedules.</td></tr>
                ) : (
                  billingSchedules.map(bs => (
                    <tr key={bs.id} className="border-b border-surface-soft hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono text-purple-600 font-bold">{bs.id}</td>
                      <td className="p-2.5 font-semibold text-text-main">
                        {bs.customer_name} 
                        <div className="text-[10px] text-text-muted font-normal mt-0.5">Ref: {bs.quotation_id}</div>
                      </td>
                      <td className="p-2.5 font-black text-slate-800">{formatMoney(bs.amount)}</td>
                      <td className="p-2.5 text-xs text-slate-600">{bs.billing_date ? new Date(bs.billing_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bs.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                          {bs.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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
              <tbody>
                {creditNotes.length === 0 ? (
                  <tr><td colSpan="4" className="p-4 text-center text-xs text-text-muted">No credit notes issued.</td></tr>
                ) : (
                  creditNotes.map(cn => (
                    <tr key={cn.id} className="border-b border-surface-soft hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono text-rose-600 font-bold">{cn.id}</td>
                      <td className="p-2.5 font-semibold text-text-main">
                        {cn.customer_name} 
                        <div className="text-[10px] text-text-muted font-normal mt-0.5">Ref: {cn.quotation_id}</div>
                      </td>
                      <td className="p-2.5 font-black text-rose-600">{formatMoney(cn.amount)}</td>
                      <td className="p-2.5 text-[10px] text-slate-600">
                        {new Date(cn.issued_date).toLocaleDateString()}
                        <div className="mt-0.5 text-slate-500">{cn.reason}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
