import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';
import { useNotification } from '../contexts/NotificationContext';

export default function CustomerPortal() {
  const { showNotification } = useNotification();
  const { id: quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Counter Discount & Negotiation State
  const [counterDiscounts, setCounterDiscounts] = useState({});
  const [counterQuantities, setCounterQuantities] = useState({});
  const [isCounterSubmitted, setIsCounterSubmitted] = useState(false);

  // E-Signature state
  const [showSignModal, setShowSignModal] = useState(false);
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchQuotationAndMessages();
    const interval = setInterval(() => {
      fetchMessagesOnly();
    }, 3000);
    return () => clearInterval(interval);
  }, [quotationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessagesOnly = async () => {
    try {
      if (!quotationId) return;
      const msgRes = await api.get(`/quotations/${quotationId}/messages`);
      if (msgRes.data && msgRes.data.length > 0) {
        setMessages(msgRes.data);
      }
    } catch (err) {
      // silent fail during background polling
    }
  };

  const fetchQuotationAndMessages = async () => {
    try {
      if (!quotationId) return;
      const res = await api.get(`/quotations/${quotationId}`);
      if (res.data) {
        setQuotation(res.data);
      }
      try {
        const msgRes = await api.get(`/quotations/${quotationId}/messages`);
        if (msgRes.data && msgRes.data.length > 0) {
          setMessages(msgRes.data);
        } else {
          setMessages([
            { id: 1, sender_type: 'sales_rep', content: `Proposal #${quotationId.split('-')[0]} loaded. Feel free to review line items, propose counter discounts, or e-sign below.`, created_at: new Date().toISOString() }
          ]);
        }
      } catch (err) {
        setMessages([
          { id: 1, sender_type: 'sales_rep', content: `Proposal #${quotationId.split('-')[0]} loaded. Feel free to review line items, propose counter discounts, or e-sign below.`, created_at: new Date().toISOString() }
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setLoading(false);
    }
  };

  const handleCounterChange = (lineId, val) => {
    setCounterDiscounts(prev => ({ ...prev, [lineId]: parseFloat(val) || 0 }));
  };

  const handleQuantityChange = (lineId, val) => {
    const parsed = Math.max(1, parseInt(val, 10) || 1);
    setCounterQuantities(prev => ({ ...prev, [lineId]: parsed }));
  };

  const incrementQuantity = (lineId, currentQty) => {
    const activeQty = counterQuantities[lineId] !== undefined ? counterQuantities[lineId] : (Number(currentQty) || 1);
    handleQuantityChange(lineId, activeQty + 1);
  };

  const decrementQuantity = (lineId, currentQty) => {
    const activeQty = counterQuantities[lineId] !== undefined ? counterQuantities[lineId] : (Number(currentQty) || 1);
    if (activeQty > 1) {
      handleQuantityChange(lineId, activeQty - 1);
    }
  };

  const submitCounterProposal = async (e) => {
    e.preventDefault();
    if (!quotation || !quotation.lines) return;

    const payloadLines = quotation.lines.map(line => ({
      id: line.id,
      quantity: counterQuantities[line.id] !== undefined ? counterQuantities[line.id] : Number(line.quantity || 1),
      discountPercent: counterDiscounts[line.id] !== undefined ? counterDiscounts[line.id] : Number(line.discount_percent || 0)
    }));

    try {
      await api.put(`/quotations/${quotation.id}/counter`, { lines: payloadLines, status: 'pending_approval' });
      const refreshed = await api.get(`/quotations/${quotation.id}`);
      if (refreshed.data) {
        setQuotation(refreshed.data);
      }

      // Save persistent counter proposal message
      try {
        const msgRes = await api.post(`/quotations/${quotation.id}/messages`, {
          content: 'Submitted counter-proposal with revised quantity / discounts. Sent to Sales Manager for review.',
          sender_type: 'customer'
        });
        setMessages(prev => [...prev, msgRes.data]);
      } catch (mErr) {
        const newMsg = {
          id: Date.now(),
          sender_type: 'customer',
          content: `Submitted counter-proposal with revised quantity / discounts. Sent to Sales Manager for review.`,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
      }

      setIsCounterSubmitted(true);
      showNotification('success', 'Counter proposal with updated quantities and discounts submitted!');
    } catch (err) {
      console.error('Failed to submit counter proposal', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgContent = newMessage;
    setNewMessage('');

    try {
      const res = await api.post(`/quotations/${quotationId}/messages`, {
        content: msgContent,
        sender_type: 'customer'
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message:', err);
      const fallbackMsg = {
        id: Date.now(),
        sender_type: 'customer',
        content: msgContent,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches[0]?.clientY || 0) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches[0]?.clientY || 0) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const [isSigning, setIsSigning] = useState(false);

  const submitSignature = async () => {
    if (!quotation) return;
    try {
      setIsSigning(true);
      const quoteId = quotation.rawId || quotation.id;

      // Single authoritative confirm call
      await api.put(`/quotations/${quoteId}/confirm`);

      // Record acceptance message in discussion thread
      try {
        const msgRes = await api.post(`/quotations/${quoteId}/messages`, {
          content: 'Quotation digitally signed and accepted by customer.',
          sender_type: 'customer'
        });
        setMessages(prev => [...prev, msgRes.data]);
      } catch (mErr) {
        // non-blocking
      }

      try {
        const refreshed = await api.get(`/quotations/${quoteId}`);
        if (refreshed.data) {
          setQuotation(refreshed.data);
        } else {
          setQuotation(prev => ({ ...prev, status: 'confirmed' }));
        }
      } catch (rErr) {
        setQuotation(prev => ({ ...prev, status: 'confirmed' }));
      }

      showNotification('success', 'Quotation accepted and digitally signed! Sales manager and fulfillment team notified.');
      setShowSignModal(false);
    } catch (err) {
      console.error('Failed to sign quotation', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to confirm signature. Please check permissions.';
      showNotification('error', errMsg);
    } finally {
      setIsSigning(false);
    }
  };

  const calculateSubtotal = () => {
    if (!quotation || !quotation.lines) return 0;
    return quotation.lines.reduce((acc, line) => {
      const activeDisc = counterDiscounts[line.id] !== undefined ? counterDiscounts[line.id] : Number(line.discount_percent || 0);
      const activeQty = counterQuantities[line.id] !== undefined ? counterQuantities[line.id] : Number(line.quantity || 1);
      const net = (Number(line.unit_price) || 0) * (1 - activeDisc / 100);
      return acc + (net * activeQty);
    }, 0);
  };

  if (loading || !quotation) {
    return (
      <div className="flex justify-center items-center h-screen bg-white text-text-main">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  const subtotalAmount = calculateSubtotal();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Customer Portal Banner */}
      <header className="bg-white text-text-main border-b border-surface-soft sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center font-bold text-lg text-text-main">
              {quotation.company_name.charAt(0)}
            </div>
            <div>
              <span className="font-bold text-text-main text-base block leading-tight">{quotation.company_name || 'CyberCreatures'} Customer Portal</span>
              <span className="text-xs text-text-muted">Negotiable Digital Proposal {formatQuoteCode(quotation.id)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              quotation.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              quotation.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {quotation.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* STATUS BANNER: PENDING APPROVAL */}
        {quotation.status === 'pending_approval' && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-amber-800">
              <i className="fa-solid fa-triangle-exclamation text-xl text-amber-600"></i>
              <div>
                <h4 className="font-bold text-sm">Automated Governance Re-Approval Triggered</h4>
                <p className="text-xs text-amber-700">Your proposed counter discounts exceed standard tier limits. The quote has automatically re-entered the Sales Manager approval queue.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md">
              Risk Governance Active
            </span>
          </div>
        )}

        {/* STATUS BANNER: APPROVED */}
        {(quotation.status === 'approved' || quotation.status === 'accepted' || quotation.status === 'confirmed') && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-emerald-800">
              <i className="fa-solid fa-circle-check text-2xl text-emerald-600"></i>
              <div>
                <h4 className="font-bold text-sm">Quotation & Counter Offer Approved</h4>
                <p className="text-xs text-emerald-700">
                  {quotation.approval_history && quotation.approval_history.length > 0 && quotation.approval_history[0].reason
                    ? `Manager Note: "${quotation.approval_history[0].reason}"`
                    : 'Management has reviewed and approved the requested pricing and discount terms.'}
                </p>
                {quotation.approval_history && quotation.approval_history[0] && (
                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                    Approved by {quotation.approval_history[0].approver_name || 'Sales Manager'} on {new Date(quotation.approval_history[0].timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-md">
              Offer Approved
            </span>
          </div>
        )}

        {/* STATUS BANNER: REJECTED */}
        {quotation.status === 'rejected' && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-red-800">
              <i className="fa-solid fa-circle-xmark text-2xl text-red-600"></i>
              <div>
                <h4 className="font-bold text-sm text-red-900">Counter Offer / Quotation Rejected</h4>
                <p className="text-xs text-red-700">
                  {quotation.approval_history && quotation.approval_history.length > 0 && quotation.approval_history[0].reason
                    ? `Rejection Reason: "${quotation.approval_history[0].reason}"`
                    : 'Management has rejected the requested discount terms as they exceed company margin thresholds.'}
                </p>
                {quotation.approval_history && quotation.approval_history[0] && (
                  <span className="text-[11px] text-red-600 block mt-0.5">
                    Reviewed by {quotation.approval_history[0].approver_name || 'Sales Manager'} on {new Date(quotation.approval_history[0].timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-red-200 text-red-900 px-2.5 py-1 rounded-md">
              Proposal Rejected
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Line Items & Counter Discount Proposal Tool */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-surface-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Proposal Lines & Counter Offer Tool</h2>
                  <p className="text-xs text-text-muted">Propose counter discounts directly per line item</p>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                  Customer Tier: {quotation.customer_tier || 'Gold'}
                </span>
              </div>
              
              <div className="p-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-semibold text-text-muted border-b border-surface-soft">
                      <th className="pb-3">Product / Service</th>
                      <th className="pb-3 text-center">Qty</th>
                      <th className="pb-3 text-right">Current Disc %</th>
                      <th className="pb-3 text-right">Propose Counter %</th>
                      <th className="pb-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotation.lines.map(line => {
                      const activeQty = counterQuantities[line.id] !== undefined ? counterQuantities[line.id] : Number(line.quantity || 1);
                      const activeDiscount = counterDiscounts[line.id] !== undefined ? counterDiscounts[line.id] : line.discount_percent;
                      const netPrice = line.unit_price * (1 - activeDiscount / 100);
                      const isLocked = quotation.status === 'accepted' || quotation.status === 'confirmed';

                      return (
                        <tr key={line.id}>
                          <td className="py-4">
                            <p className="font-semibold text-slate-800 text-sm">{line.product_name}</p>
                            <span className="text-[11px] text-text-muted">{line.category} ({line.line_type})</span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="inline-flex items-center border border-surface-soft rounded-lg bg-slate-50 overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => decrementQuantity(line.id, line.quantity)}
                                disabled={activeQty <= 1 || isLocked}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Decrease Quantity"
                              >
                                <i className="fa-solid fa-minus text-[10px]"></i>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={activeQty}
                                onChange={(e) => handleQuantityChange(line.id, e.target.value)}
                                disabled={isLocked}
                                className="w-10 text-center font-bold text-text-main text-xs bg-transparent border-0 focus:ring-0 p-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => incrementQuantity(line.id, line.quantity)}
                                disabled={isLocked}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Increase Quantity"
                              >
                                <i className="fa-solid fa-plus text-[10px]"></i>
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right text-text-muted text-sm font-mono">{line.discount_percent}%</td>
                          <td className="py-4 text-right">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              disabled={isLocked}
                              className="w-20 text-right bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
                              value={activeDiscount}
                              onChange={(e) => handleCounterChange(line.id, e.target.value)}
                            />
                          </td>
                          <td className="py-4 text-right font-bold text-text-main text-sm">
                            ${(netPrice * activeQty).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-text-muted">Modify quantity or discount above to propose a counter offer</span>
                  <button 
                    onClick={submitCounterProposal}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors flex items-center"
                  >
                    <i className="fa-solid fa-calculator mr-2"></i> Submit Counter Proposal
                  </button>
                </div>
              </div>
            </div>

            {/* Manager Decision & Governance Audit History */}
            {quotation.approval_history && quotation.approval_history.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-surface-soft overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center">
                    <i className="fa-solid fa-shield-halved mr-2 text-indigo-600"></i>
                    Manager Approval / Rejection Decision History
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Audit Log ({quotation.approval_history.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {quotation.approval_history.map(log => {
                    const isApprove = log.action === 'approve' || log.action === 'approved';
                    const isReject = log.action === 'reject' || log.action === 'rejected';
                    return (
                      <div key={log.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isApprove ? 'bg-emerald-100 text-emerald-800' :
                              isReject ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {log.approver_name || 'Sales Manager'}
                            </span>
                          </div>
                          {log.reason && (
                            <p className="text-xs text-slate-600 italic">"{log.reason}"</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Negotiation Chat */}
            <div className="bg-white rounded-xl shadow-sm border border-surface-soft overflow-hidden flex flex-col h-[420px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                  <i className="fa-regular fa-comments mr-2 text-primary"></i>
                  Live Deal Discussion & Audit Thread
                </h3>
                <span className="text-[11px] text-text-muted">Encrypted Portal Session</span>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.sender_type === 'customer' 
                        ? 'bg-primary text-white rounded-tr-sm font-medium' 
                        : 'bg-white border border-surface-soft text-slate-800 rounded-tl-sm font-medium'
                    }`}>
                      <p className={`text-sm ${msg.sender_type === 'customer' ? 'text-white' : 'text-slate-800'}`}>{msg.content || msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.sender_type === 'customer' ? 'text-white/80' : 'text-text-muted'}`}>
                        {msg.created_at || msg.timestamp ? new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input 
                    type="text" 
                    className="input-field flex-1" 
                    placeholder="Ask a line item question or request clarifications..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="bg-white hover:bg-surface-soft text-text-main px-4 py-2 rounded-lg transition-colors">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar Summary & E-Sign Action */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-surface-soft p-6 sticky top-24 space-y-6">
              <h3 className="text-lg font-bold text-text-main">Financial Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount</span>
                  <span className="font-semibold text-slate-800">${subtotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="border-t border-surface-soft pt-4">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-700 text-sm">Total Due Today</span>
                  <span className="text-2xl font-black text-text-main">${subtotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {quotation.status !== 'accepted' && quotation.status !== 'confirmed' ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => setShowSignModal(true)}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex justify-center items-center text-sm"
                  >
                    <i className="fa-solid fa-pen-nib mr-2"></i> E-Sign & Accept Proposal
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <i className="fa-solid fa-circle-check text-emerald-status text-3xl mb-2"></i>
                  <h4 className="font-bold text-emerald-800 text-sm">Quotation Accepted & E-Signed</h4>
                  <p className="text-xs text-emerald-700 mt-1">Confirmed contract terms saved into fulfillment queue.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>

      {/* E-Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-surface-soft">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">Legal E-Signature</h3>
              <button onClick={() => setShowSignModal(false)} className="text-text-muted hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <p className="text-text-muted text-xs">Draw your signature inside the box to accept terms for Proposal {formatQuoteCode(quotation.id)}.</p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden touch-none">
              <canvas 
                ref={canvasRef}
                width={450}
                height={180}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              ></canvas>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <button onClick={clearSignature} disabled={isSigning} className="text-text-muted hover:text-slate-700 text-xs font-semibold">
                <i className="fa-solid fa-eraser mr-1"></i> Clear Canvas
              </button>
              <div className="space-x-2">
                <button onClick={() => setShowSignModal(false)} disabled={isSigning} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button 
                  onClick={submitSignature} 
                  disabled={isSigning}
                  className="btn-primary text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSigning ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i> Confirming...
                    </>
                  ) : (
                    'Confirm Signature'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
