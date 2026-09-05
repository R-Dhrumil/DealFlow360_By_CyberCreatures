import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';
import CurrencyPicker from '../components/CurrencyPicker';

export default function CustomerPortal() {
  const { formatMoney, selected } = useCurrency();
  const { id: quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      if (!quotationId) return;
      const res = await api.get(`/quotations/${quotationId}`);
      setQuotation(res.data || null);
    } catch (error) {
      console.error('Failed to fetch public quotation details', error);
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600">
        <i className="fa-solid fa-circle-notch fa-spin text-primary text-4xl mb-3"></i>
        <p className="text-sm font-medium">Loading Public Quotation Details...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-700 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <i className="fa-solid fa-file-circle-xmark text-4xl text-rose-500 mb-3"></i>
          <h2 className="text-lg font-bold">Quotation Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested quotation link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const lines = quotation.lines || [];

  const calculateLineNetTotal = (line) => {
    const unitPrice = Number(line.unit_price) || 0;
    const discount = Number(line.discount_percent) || 0;
    const qty = Number(line.quantity) || 1;
    const netUnitPrice = unitPrice * (1 - discount / 100);
    return netUnitPrice * qty;
  };

  const grandTotal = lines.reduce((sum, line) => sum + calculateLineNetTotal(line), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-snug">
                {quotation.company_name || 'DealFlow360'} Quotation Details
              </h1>
              <p className="text-xs text-slate-500 font-mono">Reference: #{formatQuoteCode(quotation.id)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <i className="fa-solid fa-globe text-[10px]"></i> Public Demo Access
            </span>
            <div className="print:hidden">
              <CurrencyPicker />
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 print:hidden"
            >
              <i className="fa-solid fa-print"></i> Print / PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status Banner when Approved */}
        {quotation.status === 'approved' && (
          <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow">
                <i className="fa-solid fa-certificate"></i>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-emerald-950">Official Approved Proposal</h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  This quotation has been officially approved by company leadership with all discounts locked in.
                </p>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 text-right shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Payable Amount</span>
              <span className="text-xl font-black text-emerald-700 font-mono">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Customer & Document Information Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1 sm:border-r border-slate-100 pr-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name</span>
            <h2 className="font-bold text-slate-900 text-base">{quotation.customer_name || 'Valued Customer'}</h2>
            {quotation.customer_email && (
              <p className="text-xs text-slate-500 font-mono">{quotation.customer_email}</p>
            )}
          </div>

          <div className="space-y-1 sm:border-r border-slate-100 pr-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Issued By</span>
            <p className="font-semibold text-slate-800 text-sm">{quotation.sales_rep_name || 'Sales Representative'}</p>
            <p className="text-xs text-slate-500">{quotation.company_name || 'DealFlow360 Solutions'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Proposal Details</span>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold text-slate-800">
                {quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-xs items-center">
              <span className="text-slate-500">Status:</span>
              <span className={`font-bold capitalize px-2 py-0.5 rounded-full text-[11px] ${
                quotation.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
                  : 'text-slate-700'
              }`}>
                {(quotation.status || 'Active').replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Quotation Details Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <i className="fa-solid fa-list-check text-primary"></i> Quotation Details & Line Items
            </h3>
            <span className="text-xs text-slate-500 font-mono">{lines.length} Line Item{lines.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
                  <th className="py-3 px-6">Product / Service</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">Discounted Price</th>
                  <th className="py-3 px-6 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                      No line items included in this quotation.
                    </td>
                  </tr>
                ) : (
                  lines.map((line, idx) => {
                    const unitPrice = Number(line.unit_price) || 0;
                    const discount = Number(line.discount_percent) || 0;
                    const qty = Number(line.quantity) || 1;
                    const netUnitPrice = unitPrice * (1 - discount / 100);
                    const lineNet = netUnitPrice * qty;

                    return (
                      <tr key={line.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-900">{line.product_name || 'Product / Service'}</p>
                          {(line.category || line.line_type) && (
                            <span className="text-[11px] text-slate-400">
                              {line.category ? line.category : ''} {line.line_type === 'recurring' ? '(Recurring)' : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-700">{qty}</td>
                        <td className="py-4 px-4 text-right font-mono text-slate-600">
                          {discount > 0 ? (
                            <span className="line-through text-slate-400 text-xs">{formatMoney(unitPrice)}</span>
                          ) : (
                            formatMoney(unitPrice)
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-mono">
                          {discount > 0 ? (
                            <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-xs border border-emerald-200">
                              {discount}% OFF
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatMoney(netUnitPrice)}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-900 font-mono">
                          {formatMoney(lineNet)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          {(() => {
            const totalGross = lines.reduce((sum, line) => sum + (Number(line.unit_price) || 0) * (Number(line.quantity) || 1), 0);
            const totalDiscountSaved = Math.max(0, totalGross - grandTotal);
            const isApproved = quotation.status === 'approved';

            return (
              <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 italic">
                    All prices are displayed in {selected.name} ({selected.symbol}).
                  </p>
                  {isApproved && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <i className="fa-solid fa-circle-check text-emerald-600"></i>
                      <span>Approved Price Guarantee &bull; Price Locked</span>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-80 space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Base Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-700">{formatMoney(totalGross)}</span>
                  </div>

                  {totalDiscountSaved > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-tag text-[10px]"></i> Discount Savings:
                      </span>
                      <span className="font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        - {formatMoney(totalDiscountSaved)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className={`text-sm font-bold ${isApproved ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                      {isApproved ? 'Total Payable Amount:' : 'Total Amount:'}
                    </span>
                    <div className="text-right">
                      <span className={`text-2xl font-black font-mono ${isApproved ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {formatMoney(grandTotal)}
                      </span>
                      {isApproved && (
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          Net Payable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </main>
    </div>
  );
}
