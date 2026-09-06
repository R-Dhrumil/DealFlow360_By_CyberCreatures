import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { copyTextToClipboard } from '../utils/clipboard';
import { useCurrency } from '../contexts/CurrencyContext';
import { useVisibleInterval } from '../hooks/useVisibleInterval';

export default function QuotationView() {
  const { user } = useAuth();
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();
  const { id: quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = async () => {
    try {
      if (!quotationId) return;
      const res = await api.get(`/quotations/${quotationId}/messages`);
      if (res.data) setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch quotation messages:', err);
    }
  };

  useEffect(() => {
    fetchQuotation();
    fetchMessages();
  }, [quotationId]);

  useVisibleInterval(fetchMessages, quotationId ? 3000 : null);

  const fetchQuotation = async () => {
    try {
      if (!quotationId) return;
      const res = await api.get(`/quotations/${quotationId}`);
      if (res.data) {
        setQuotation(res.data);
      } else {
        setQuotation({
          id: quotationId,
          status: 'approved',
          customer_name: 'Acme Corp',
          created_at: new Date().toISOString(),
          lines: [
            { id: 1, product_name: 'Enterprise Server X1', category: 'Hardware', line_type: 'one_time', quantity: 2, unit_price: 5000, discount_percent: 10 },
            { id: 2, product_name: 'Implementation Services', category: 'Services', line_type: 'one_time', quantity: 1, unit_price: 2500, discount_percent: 0 },
            { id: 3, product_name: 'SaaS Platform License', category: 'Software', line_type: 'recurring', quantity: 50, unit_price: 100, discount_percent: 15 },
            { id: 4, product_name: 'Premium Support', category: 'Software', line_type: 'recurring', quantity: 1, unit_price: 1000, discount_percent: 5 },
          ]
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch quotation', error);
      setQuotation({
        id: quotationId,
        status: 'approved',
        customer_name: 'Acme Corp',
        created_at: new Date().toISOString(),
        lines: [
          { id: 1, product_name: 'Enterprise Server X1', category: 'Hardware', line_type: 'one_time', quantity: 2, unit_price: 5000, discount_percent: 10 },
          { id: 2, product_name: 'Implementation Services', category: 'Services', line_type: 'one_time', quantity: 1, unit_price: 2500, discount_percent: 0 },
          { id: 3, product_name: 'SaaS Platform License', category: 'Software', line_type: 'recurring', quantity: 50, unit_price: 100, discount_percent: 15 },
          { id: 4, product_name: 'Premium Support', category: 'Software', line_type: 'recurring', quantity: 1, unit_price: 1000, discount_percent: 5 },
        ]
      });
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msgText = newMessage;
    setNewMessage('');
    try {
      const res = await api.post(`/quotations/${quotationId}/messages`, {
        content: msgText,
        sender_type: 'rep'
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message:', err);
      const fallbackMsg = {
        id: Date.now(),
        sender_type: 'rep',
        content: msgText,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  if (!quotation) return <div>Quotation not found</div>;

  // Split lines into one-time and recurring
  const oneTimeLines = quotation.lines ? quotation.lines.filter(l => l.line_type === 'one_time') : [];
  const recurringLines = quotation.lines ? quotation.lines.filter(l => l.line_type === 'recurring') : [];

  const calculateTotal = (lines) => {
    if (!lines || !Array.isArray(lines)) return 0;
    return lines.reduce((total, line) => {
      const uPrice = Number(line.unit_price) || 0;
      const dPercent = Number(line.discount_percent) || 0;
      const qty = Number(line.quantity) || 1;
      const netPrice = uPrice * (1 - dPercent / 100);
      return total + (netPrice * qty);
    }, 0);
  };

  const oneTimeTotal = calculateTotal(oneTimeLines);
  const recurringTotal = calculateTotal(recurringLines);

  const isPendingApproval = ['pending_approval', 'pending_finance_approval', 'pending_admin_approval', 'draft'].includes(quotation.status);

  // Determine if the currently logged in user is authorized to approve this quotation level
  const canApprove = () => {
    if (!user || !isPendingApproval) return false;
    const role = user.role;
    if (['admin', 'super_admin'].includes(role)) return true;
    if (quotation.status === 'pending_admin_approval') return false; // Floor price override strictly requires Admin
    if (quotation.status === 'pending_finance_approval') {
      return ['finance_manager', 'finance'].includes(role);
    }
    if (quotation.status === 'pending_approval' || quotation.status === 'draft') {
      return ['sales_manager', 'finance_manager', 'finance'].includes(role);
    }
    return false;
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      const res = await api.put(`/quotations/${quotationId}/approve`);
      const updated = await api.get(`/quotations/${quotationId}`);
      if (updated.data) setQuotation(updated.data);
      showNotification('success', res.data?.message || 'Quotation approved successfully!', 5000, '✅ Proposal Approved');
    } catch (err) {
      console.error('Failed to approve quotation:', err);
      showNotification('error', err.response?.data?.error || 'Failed to approve quotation.', 6000, '❌ Approval Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return;
    try {
      setIsProcessing(true);
      const res = await api.put(`/quotations/${quotationId}/reject`, { reason });
      const updated = await api.get(`/quotations/${quotationId}`);
      if (updated.data) setQuotation(updated.data);
      showNotification('success', res.data?.message || 'Quotation rejected.', 5000, 'Rejection Recorded');
    } catch (err) {
      console.error('Failed to reject quotation:', err);
      showNotification('error', err.response?.data?.error || 'Failed to reject quotation.', 6000, '❌ Rejection Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-6">
      <header className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/app/approvals'}
            className="mb-3 px-3.5 py-1.5 rounded-xl bg-white border border-surface-soft text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
            <span>Back to Approvals</span>
          </button>
          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-1">
            <h1 className="text-2xl font-bold text-slate-800">Quotation #{formatQuoteCode(quotation.id)}</h1>
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider print:hidden ${
              quotation.status === 'approved' || quotation.status === 'accepted' || quotation.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
              quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
              quotation.status === 'pending_admin_approval' ? 'bg-rose-100 text-rose-800' :
              quotation.status === 'pending_finance_approval' ? 'bg-orange-100 text-orange-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {quotation.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-text-muted text-xs">Prepared for <span className="font-semibold text-slate-700">{quotation.customer_name || 'Customer'}</span> &bull; Account Rep: <span className="font-semibold text-slate-700">{quotation.sales_rep_name || 'Sales Rep'}</span></p>
        </div>
        <div className="flex space-x-2 flex-wrap gap-y-2 print:hidden items-center">
          {isPendingApproval && canApprove() && (
            <>
              <button
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>{isProcessing ? 'Processing...' : 'Approve Proposal'}</span>
              </button>
              <button
                disabled={isProcessing}
                onClick={handleReject}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-circle-xmark"></i>
                <span>Reject</span>
              </button>
            </>
          )}
          <Link to={`/portal/${quotation.id}`} target="_blank" className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5">
            <i className="fa-solid fa-external-link"></i>
            <span>Public Demo Link</span>
          </Link>
          <button 
            type="button"
            onClick={async () => {
              const publicUrl = `${window.location.origin}/portal/${quotation.id}`;
              const success = await copyTextToClipboard(publicUrl);
              if (success) {
                setCopied(true);
                showNotification('success', 'Public quotation link copied to clipboard!');
                setTimeout(() => setCopied(false), 2000);
              } else {
                showNotification('error', 'Could not copy link to clipboard. Please copy manually.');
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              copied ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button onClick={() => window.print()} className="btn-secondary text-xs">
            <i className="fa-solid fa-file-pdf mr-1.5"></i>
            Download PDF
          </button>
          <Link to={`/app/fulfillment/${quotation.id}`} className="btn-secondary text-xs">
            <i className="fa-solid fa-truck mr-1.5"></i>
            Fulfillment Plan
          </Link>
        </div>
      </header>

      {/* Executive Approval Decision Banner */}
      {isPendingApproval && (
        <div className={`p-4 md:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs ${
          quotation.status === 'pending_admin_approval' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          quotation.status === 'pending_finance_approval' ? 'bg-orange-50 border-orange-200 text-orange-900' :
          'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              quotation.status === 'pending_admin_approval' ? 'bg-rose-100 text-rose-700' :
              quotation.status === 'pending_finance_approval' ? 'bg-orange-100 text-orange-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              <i className={`text-base ${
                quotation.status === 'pending_admin_approval' ? 'fa-solid fa-shield-halved' :
                quotation.status === 'pending_finance_approval' ? 'fa-solid fa-chart-line' :
                'fa-solid fa-user-tie'
              }`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm">
                  {quotation.status === 'pending_admin_approval' && 'Executive Override Required — Below Product Floor Price'}
                  {quotation.status === 'pending_finance_approval' && 'Finance Approval Required — High-Risk Discount Threshold'}
                  {quotation.status === 'pending_approval' && 'Sales Manager Review Required'}
                  {quotation.status === 'draft' && 'Draft Proposal Review'}
                </h3>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  canApprove() ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {canApprove() ? 'Action Required By You' : 'Awaiting Assigned Level'}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                {canApprove()
                  ? `You are signed in as an authorized approver (${user?.role?.replace(/_/g, ' ')}). You can approve or reject this proposal immediately.`
                  : `This quotation requires sign-off from ${
                      quotation.status === 'pending_admin_approval' ? 'a Company Admin (Floor Price Override)' :
                      quotation.status === 'pending_finance_approval' ? 'Finance Manager or Admin' :
                      'Sales Manager'
                    }. Logged in as: ${user?.role?.replace(/_/g, ' ') || 'Guest'}.`
                }
              </p>
            </div>
          </div>

          {canApprove() && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <i className="fa-solid fa-circle-check"></i>
                <span>{isProcessing ? 'Processing...' : 'Approve Proposal'}</span>
              </button>
              <button
                disabled={isProcessing}
                onClick={handleReject}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <i className="fa-solid fa-circle-xmark"></i>
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* One-Time Costs Section */}
          <section className="card p-0 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-surface-soft">
              <h2 className="text-lg font-semibold text-slate-800">One-Time Costs</h2>
              <p className="text-sm text-text-muted">Hardware, setup, and implementation services</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-6 py-3 font-medium text-right">Discount</th>
                  <th className="px-6 py-3 font-medium text-right">Discounted Price</th>
                  <th className="px-6 py-3 font-medium text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {oneTimeLines.map(line => {
                  const uPrice = Number(line.unit_price) || 0;
                  const dPercent = Number(line.discount_percent) || 0;
                  const qty = Number(line.quantity) || 1;
                  const netPrice = uPrice * (1 - dPercent / 100);
                  return (
                    <tr key={line.id}>
                      <td className="px-6 py-4 font-medium text-slate-800">{line.product_name} <span className="text-xs text-text-muted font-normal block">{line.category}</span></td>
                      <td className="px-6 py-4 text-right text-slate-600">{qty}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {dPercent > 0 ? (
                          <span className="line-through text-slate-400 text-xs mr-1">{formatMoney(uPrice)}</span>
                        ) : (
                          formatMoney(uPrice)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {dPercent > 0 ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-xs border border-emerald-200">
                            {dPercent}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(netPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800 font-mono">{formatMoney(netPrice * qty)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Recurring Costs Section */}
          <section className="card p-0 overflow-hidden border-surface-soft ring-1 ring-primary ring-opacity-20">
            <div className="bg-border-soft px-6 py-4 border-b border-surface-soft">
              <h2 className="text-lg font-semibold text-text-main">Recurring Subscription Costs</h2>
              <p className="text-sm text-primary">Software licenses, SaaS platform, and ongoing support</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price / Mo</th>
                  <th className="px-6 py-3 font-medium text-right">Discount</th>
                  <th className="px-6 py-3 font-medium text-right">Discounted Price</th>
                  <th className="px-6 py-3 font-medium text-right">Monthly Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recurringLines.map(line => {
                  const uPrice = Number(line.unit_price) || 0;
                  const dPercent = Number(line.discount_percent) || 0;
                  const qty = Number(line.quantity) || 1;
                  const netPrice = uPrice * (1 - dPercent / 100);
                  return (
                    <tr key={line.id}>
                      <td className="px-6 py-4 font-medium text-slate-800">{line.product_name} <span className="text-xs text-text-muted font-normal block">{line.category}</span></td>
                      <td className="px-6 py-4 text-right text-slate-600">{qty}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {dPercent > 0 ? (
                          <span className="line-through text-slate-400 text-xs mr-1">{formatMoney(uPrice)}</span>
                        ) : (
                          formatMoney(uPrice)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">
                        {dPercent > 0 ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-xs border border-emerald-200">
                            {dPercent}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(netPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary font-mono">{formatMoney(netPrice * qty)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Live Customer Negotiation & Audit Thread */}
          <section className="card p-6 bg-white border border-surface-soft shadow-sm rounded-2xl space-y-4 print:hidden">
            <div className="flex items-center justify-between border-b border-surface-soft pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <i className="fa-solid fa-comments text-base"></i>
                </span>
                <div>
                  <h3 className="font-extrabold text-text-main text-base">Customer Negotiation &amp; Discussion Thread</h3>
                  <p className="text-xs text-text-muted">Shared message stream between Customer, Sales Rep, Manager &amp; Finance</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
                Active Negotiation
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-surface-soft">
              {messages.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No customer messages logged yet for this proposal.</p>
              ) : (
                messages.map((msg, idx) => {
                  const isCustomer = msg.sender_type === 'customer';
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`text-[10px] font-bold ${isCustomer ? 'text-amber-700' : 'text-purple-700'}`}>
                          {isCustomer ? `Customer (${quotation.customer_name || 'Client'})` : 'Internal Sales / Management'}
                        </span>
                        <span className="text-[9px] text-text-muted">
                          {msg.created_at || msg.timestamp ? new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-md shadow-xs ${
                        isCustomer 
                          ? 'bg-white text-slate-800 border border-surface-soft rounded-tl-none font-medium' 
                          : 'bg-primary text-white font-bold rounded-tr-none shadow'
                      }`}>
                        {msg.content || msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Type a reply to the customer or internal team..."
                className="flex-1 bg-slate-50 border border-surface-soft rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-dark transition-all flex items-center space-x-1.5"
              >
                <span>Send Reply</span>
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </section>

        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h3 className="text-lg font-bold text-text-main mb-4">Financial Summary</h3>

            {quotation.status === 'approved' && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                  <span>Approved &bull; Price Locked</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-100 rounded text-emerald-900">
                  Ready
                </span>
              </div>
            )}
            
            <div className="space-y-4 border-b border-surface-soft pb-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">
                  {quotation.status === 'approved' ? 'Total Payable Due Today' : 'Total Due Today'}
                </span>
                <span className={`text-xl font-bold font-mono ${quotation.status === 'approved' ? 'text-emerald-700 font-black' : 'text-text-main'}`}>
                  {formatMoney(oneTimeTotal)}
                </span>
              </div>
              <p className="text-xs text-text-muted">Includes all hardware, implementation, and setup fees.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-primary font-medium flex items-center">
                  <i className="fa-solid fa-rotate mr-2"></i> Monthly Recurring
                </span>
                <span className="text-xl font-bold text-primary">{formatMoney(recurringTotal)}</span>
              </div>
              <p className="text-xs text-text-muted">Billed on the 1st of every month starting after implementation.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-surface-soft">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Annual Contract Value (ACV)</span>
                <span className="font-semibold text-slate-800">{formatMoney(recurringTotal * 12)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm ${quotation.status === 'approved' ? 'text-emerald-950 font-black' : 'text-text-muted'}`}>
                  {quotation.status === 'approved' ? 'Total Payable (1 Yr):' : 'Total Contract Value (1 Yr)'}
                </span>
                <span className={`font-bold font-mono ${quotation.status === 'approved' ? 'text-xl text-emerald-700 font-black' : 'text-text-main'}`}>
                  {formatMoney(oneTimeTotal + (recurringTotal * 12))}
                </span>
              </div>
            </div>
            
            <button className="btn-primary w-full mt-8 print:hidden">
              <i className="fa-solid fa-paper-plane mr-2"></i>
              Send to Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
