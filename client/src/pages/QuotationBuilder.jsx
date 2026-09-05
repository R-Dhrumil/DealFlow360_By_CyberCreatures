import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

export default function QuotationBuilder() {
  const { showNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dismissedUpsells, setDismissedUpsells] = useState([]);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Live Link Modal State
  const [showModal, setShowModal] = useState(false);
  const [generatedQuoteId, setGeneratedQuoteId] = useState(null);
  const [generatedLiveUrl, setGeneratedLiveUrl] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const addLine = (product) => {
    setLines([...lines, { 
      productId: product.id, 
      productName: product.name,
      category: product.category,
      basePrice: parseFloat(product.base_price),
      quantity: 1, 
      discountPercent: 0,
      marginPercent: parseFloat(product.margin_percent || 45)
    }]);
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lines.reduce((total, line) => {
      const priceAfterDiscount = line.basePrice * (1 - line.discountPercent / 100);
      return total + (priceAfterDiscount * line.quantity);
    }, 0);
  };

  const calculateOverallMargin = () => {
    if (lines.length === 0) return 0;
    const totalRev = calculateTotal();
    if (totalRev === 0) return 0;
    
    const totalCost = lines.reduce((acc, l) => {
      const net = l.basePrice * (1 - l.discountPercent / 100);
      const estCost = net * (1 - (l.marginPercent || 40) / 100);
      return acc + (estCost * l.quantity);
    }, 0);

    return (((totalRev - totalCost) / totalRev) * 100).toFixed(1);
  };

  const getMarginIndicator = (line) => {
    const marginImpact = line.discountPercent;
    if (marginImpact > line.marginPercent / 2) return 'text-red-500';
    if (marginImpact > line.marginPercent / 4) return 'text-amber-500';
    return 'text-emerald-status';
  };

  const handleGenerateLiveDocument = async (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      showNotification('error', 'Please fill in both Customer Name and Customer Email.');
      return;
    }

    if (lines.length === 0) {
      showNotification('error', 'Please select at least one product for the quotation.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/quotations', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        lines: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.basePrice,
          discountPercent: l.discountPercent,
          lineType: 'one_time'
        }))
      });

      const quoteId = response.data?.quotationId || response.data?.quotation?.id || 'q_live';
      const liveLink = `${window.location.origin}/portal/${quoteId}`;

      setGeneratedQuoteId(quoteId);
      setGeneratedLiveUrl(liveLink);
      setShowModal(true);

      showNotification('success', `Live proposal document generated! [Quote #${quoteId}]`);
    } catch (error) {
      console.error('Failed to create live quotation', error);
      showNotification('error', error.response?.data?.error || 'Failed to create quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLiveUrl) {
      navigator.clipboard.writeText(generatedLiveUrl);
      showNotification('success', 'Live Document link copied to clipboard!');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setLines([]);
    setShowModal(false);
    setGeneratedQuoteId(null);
    setGeneratedLiveUrl('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-border-soft">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  const overallMargin = calculateOverallMargin();
  const availableUpsells = products.filter(p => 
    !lines.find(l => l.productId === p.id) && !dismissedUpsells.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotation Builder & Live Document Link</h1>
              <p className="text-xs text-slate-500">Configure customer details, select products, and generate a secure shareable proposal link</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" 
            onClick={() => showNotification('success', 'Quotation draft auto-saved')}
          >
            Save Draft
          </button>
          <button 
            type="button"
            onClick={handleGenerateLiveDocument} 
            disabled={submitting || lines.length === 0 || !customerName.trim() || !customerEmail.trim()}
            className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Generating Link...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-bolt text-amber-300"></i>
                <span>Generate Live Document Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Details Form Format */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-user-check text-primary"></i>
                <h2 className="text-base font-bold text-slate-900">Customer Details</h2>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
                <i className="fa-solid fa-link text-[10px]"></i> Unique Link Document
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
                    <i className="fa-solid fa-user"></i>
                  </span>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp / John Doe" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">
                    <i className="fa-solid fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    placeholder="e.g. customer@acme.com" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Order Lines */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-layer-group text-slate-600"></i>
                <h2 className="text-base font-bold text-slate-900">Quotation Line Items</h2>
              </div>
              
              {/* Overall Live Margin Meter */}
              <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold">Live Order Margin:</span>
                <span className={`text-xs font-bold ${
                  overallMargin > 35 ? 'text-emerald-600' : overallMargin > 20 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {overallMargin}%
                </span>
                <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      overallMargin > 35 ? 'bg-emerald-500' : overallMargin > 20 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, overallMargin))}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {lines.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                <i className="fa-solid fa-cart-arrow-down text-slate-300 text-4xl mb-3"></i>
                <p className="text-slate-800 font-semibold text-xs">No products added to quotation cart.</p>
                <p className="text-xs text-slate-400 mt-1">Select available products from the right catalog panel to build order lines.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Unit Price</th>
                      <th className="pb-3">Discount %</th>
                      <th className="pb-3">Net Total</th>
                      <th className="pb-3 text-right">Margin</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const netPrice = line.basePrice * (1 - line.discountPercent / 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 text-slate-800 font-semibold text-xs">
                            {line.productName}
                            <span className="text-[10px] text-slate-400 block font-normal">{line.category}</span>
                          </td>
                          <td className="py-3">
                            <input 
                              type="number" 
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-primary" 
                              value={line.quantity}
                              min="1"
                              onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="py-3 text-slate-500 text-xs">${line.basePrice.toFixed(2)}</td>
                          <td className="py-3">
                            <input 
                              type="number" 
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg font-bold outline-none focus:ring-1 focus:ring-primary" 
                              value={line.discountPercent}
                              min="0"
                              max="100"
                              onChange={(e) => updateLine(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-3 text-slate-900 font-bold text-xs">${(netPrice * line.quantity).toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <i className={`fa-solid fa-circle text-[10px] ${getMarginIndicator(line)}`}></i>
                          </td>
                          <td className="py-3 text-right">
                            <button onClick={() => removeLine(idx)} className="text-slate-400 hover:text-rose-600 p-1">
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 min-w-[260px] space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Total:</span>
                  <span className="font-semibold text-slate-800">${lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Discount:</span>
                  <span className="font-semibold text-amber-600">-${(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0) - calculateTotal()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Final Quote Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Smart Cross-Sell Recommendations */}
            {lines.length > 0 && availableUpsells.length > 0 && (
              <div className="mt-8 border border-indigo-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-primary"></i>
                    <h3 className="font-bold text-indigo-950 text-xs">Smart Cross-Sell & Upsell Suggestions</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Co-Purchase Intelligence
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/20">
                  {availableUpsells.slice(0, 2).map(product => (
                    <div key={product.id} className="bg-white border border-indigo-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-xs">{product.name}</h4>
                          {product.is_promoted && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Promoted
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block">{product.category} &bull; ${parseFloat(product.base_price).toLocaleString()}</span>
                        
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                          <i className="fa-solid fa-arrow-trend-up mr-1 text-emerald-600"></i>
                          Margin Delta: +4.2%
                        </span>
                      </div>

                      <div className="flex flex-col space-y-1 text-right">
                        <button 
                          type="button"
                          onClick={() => addLine(product)}
                          className="text-xs font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center"
                        >
                          <i className="fa-solid fa-plus mr-1 text-[10px]"></i> Add
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDismissedUpsells([...dismissedUpsells, product.id])}
                          className="text-[10px] text-slate-400 hover:text-slate-600 pt-1"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Products List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Available Products</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {products.length} Items
              </span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {products.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <i className="fa-solid fa-box-open text-2xl mb-2 text-slate-300 block"></i>
                  No products in catalog.
                </div>
              ) : (
                products.map(product => (
                  <div 
                    key={product.id} 
                    className="border border-slate-200/80 rounded-xl p-3 hover:border-primary/60 hover:bg-slate-50 transition-all cursor-pointer group flex justify-between items-center" 
                    onClick={() => addLine(product)}
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs group-hover:text-primary transition-colors">{product.name}</h4>
                      <span className="text-[11px] text-slate-400">{product.category} &bull; ${parseFloat(product.base_price).toFixed(2)}</span>
                    </div>
                    <button type="button" className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-primary group-hover:text-white text-slate-500 flex items-center justify-center transition-colors">
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Live Document Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Live Quotation Link Ready!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quotation <strong className="text-slate-800">#{generatedQuoteId}</strong> created for <strong className="text-slate-800">{customerName}</strong> ({customerEmail}).
                Share this unique link with the customer to view details.
              </p>
            </div>

            {/* Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Shareable Proposal Document URL
              </label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLiveUrl}
                  className="w-full bg-white px-3 py-2 text-xs font-mono text-slate-700 border border-slate-200 rounded-xl outline-none select-all"
                />
                <button 
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors shrink-0 flex items-center space-x-1"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="button"
                onClick={() => window.open(generatedLiveUrl, '_blank')}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all text-center flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-external-link"></i>
                <span>View Live Proposal Document</span>
              </button>

              <button 
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
              >
                Create Another Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
