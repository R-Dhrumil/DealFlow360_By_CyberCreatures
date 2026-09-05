import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { copyTextToClipboard } from '../utils/clipboard';
import { useCurrency } from '../contexts/CurrencyContext';

export default function QuotationBuilder() {
  const { formatMoney } = useCurrency();
  const fmt = (n) => formatMoney(n);
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dismissedUpsells, setDismissedUpsells] = useState([]);
  const [copied, setCopied] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [inquiryId, setInquiryId] = useState(null);

  // Live Validation State
  const [validation, setValidation] = useState(null); // { repMaxDiscount, lineResults, requiresManagerApproval }
  const [validating, setValidating] = useState(false);

  // Live Link Modal State
  const [showModal, setShowModal] = useState(false);
  const [generatedQuoteId, setGeneratedQuoteId] = useState(null);
  const [generatedLiveUrl, setGeneratedLiveUrl] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Pre-fill from inquiry deep-link (?inquiryId=...&productId=...&customerId=...&quantity=...)
  useEffect(() => {
    const iid = searchParams.get('inquiryId');
    const pid = searchParams.get('productId');
    const qty = parseInt(searchParams.get('quantity') || '1');
    if (iid) setInquiryId(iid);

    if (pid && products.length > 0) {
      const product = products.find(p => p.id === pid);
      if (product) {
        setLines([{
          productId: product.id,
          productName: product.name,
          category: product.category,
          basePrice: parseFloat(product.base_price),
          floorPrice: product.floor_price ? parseFloat(product.floor_price) : null,
          quantity: qty,
          discountPercent: 0,
          marginPercent: parseFloat(product.margin_percent || 45)
        }]);
      }
    }
  }, [searchParams, products]);

  // Run validation whenever lines change (debounced)
  const runValidation = useCallback(async (currentLines) => {
    if (currentLines.length === 0) { setValidation(null); return; }
    try {
      setValidating(true);
      const res = await api.post('/quotations/validate-discount', {
        lines: currentLines.map(l => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          discountPercent: l.discountPercent,
          unitPrice: l.basePrice
        }))
      });
      setValidation(res.data);
    } catch {
      // silent — validation is best-effort
    } finally {
      setValidating(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runValidation(lines), 500);
    return () => clearTimeout(timer);
  }, [lines, runValidation]);

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
    if (lines.find(l => l.productId === product.id)) return;
    setLines([...lines, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      basePrice: parseFloat(product.base_price),
      floorPrice: product.floor_price ? parseFloat(product.floor_price) : null,
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

  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const calculateTotal = () =>
    lines.reduce((t, l) => t + (l.basePrice * (1 - l.discountPercent / 100) * l.quantity), 0);

  const calculateOverallMargin = () => {
    if (lines.length === 0) return 0;
    const totalRev = calculateTotal();
    if (totalRev === 0) return 0;
    const totalCost = lines.reduce((acc, l) => {
      const net = l.basePrice * (1 - l.discountPercent / 100);
      const estCost = net * (1 - (l.marginPercent || 40) / 100);
      return acc + estCost * l.quantity;
    }, 0);
    return (((totalRev - totalCost) / totalRev) * 100).toFixed(1);
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
      // Step 1: Create quotation (draft)
      const createRes = await api.post('/quotations', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        inquiryId: inquiryId || undefined,
        lines: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.basePrice,
          discountPercent: l.discountPercent,
          lineType: 'one_time'
        }))
      });

      const quoteId = createRes.data?.quotationId || createRes.data?.quotation?.id;

      // Step 2: Submit for approval check
      const submitRes = await api.put(`/quotations/${quoteId}/submit`);

      const liveLink = `${window.location.origin}/portal/${quoteId}`;
      setGeneratedQuoteId(quoteId);
      setGeneratedLiveUrl(liveLink);
      setSubmitResult(submitRes.data);
      setShowModal(true);

      if (submitRes.data?.status === 'approved') {
        showNotification('success', `✅ Quote #${quoteId} auto-approved and ready to send!`);
      } else {
        showNotification('info', `⏳ Quote #${quoteId} submitted for manager approval.`);
      }
    } catch (error) {
      console.error('Failed to create quotation', error);
      showNotification('error', error.response?.data?.error || 'Failed to create quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLiveUrl) {
      const success = await copyTextToClipboard(generatedLiveUrl);
      if (success) {
        setCopied(true);
        showNotification('success', 'Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const resetForm = () => {
    setCustomerName(''); setCustomerEmail(''); setLines([]);
    setShowModal(false); setGeneratedQuoteId(null);
    setGeneratedLiveUrl(''); setSubmitResult(null); setInquiryId(null);
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
  const hasApprovalIssue = validation?.requiresManagerApproval;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Inquiry Context Banner */}
      {inquiryId && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <i className="fa-solid fa-link-slash text-blue-500"></i>
          <span className="text-xs font-semibold text-blue-700">
            Creating quotation for Inquiry <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">{inquiryId}</code>
          </span>
          <button onClick={() => setInquiryId(null)} className="ml-auto text-blue-400 hover:text-blue-600 text-xs">
            Detach
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotation Builder</h1>
              <p className="text-xs text-slate-500">Configure customer details, select products, and generate a secure proposal link</p>
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
              <><i className="fa-solid fa-spinner fa-spin"></i><span>Processing...</span></>
            ) : (
              <><i className="fa-solid fa-bolt text-amber-300"></i><span>Generate & Submit</span></>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Customer Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-user-check text-primary"></i>
                <h2 className="text-base font-bold text-slate-900">Customer Details</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><i className="fa-solid fa-user"></i></span>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp / John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><i className="fa-solid fa-envelope"></i></span>
                  <input
                    type="email"
                    placeholder="e.g. customer@acme.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-layer-group text-slate-600"></i>
                <h2 className="text-base font-bold text-slate-900">Quotation Line Items</h2>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                <span className="text-xs text-slate-500 font-semibold">Live Margin:</span>
                <span className={`text-xs font-bold ${overallMargin > 35 ? 'text-emerald-600' : overallMargin > 20 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {overallMargin}%
                </span>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                <i className="fa-solid fa-cart-arrow-down text-slate-300 text-4xl mb-3"></i>
                <p className="text-slate-800 font-semibold text-xs">No products added yet.</p>
                <p className="text-xs text-slate-400 mt-1">Select products from the right panel to build order lines.</p>
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
                      <th className="pb-3">Floor</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const netPrice = line.basePrice * (1 - line.discountPercent / 100);
                      const lineValidation = validation?.lineResults?.find(l => l.productId === line.productId);
                      const hasIssue = lineValidation?.requiresApproval;
                      const belowFloor = lineValidation?.belowFloor;
                      const exceedsAuth = lineValidation?.exceedsAuthority;

                      return (
                        <tr key={idx} className={`transition-colors ${hasIssue ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'}`}>
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
                          <td className="py-3 text-slate-500 text-xs">{fmt(line.basePrice)}</td>
                          <td className="py-3">
                            <input
                              type="number"
                              className={`w-20 px-2 py-1 text-xs border rounded-lg font-bold outline-none focus:ring-1 ${
                                exceedsAuth ? 'border-rose-300 bg-rose-50 focus:ring-rose-300' :
                                belowFloor ? 'border-amber-300 bg-amber-50 focus:ring-amber-300' :
                                'border-slate-200 focus:ring-primary'
                              }`}
                              value={line.discountPercent}
                              min="0"
                              max="100"
                              onChange={(e) => updateLine(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                            />
                            {validation && (
                              <div className="text-[9px] mt-0.5 font-bold">
                                {exceedsAuth && <span className="text-rose-500">Exceeds limit ({validation.repMaxDiscount}%)</span>}
                                {!exceedsAuth && belowFloor && <span className="text-amber-600">Below floor price</span>}
                                {!hasIssue && !validating && <span className="text-emerald-600">✓ OK</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-slate-900 font-bold text-xs">{fmt(netPrice * line.quantity)}</td>
                          <td className="py-3 text-xs">
                            {line.floorPrice ? (
                              <span className={`font-semibold ${belowFloor ? 'text-rose-500' : 'text-slate-400'}`}>
                                {fmt(line.floorPrice)}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
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

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 min-w-[280px] space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Total:</span>
                  <span className="font-semibold text-slate-800">{fmt(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Discount:</span>
                  <span className="font-semibold text-amber-600">-{fmt(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0) - calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Final Quote Total:</span>
                  <span>{fmt(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-sell */}
          {lines.length > 0 && availableUpsells.length > 0 && (
            <div className="border border-indigo-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-primary"></i>
                  <h3 className="font-bold text-indigo-950 text-xs">Smart Cross-Sell & Upsell Suggestions</h3>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/20">
                {availableUpsells.slice(0, 2).map(product => (
                  <div key={product.id} className="bg-white border border-indigo-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs">{product.name}</h4>
                      <span className="text-[11px] text-slate-500 block">{product.category} &bull; {fmt(product.base_price)}</span>
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

        {/* Sidebar: Products + Validation Panel */}
        <div className="lg:col-span-1 space-y-5">

          {/* ── Live Discount Authority Panel ── */}
          {lines.length > 0 && (
            <div className={`rounded-2xl border p-5 shadow-sm ${hasApprovalIssue ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <i className={`fa-solid ${hasApprovalIssue ? 'fa-triangle-exclamation text-rose-500' : 'fa-shield-check text-emerald-600'} text-sm`}></i>
                <h3 className={`text-xs font-bold ${hasApprovalIssue ? 'text-rose-800' : 'text-emerald-800'}`}>
                  {hasApprovalIssue ? 'Manager Approval Required' : 'Within Your Authority'}
                </h3>
                {validating && <i className="fa-solid fa-spinner fa-spin text-slate-400 text-xs ml-auto"></i>}
              </div>

              {validation && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Your Max Discount:</span>
                    <span className="font-bold text-slate-800">{validation.repMaxDiscount}%</span>
                  </div>

                  {validation.lineResults?.map((lr, i) => (
                    <div key={i} className="bg-white/70 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-700 truncate">{lr.productName}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <span className="text-slate-500">Base Price</span>
                        <span className="text-right font-mono font-bold">{fmt(lr.basePrice)}</span>
                        <span className="text-slate-500">Discount</span>
                        <span className={`text-right font-mono font-bold ${lr.exceedsAuthority ? 'text-rose-600' : 'text-slate-700'}`}>{lr.discount}%</span>
                        <span className="text-slate-500">Net Price</span>
                        <span className="text-right font-mono font-bold">{fmt(lr.netPrice)}</span>
                        {lr.floorPrice && (
                          <>
                            <span className="text-slate-500">Floor Price</span>
                            <span className={`text-right font-mono font-bold ${lr.belowFloor ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(lr.floorPrice)}</span>
                          </>
                        )}
                      </div>
                      {lr.exceedsAuthority && (
                        <div className="mt-1 text-[10px] font-bold text-rose-600 bg-rose-100 rounded-lg px-2 py-1">
                          ⚠ Discount {lr.discount}% exceeds your limit of {validation.repMaxDiscount}%
                        </div>
                      )}
                      {lr.belowFloor && !lr.exceedsAuthority && (
                        <div className="mt-1 text-[10px] font-bold text-amber-600 bg-amber-100 rounded-lg px-2 py-1">
                          ⚠ Net price below floor — manager approval required
                        </div>
                      )}
                    </div>
                  ))}

                  {hasApprovalIssue && (
                    <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-700 font-semibold">
                      This quotation will be submitted for <strong>manager approval</strong> automatically.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Available Products ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Available Products</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                {products.length} Items
              </span>
            </div>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {products.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <i className="fa-solid fa-box-open text-2xl mb-2 text-slate-300 block"></i>
                  No products in catalog.
                </div>
              ) : (
                products.map(product => {
                  const alreadyAdded = lines.find(l => l.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className={`border rounded-xl p-3 transition-all cursor-pointer group flex justify-between items-center ${
                        alreadyAdded
                          ? 'border-emerald-300 bg-emerald-50/50 opacity-70 cursor-default'
                          : 'border-slate-200/80 hover:border-primary/60 hover:bg-slate-50'
                      }`}
                      onClick={() => !alreadyAdded && addLine(product)}
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs group-hover:text-primary transition-colors">{product.name}</h4>
                        <span className="text-[11px] text-slate-400">{product.category} &bull; {fmt(product.base_price)}</span>
                        {product.floor_price && (
                          <span className="text-[10px] text-rose-400 block">Floor: {fmt(product.floor_price)}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          alreadyAdded
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 group-hover:bg-primary group-hover:text-white text-slate-500'
                        }`}
                      >
                        <i className={`fa-solid ${alreadyAdded ? 'fa-check' : 'fa-plus'} text-xs`}></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            {/* Status Icon */}
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner ${
                submitResult?.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                submitResult?.status === 'pending_approval' || submitResult?.status === 'pending_admin_approval'
                  ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <i className={`fa-solid ${
                  submitResult?.status === 'approved' ? 'fa-check' :
                  submitResult?.status?.includes('pending') ? 'fa-clock' : 'fa-check'
                }`}></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {submitResult?.status === 'approved' ? '✅ Quote Auto-Approved!' :
                 submitResult?.status?.includes('pending') ? '⏳ Submitted for Approval' :
                 'Quotation Created!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quotation <strong className="text-slate-800">#{generatedQuoteId}</strong> created for <strong className="text-slate-800">{customerName}</strong>.
                {submitResult?.status === 'approved'
                  ? ' It was auto-approved and is ready to share.'
                  : ' It has been sent for manager review.'}
              </p>
            </div>

            {/* Approval Status Badge */}
            {submitResult && (
              <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${
                submitResult.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <i className={`fa-solid ${submitResult.status === 'approved' ? 'fa-check-circle' : 'fa-hourglass-half'}`}></i>
                Status: {submitResult.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                {submitResult.approvalLevel && ` — ${submitResult.approvalLevel} review`}
              </div>
            )}

            {/* Link */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Shareable Proposal URL
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
                  className={`px-3.5 py-2 text-xs font-bold text-white rounded-xl transition-all shrink-0 flex items-center space-x-1 ${
                    copied ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.open(generatedLiveUrl, '_blank')}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md transition-all text-center flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-external-link"></i>
                <span>View Live Proposal</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
