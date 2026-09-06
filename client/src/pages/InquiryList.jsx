import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useVisibleInterval } from '../hooks/useVisibleInterval';

const statusColors = {
  open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Open' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'In Progress' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Paid & Confirmed' },
  closed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Closed' },
  cancelled: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Cancelled' },
};

const tierColors = {
  M1: 'bg-indigo-100 text-indigo-700',
  M2: 'bg-purple-100 text-purple-700',
  M3: 'bg-rose-100 text-rose-700',
};

export default function InquiryList() {
  const { formatMoney } = useCurrency();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({});

  const fetchInquiries = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/inquiries');
      setInquiries(res.data || []);
    } catch (err) {
      if (!silent) console.error('Failed to fetch inquiries', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useVisibleInterval(() => fetchInquiries(true), 5000);

  const toggleExpand = async (inquiryId) => {
    if (expandedId === inquiryId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(inquiryId);
    if (!expandedData[inquiryId]) {
      try {
        const res = await api.get(`/inquiries/${inquiryId}`);
        setExpandedData(prev => ({ ...prev, [inquiryId]: res.data }));
      } catch (err) {
        console.error('Failed to fetch inquiry detail', err);
      }
    }
  };

  const handleCreateQuotation = (inquiry) => {
    const nameParam = inquiry.customer_name ? `&customerName=${encodeURIComponent(inquiry.customer_name)}` : '';
    const emailParam = inquiry.customer_email ? `&customerEmail=${encodeURIComponent(inquiry.customer_email)}` : '';
    navigate(`/app/quote?inquiryId=${inquiry.id}&productId=${inquiry.product_id}&customerId=${inquiry.customer_id}&quantity=${inquiry.quantity}${nameParam}${emailParam}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <i className="fa-solid fa-inbox"></i>
            </span>
            Customer Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-13">
            Open inquiries from customers — each sales rep can respond with their own quotation.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl">
            {inquiries.filter(i => i.status === 'open').length} Open
          </span>
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl">
            {inquiries.filter(i => i.status === 'in_progress').length} In Progress
          </span>
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
            {inquiries.filter(i => i.status === 'paid').length} Paid &amp; Confirmed
          </span>
        </div>
      </header>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="card p-14 text-center">
          <i className="fa-solid fa-inbox text-slate-300 text-5xl mb-4"></i>
          <h3 className="text-lg font-semibold text-slate-700">No inquiries yet</h3>
          <p className="text-sm text-slate-400 mt-1">Customer inquiries from the marketplace will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const sc = statusColors[inquiry.status] || statusColors.open;
            const tierColor = tierColors[inquiry.customer_tier] || 'bg-slate-100 text-slate-600';
            const detail = expandedData[inquiry.id];
            const isExpanded = expandedId === inquiry.id;

            return (
              <div key={inquiry.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Main Row */}
                <div className="p-5 flex flex-wrap items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`}></div>

                  {/* Inquiry ID + Status */}
                  <div className="shrink-0">
                    <span className="font-mono text-xs text-slate-400">{inquiry.id}</span>
                    <div className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      {sc.label}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{inquiry.customer_name}</span>
                      <span className="text-slate-400 text-xs">{inquiry.customer_email}</span>
                      {inquiry.customer_tier && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierColor}`}>
                          {inquiry.customer_tier}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{inquiry.product_name}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>{inquiry.product_category}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>Qty: <strong>{inquiry.quantity}</strong></span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-xs text-slate-400">Base Price</div>
                    <div className="text-sm font-bold text-slate-800">
                      {formatMoney(inquiry.base_price)}
                    </div>
                    {inquiry.floor_price && (
                      <div className="text-[10px] text-rose-500 font-semibold">
                        Floor: {formatMoney(inquiry.floor_price)}
                      </div>
                    )}
                  </div>

                  {/* Quote count */}
                  <div className="text-center shrink-0">
                    <div className="text-xs text-slate-400">Quotations</div>
                    <div className="text-lg font-black text-primary">{inquiry.quotation_count || 0}</div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-400 shrink-0 hidden md:block">
                    {new Date(inquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {inquiry.status !== 'closed' && inquiry.status !== 'paid' && (
                      <button
                        onClick={() => handleCreateQuotation(inquiry)}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all shadow-sm flex items-center gap-2"
                      >
                        <i className="fa-solid fa-file-invoice-dollar text-[10px]"></i>
                        Create Quotation
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(inquiry.id)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                      <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ml-1.5 text-[9px]`}></i>
                    </button>
                  </div>
                </div>

                {/* Expanded: Existing Quotations on this Inquiry */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-layer-group text-primary"></i>
                      Quotations for this Inquiry
                    </h4>

                    {!detail ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                        <i className="fa-solid fa-spinner fa-spin"></i> Loading...
                      </div>
                    ) : detail.quotations?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No quotations created yet. Be the first to respond!
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {detail.quotations.map(q => {
                          const statusBadge = {
                            draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
                            pending_approval: { cls: 'bg-amber-100 text-amber-700', label: 'Pending Manager' },
                            pending_admin_approval: { cls: 'bg-rose-100 text-rose-700', label: 'Pending Admin' },
                            pending_finance_approval: { cls: 'bg-orange-100 text-orange-700', label: 'Pending Finance' },
                            approved: { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
                            rejected: { cls: 'bg-red-100 text-red-600', label: 'Rejected' },
                            confirmed: { cls: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
                          }[q.status] || { cls: 'bg-slate-100 text-slate-500', label: q.status };

                          return (
                            <div
                              key={q.id}
                              className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
                              onClick={() => navigate(`/app/quote/${q.id}`)}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-mono text-xs text-slate-400">{q.id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                                  {statusBadge.label}
                                </span>
                              </div>
                              <div className="text-xs">
                                <span className="text-slate-500">By: </span>
                                <span className="font-semibold text-slate-800">{q.sales_rep_name}</span>
                                <span className="text-slate-400 ml-1">({q.sales_rep_role?.replace('_', ' ')})</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs">Amount</span>
                                <span className="font-black text-sm text-slate-900">
                                  {formatMoney(q.total_amount)}
                                </span>
                              </div>
                              {q.max_discount > 0 && (
                                <div className="text-[10px] text-amber-600 font-semibold">
                                  Discount: {Number(q.max_discount).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Notes */}
                    {inquiry.notes && (
                      <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Customer Notes: </span>
                        {inquiry.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
