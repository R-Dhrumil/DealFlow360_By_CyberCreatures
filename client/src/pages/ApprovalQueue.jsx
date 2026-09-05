import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { useAlert } from '../contexts/AlertContext';
import { useCurrency } from '../contexts/CurrencyContext';

const APPROVAL_LEVEL_META = {
  pending_approval: { label: 'Manager Review', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'fa-user-tie' },
  pending_finance_approval: { label: 'Finance Review', cls: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'fa-chart-line' },
  pending_admin_approval: { label: 'Admin Approval Required', cls: 'bg-rose-100 text-rose-700 border-rose-200', icon: 'fa-shield-halved' },
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: 'fa-pen' },
};

export default function ApprovalQueue() {
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [reason, setReason] = useState('');
  const [messagesMap, setMessagesMap] = useState({});
  const [replyText, setReplyText] = useState({});
  // Inline modify state: { [quotationId]: { [lineId]: discount } }
  const [modifyMode, setModifyMode] = useState({});
  const [modifiedDiscounts, setModifiedDiscounts] = useState({});

  const fetchApprovals = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get('/approvals/pending');
      setApprovals(response.data);
    } catch (error) {
      if (!silent) console.error('Failed to fetch approvals', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(() => fetchApprovals(true), 4000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  useEffect(() => {
    if (!expandedId) return;
    const fetchMsgs = async () => {
      try {
        const msgRes = await api.get(`/quotations/${expandedId}/messages`);
        if (msgRes.data) setMessagesMap(prev => ({ ...prev, [expandedId]: msgRes.data }));
      } catch {}
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [expandedId]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    try {
      const msgRes = await api.get(`/quotations/${id}/messages`);
      setMessagesMap(prev => ({ ...prev, [id]: msgRes.data || [] }));
    } catch {}
  };

  const handleSendReply = async (quoteId) => {
    const text = replyText[quoteId];
    if (!text?.trim()) return;
    setReplyText(prev => ({ ...prev, [quoteId]: '' }));
    try {
      const res = await api.post(`/quotations/${quoteId}/messages`, { content: text, sender_type: 'rep' });
      setMessagesMap(prev => ({ ...prev, [quoteId]: [...(prev[quoteId] || []), res.data] }));
    } catch {}
  };

  const handleAction = async (quotationId, action) => {
    if ((action === 'reject' || action === 'return') && !reason) {
      showAlert('Action Required', `Please provide a reason for ${action === 'reject' ? 'rejection' : 'returning'}.`, 'warning');
      return;
    }

    // Build modifiedLines if we're in modify mode for this quotation
    const approval = approvals.find(a => a.id === quotationId);
    let modifiedLines = null;
    if (modifyMode[quotationId] && modifiedDiscounts[quotationId]) {
      modifiedLines = (approval?.lines || []).map(l => ({
        id: l.id,
        discountPercent: modifiedDiscounts[quotationId][l.id] !== undefined
          ? modifiedDiscounts[quotationId][l.id]
          : parseFloat(l.discount_percent)
      }));
      action = 'modify_and_approve';
    }

    try {
      await api.post(`/approvals/${quotationId}/action`, { action, reason, modifiedLines });
      showNotification('success', `Quotation action '${action.replace(/_/g, ' ')}' completed.`);
      setReason('');
      setExpandedId(null);
      setModifyMode(prev => { const n = {...prev}; delete n[quotationId]; return n; });
      setModifiedDiscounts(prev => { const n = {...prev}; delete n[quotationId]; return n; });
      fetchApprovals();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Action failed.');
    }
  };

  const toggleModifyMode = (quotationId, lines) => {
    setModifyMode(prev => {
      if (prev[quotationId]) {
        const n = {...prev}; delete n[quotationId]; return n;
      }
      // Pre-fill with current discounts
      const initial = {};
      (lines || []).forEach(l => { initial[l.id] = parseFloat(l.discount_percent); });
      setModifiedDiscounts(prev2 => ({ ...prev2, [quotationId]: initial }));
      return { ...prev, [quotationId]: true };
    });
  };

  const updateModifiedDiscount = (quotationId, lineId, value) => {
    setModifiedDiscounts(prev => ({
      ...prev,
      [quotationId]: { ...(prev[quotationId] || {}), [lineId]: parseFloat(value) || 0 }
    }));
  };

  const fmt = (n) => formatMoney(n);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Approval Queue</h1>
        <p className="text-text-muted">Review quotations requiring discount authority or floor price approval.</p>
      </header>

      {approvals.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-check-circle text-green-500 text-5xl mb-4"></i>
          <h3 className="text-lg font-medium text-slate-800">All caught up!</h3>
          <p className="text-text-muted mt-2">There are no quotations pending your approval right now.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-surface-soft">
                <tr className="text-sm font-medium text-slate-600">
                  <th className="px-6 py-4">Quotation</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Sales Rep</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">Approval Level</th>
                  <th className="px-6 py-4 text-center">Risk Score</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((approval) => {
                  const meta = APPROVAL_LEVEL_META[approval.status] || APPROVAL_LEVEL_META['draft'];
                  const totalAmount = parseFloat(approval.total_amount || 0);
                  const maxDiscount = parseFloat(approval.max_discount_applied || 0);

                  return (
                    <React.Fragment key={approval.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-700 font-bold">{approval.id}</span>
                          {approval.inquiry_id && (
                            <span className="block text-[10px] text-blue-500 font-semibold mt-0.5">
                              <i className="fa-solid fa-link mr-1"></i>Inquiry: {approval.inquiry_id}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-800">{approval.customer_name}</span>
                          {approval.customer_tier && (
                            <span className="ml-2 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                              {approval.customer_tier}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {approval.rep_name}
                          <span className="block text-[10px] text-slate-400">{approval.rep_role?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 text-sm">{fmt(totalAmount)}</span>
                          {maxDiscount > 0 && (
                            <span className="block text-[10px] text-amber-600 font-semibold">Max Discount: {maxDiscount.toFixed(1)}%</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
                            <i className={`fa-solid ${meta.icon} text-[10px]`}></i>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span>{parseFloat(approval.blended_risk_score).toFixed(2)}%</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* <button
                            onClick={() => toggleExpand(approval.id)}
                            className="text-text-muted hover:text-primary px-3 py-1 font-semibold text-xs border border-surface-soft rounded-lg bg-white shadow-xs"
                          >
                            {expandedId === approval.id ? 'Hide' : 'Review & Decide'}
                          </button> */}
                        </td>
                      </tr>

                      {expandedId === approval.id && (
                        <tr className="bg-slate-50 border-b-2 border-surface-soft">
                          <td colSpan="7" className="px-6 py-6 space-y-5">

                            {/* ── Line Items Table with optional inline modify ── */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  Line Items
                                </h4>
                                <button
                                  onClick={() => toggleModifyMode(approval.id, approval.lines)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                    modifyMode[approval.id]
                                      ? 'bg-primary text-white'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  }`}
                                >
                                  <i className="fa-solid fa-pen-to-square mr-1.5"></i>
                                  {modifyMode[approval.id] ? 'Editing Mode' : 'Modify Discounts'}
                                </button>
                              </div>
                              <div className="bg-white rounded-xl border border-surface-soft p-4 shadow-2xs">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="text-text-muted border-b border-slate-100 font-semibold">
                                      <th className="pb-2">Product</th>
                                      <th className="pb-2">Qty</th>
                                      <th className="pb-2 text-right">Unit Price</th>
                                      <th className="pb-2 text-right">Floor Price</th>
                                      <th className="pb-2 text-right">Discount</th>
                                      <th className="pb-2 text-right">Net Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {(approval.lines || []).map(line => {
                                      const currentDiscount = modifyMode[approval.id]
                                        ? (modifiedDiscounts[approval.id]?.[line.id] ?? parseFloat(line.discount_percent))
                                        : parseFloat(line.discount_percent);
                                      const netPrice = parseFloat(line.unit_price) * (1 - currentDiscount / 100);
                                      const floorPrice = line.floor_price ? parseFloat(line.floor_price) : null;
                                      const belowFloor = floorPrice !== null && netPrice < floorPrice;

                                      return (
                                        <tr key={line.id}>
                                          <td className="py-2 font-bold text-slate-800">
                                            {line.product_name}
                                            <span className="text-[10px] font-normal text-text-muted block">{line.category}</span>
                                          </td>
                                          <td className="py-2 text-slate-600">{line.quantity}</td>
                                          <td className="py-2 text-slate-600 text-right">{fmt(line.unit_price)}</td>
                                          <td className="py-2 text-right">
                                            {floorPrice
                                              ? <span className={`font-bold ${belowFloor ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(floorPrice)}</span>
                                              : <span className="text-slate-300">—</span>
                                            }
                                          </td>
                                          <td className="py-2 text-right">
                                            {modifyMode[approval.id] ? (
                                              <input
                                                type="number"
                                                min="0" max="100" step="0.5"
                                                className={`w-20 px-2 py-1 text-xs border rounded-lg font-bold outline-none text-right ${
                                                  belowFloor ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                                                }`}
                                                value={currentDiscount}
                                                onChange={e => updateModifiedDiscount(approval.id, line.id, e.target.value)}
                                              />
                                            ) : (
                                              <span className="font-bold text-slate-800">{currentDiscount.toFixed(1)}%</span>
                                            )}
                                          </td>
                                          <td className="py-2 text-right">
                                            <span className={`font-bold ${belowFloor ? 'text-rose-600' : 'text-slate-800'}`}>
                                              {fmt(netPrice * line.quantity)}
                                            </span>
                                            {belowFloor && (
                                              <span className="block text-[9px] text-rose-500 font-bold">⚠ Below floor</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* ── Negotiation Thread ── */}
                            <div className="bg-white rounded-xl border border-surface-soft p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-surface-soft pb-2">
                                <div className="flex items-center space-x-2">
                                  <i className="fa-solid fa-comments text-purple-600 text-sm"></i>
                                  <span className="font-extrabold text-text-main text-xs">Customer Discussion & Counter-Offer Log</span>
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2.5 p-3 bg-slate-50 rounded-xl border border-surface-soft">
                                {(!messagesMap[approval.id] || messagesMap[approval.id].length === 0) ? (
                                  <p className="text-[11px] text-text-muted text-center py-4">No negotiation messages yet.</p>
                                ) : (
                                  messagesMap[approval.id].map((msg, mIdx) => {
                                    const isCust = msg.sender_type === 'customer';
                                    return (
                                      <div key={msg.id || mIdx} className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}>
                                        <div className="flex items-center space-x-1 mb-0.5">
                                          <span className={`text-[9px] font-bold ${isCust ? 'text-amber-700' : 'text-purple-700'}`}>
                                            {isCust ? `Customer (${approval.customer_name})` : 'Manager / Rep'}
                                          </span>
                                          <span className="text-[8px] text-text-muted">
                                            {msg.created_at || msg.timestamp
                                              ? new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          </span>
                                        </div>
                                        <div className={`p-2.5 rounded-xl text-xs max-w-sm ${
                                          isCust
                                            ? 'bg-white text-slate-800 border border-surface-soft rounded-tl-none font-medium'
                                            : 'bg-primary text-white font-bold rounded-tr-none shadow-xs'
                                        }`}>
                                          {msg.content || msg.message}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Reply to customer..."
                                  className="flex-1 bg-slate-50 border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                  value={replyText[approval.id] || ''}
                                  onChange={(e) => setReplyText({ ...replyText, [approval.id]: e.target.value })}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(approval.id)}
                                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-dark transition-all"
                                >
                                  Reply <i className="fa-solid fa-paper-plane text-[10px] ml-1"></i>
                                </button>
                              </div>
                            </div>

                            {/* ── Action Buttons ── */}
                            <div className="flex flex-col md:flex-row gap-4 items-end justify-between border-t border-surface-soft pt-4">
                              <div className="w-full md:w-1/2">
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Decision Note (required for Reject/Return)
                                </label>
                                <textarea
                                  className="w-full bg-white border border-surface-soft rounded-xl p-2 text-xs text-slate-800 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="E.g., Approved with revised 12% discount based on volume commitment..."
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <button
                                  onClick={() => handleAction(approval.id, 'return')}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center"
                                >
                                  <i className="fa-solid fa-rotate-left mr-1.5"></i>Return to Rep
                                </button>
                                <button
                                  onClick={() => handleAction(approval.id, 'reject')}
                                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center"
                                >
                                  <i className="fa-solid fa-xmark mr-1.5"></i>Reject
                                </button>
                                <button
                                  onClick={() => handleAction(approval.id, modifyMode[approval.id] ? 'modify_and_approve' : 'approve')}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center shadow"
                                >
                                  <i className={`fa-solid ${modifyMode[approval.id] ? 'fa-pen-check' : 'fa-check'} mr-1.5`}></i>
                                  {modifyMode[approval.id] ? 'Modify & Approve' : 'Approve Quote'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
