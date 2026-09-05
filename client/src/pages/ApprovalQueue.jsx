import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { useAlert } from '../contexts/AlertContext';

export default function ApprovalQueue() {
  const { showNotification } = useNotification();
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [reason, setReason] = useState('');
  const [messagesMap, setMessagesMap] = useState({});
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/approvals/pending');
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to fetch approvals', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      try {
        const msgRes = await api.get(`/quotations/${id}/messages`);
        setMessagesMap(prev => ({ ...prev, [id]: msgRes.data || [] }));
      } catch (err) {
        console.error('Failed to fetch messages for quote:', id);
      }
    }
  };

  const handleSendReply = async (quoteId) => {
    const text = replyText[quoteId];
    if (!text || !text.trim()) return;
    setReplyText(prev => ({ ...prev, [quoteId]: '' }));
    try {
      const res = await api.post(`/quotations/${quoteId}/messages`, {
        content: text,
        sender_type: 'rep'
      });
      setMessagesMap(prev => ({ ...prev, [quoteId]: [...(prev[quoteId] || []), res.data] }));
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  const handleAction = async (quotationId, action) => {
    if ((action === 'reject' || action === 'return') && !reason) {
      showAlert('Action Required', `Please provide a reason for ${action === 'reject' ? 'rejection' : 'returning'}.`, 'warning');
      return;
    }

    try {
      await api.post(`/approvals/${quotationId}/action`, { action, reason });
      showNotification('success', `Quotation ${action}ed successfully.`);
      setReason('');
      setExpandedId(null);
      fetchApprovals();
    } catch (error) {
      console.error(`Failed to ${action} quotation`, error);
      showNotification('error', 'Action failed.');
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
        <p className="text-text-muted">Review quotations that exceeded discount ceilings.</p>
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
                  <th className="px-6 py-4">Quotation ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Sales Rep</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Blended Risk Score</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((approval) => (
                  <React.Fragment key={approval.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-text-muted">{approval.id.split('-')[0]}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{approval.customer_name}</td>
                      <td className="px-6 py-4 text-slate-600">{approval.rep_name}</td>
                      <td className="px-6 py-4 text-text-muted text-sm">{new Date(approval.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>{parseFloat(approval.blended_risk_score).toFixed(2)}%</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleExpand(approval.id)}
                          className="text-text-muted hover:text-primary px-3 py-1 font-semibold text-xs border border-surface-soft rounded-lg bg-white shadow-xs"
                        >
                          {expandedId === approval.id ? 'Hide Details' : 'View Details & Chat'}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === approval.id && (
                      <tr className="bg-slate-50 border-b-2 border-surface-soft">
                        <td colSpan="6" className="px-6 py-6 space-y-5">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Line Items Causing Risk</h4>
                            <div className="bg-white rounded-xl border border-surface-soft p-4 shadow-2xs">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="text-text-muted border-b border-slate-100 font-semibold">
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2">Qty</th>
                                    <th className="pb-2 text-right">Unit Price</th>
                                    <th className="pb-2 text-right">Discount Given</th>
                                    <th className="pb-2 text-right text-red-500">Margin Impact</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {approval.lines.map(line => (
                                    <tr key={line.id}>
                                      <td className="py-2 font-bold text-slate-800">{line.product_name} <span className="text-[10px] font-normal text-text-muted block">{line.category}</span></td>
                                      <td className="py-2 text-slate-600">{line.quantity}</td>
                                      <td className="py-2 text-slate-600 text-right">${parseFloat(line.unit_price).toFixed(2)}</td>
                                      <td className="py-2 text-right">
                                        <span className="font-bold text-slate-800">{parseFloat(line.discount_percent)}%</span>
                                      </td>
                                      <td className="py-2 text-right">
                                        {parseFloat(line.discount_percent) > parseFloat(line.margin_percent) / 2 ? (
                                          <i className="fa-solid fa-circle text-red-500 text-xs"></i>
                                        ) : (
                                          <i className="fa-solid fa-circle text-yellow-500 text-xs"></i>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Customer Live Discussion Thread */}
                          <div className="bg-white rounded-xl border border-surface-soft p-4 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-surface-soft pb-2">
                              <div className="flex items-center space-x-2">
                                <i className="fa-solid fa-comments text-purple-600 text-sm"></i>
                                <span className="font-extrabold text-text-main text-xs">Customer Discussion &amp; Counter-Offer Log</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                Live Portal Stream
                              </span>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2.5 p-3 bg-slate-50 rounded-xl border border-surface-soft">
                              {(!messagesMap[approval.id] || messagesMap[approval.id].length === 0) ? (
                                <p className="text-[11px] text-text-muted text-center py-4">No negotiation messages posted by customer yet.</p>
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
                                          {msg.created_at || msg.timestamp ? new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                      </div>
                                      <div className={`p-2.5 rounded-xl text-xs max-w-sm ${
                                        isCust 
                                          ? 'bg-white text-slate-800 border border-surface-soft rounded-tl-none font-medium' 
                                          : 'bg-primary text-text-main text-white font-bold rounded-tr-none shadow-xs'
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
                                placeholder="Reply to customer proposal..."
                                className="flex-1 bg-slate-50 border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={replyText[approval.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [approval.id]: e.target.value })}
                              />
                              <button
                                type="button"
                                onClick={() => handleSendReply(approval.id)}
                                className="px-3.5 py-1.5 bg-primary text-text-main text-white text-xs font-bold rounded-xl shadow hover:bg-primary-dark transition-all flex items-center space-x-1"
                              >
                                <span>Reply</span>
                                <i className="fa-solid fa-paper-plane text-[10px]"></i>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4 items-end justify-between border-t border-surface-soft pt-4 mt-2">
                            <div className="w-full md:w-1/2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Approval Decision Note (required for Reject/Return)</label>
                              <textarea 
                                className="w-full bg-white border border-surface-soft rounded-xl p-2 text-xs text-slate-800 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary" 
                                placeholder="E.g., Approved requested 12% discount based on enterprise commitment..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                              ></textarea>
                            </div>
                            <div className="flex space-x-2 w-full md:w-auto mt-3 md:mt-0">
                              <button onClick={() => handleAction(approval.id, 'return')} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center">
                                <i className="fa-solid fa-rotate-left mr-1.5"></i>Return to Rep
                              </button>
                              <button onClick={() => handleAction(approval.id, 'reject')} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center">
                                <i className="fa-solid fa-xmark mr-1.5"></i>Reject
                              </button>
                              <button onClick={() => handleAction(approval.id, 'approve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center">
                                <i className="fa-solid fa-check mr-1.5"></i>Approve Quote
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
