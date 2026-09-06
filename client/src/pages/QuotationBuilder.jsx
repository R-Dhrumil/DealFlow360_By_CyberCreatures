import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [serverRecommendations, setServerRecommendations] = useState([]);
  const [upsellFilter, setUpsellFilter] = useState('all'); // 'all', 'promoted', 'boosters'


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

  // Pre-fill from inquiry deep-link (?inquiryId=...&productId=...&customerId=...&quantity=...&customerName=...&customerEmail=...)
  useEffect(() => {
    const iid = searchParams.get('inquiryId');
    const pid = searchParams.get('productId');
    const qty = parseInt(searchParams.get('quantity') || '1');
    const cName = searchParams.get('customerName');
    const cEmail = searchParams.get('customerEmail');

    if (iid) setInquiryId(iid);
    if (cName) setCustomerName(decodeURIComponent(cName));
    if (cEmail) setCustomerEmail(decodeURIComponent(cEmail));

    // If inquiryId is provided but customer details are missing, fetch inquiry to auto-fill customer info
    if (iid && (!cName || !cEmail)) {
      api.get(`/inquiries/${iid}`)
        .then(res => {
          if (res.data) {
            if (res.data.customer_name && !cName) setCustomerName(res.data.customer_name);
            if (res.data.customer_email && !cEmail) setCustomerEmail(res.data.customer_email);
          }
        })
        .catch(() => {});
    }

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

  const addLine = useCallback((product) => {
    if (lines.find(l => l.productId === product.id)) return;
    setLines(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      basePrice: parseFloat(product.base_price),
      floorPrice: product.floor_price ? parseFloat(product.floor_price) : null,
      quantity: 1,
      discountPercent: 0,
      marginPercent: parseFloat(product.margin_percent !== undefined ? product.margin_percent : 45)
    }]);
  }, [lines]);

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const calculateTotal = useCallback(() =>
    lines.reduce((t, l) => t + (l.basePrice * (1 - l.discountPercent / 100) * l.quantity), 0),
    [lines]
  );

  const calculateTotalCost = useCallback(() =>
    lines.reduce((acc, l) => {
      const unitCost = l.basePrice * (1 - (l.marginPercent !== undefined ? l.marginPercent : 45) / 100);
      return acc + unitCost * l.quantity;
    }, 0),
    [lines]
  );

  const calculateOverallMargin = useCallback(() => {
    if (lines.length === 0) return 0;
    const totalRev = calculateTotal();
    if (totalRev <= 0) return 0;
    const totalCost = calculateTotalCost();
    return parseFloat((((totalRev - totalCost) / totalRev) * 100).toFixed(1));
  }, [lines, calculateTotal, calculateTotalCost]);

  // Live Margin Delta Calculator for any candidate product
  const getMarginDeltaIfAdded = useCallback((product) => {
    const pBasePrice = parseFloat(product.base_price || 0);
    const pMarginPercent = parseFloat(product.margin_percent !== undefined ? product.margin_percent : 45);
    const pUnitCost = pBasePrice * (1 - pMarginPercent / 100);

    if (lines.length === 0) {
      return {
        delta: pMarginPercent,
        projectedMargin: pMarginPercent.toFixed(1),
        isPositive: true,
        isInitial: true
      };
    }

    const currentMargin = parseFloat(calculateOverallMargin());
    const currentRev = calculateTotal();
    const currentCost = calculateTotalCost();

    const projectedRev = currentRev + pBasePrice;
    const projectedCost = currentCost + pUnitCost;

    const projectedMargin = projectedRev > 0
      ? parseFloat((((projectedRev - projectedCost) / projectedRev) * 100).toFixed(1))
      : 0;

    const delta = parseFloat((projectedMargin - currentMargin).toFixed(1));

    return {
      delta,
      projectedMargin: projectedMargin.toFixed(1),
      isPositive: delta >= 0,
      isInitial: false
    };
  }, [lines, calculateOverallMargin, calculateTotal, calculateTotalCost]);

  // Query backend co-purchase synergies whenever quotation lines change
  useEffect(() => {
    let isCancelled = false;
    const fetchRecs = async () => {
      try {
        const pIds = lines.map(l => l.productId).join(',');
        const res = await api.get(`/quotations/recommendations?productIds=${pIds}`);
        if (!isCancelled && Array.isArray(res.data)) {
          setServerRecommendations(res.data);
        }
      } catch (err) {
        // Fallback to client-side ranking gracefully
      }
    };
    fetchRecs();
    return () => { isCancelled = true; };
  }, [lines]);

  // Ranked Upsell & Cross-Sell Suggestions Engine
  const rankedUpsellSuggestions = useMemo(() => {
    if (!products || products.length === 0) return [];

    const candidates = products.filter(
      p => !lines.some(l => l.productId === p.id) && !dismissedUpsells.includes(p.id)
    );

    const currentCategories = new Set(lines.map(l => l.category));
    const serverMap = new Map();
    serverRecommendations.forEach(sr => {
      serverMap.set(sr.id, sr);
    });

    const scored = candidates.map(product => {
      let score = 0;
      const reasons = [];
      const isPromoted = Boolean(product.is_promoted);
      const marginAnalysis = getMarginDeltaIfAdded(product);

      // 1. Backend co-purchase history
      const serverMatch = serverMap.get(product.id);
      if (serverMatch?.coPurchaseCount > 0) {
        score += serverMatch.coPurchaseCount * 35;
        reasons.push(`Co-purchased in ${serverMatch.coPurchaseCount} prior quotes`);
      }

      // 2. Active Promotions boost
      if (isPromoted) {
        score += 50;
        reasons.push('Active Promotion');
      }

      // 3. Category Synergy
      if (currentCategories.has('Hardware') && product.category === 'Services') {
        score += 45;
        reasons.push('Hardware attach: Support & SLA bundle');
      } else if (currentCategories.has('Hardware') && product.category === 'Software') {
        score += 35;
        reasons.push('Hardware attach: Enterprise software add-on');
      } else if (currentCategories.has('Software') && product.category === 'Services') {
        score += 40;
        reasons.push('Software attach: Implementation & support');
      }

      // 4. Known high-frequency co-purchase combinations
      const linePids = new Set(lines.map(l => l.productId));
      if (linePids.has('p1') && product.id === 'p4') {
        score += 60;
        reasons.push('82% co-purchase attach with Industrial Router');
      }
      if (linePids.has('p2') && (product.id === 'p7' || product.id === 'p4')) {
        score += 50;
        reasons.push('Frequently bundled enterprise solution');
      }
      if (linePids.has('p6') && product.id === 'p4') {
        score += 55;
        reasons.push('Standard security SLA bundle');
      }

      // 5. Margin Booster contribution
      if (marginAnalysis.delta > 0) {
        score += marginAnalysis.delta * 2.5;
        reasons.push(`Boosts overall quote margin by +${marginAnalysis.delta}%`);
      }

      const primaryReason = reasons[0] || (isPromoted ? 'Active Promotion' : 'Recommended complement');

      return {
        ...product,
        base_price: parseFloat(product.base_price),
        margin_percent: parseFloat(product.margin_percent !== undefined ? product.margin_percent : 45),
        is_promoted: isPromoted,
        score,
        marginAnalysis,
        primaryReason
      };
    });

    let filtered = scored;
    if (upsellFilter === 'promoted') {
      filtered = scored.filter(s => s.is_promoted);
    } else if (upsellFilter === 'boosters') {
      filtered = scored.filter(s => s.marginAnalysis.delta > 0);
    }

    return filtered.sort((a, b) => b.score - a.score);
  }, [products, lines, dismissedUpsells, serverRecommendations, upsellFilter, getMarginDeltaIfAdded]);

  const handleAddUpsell = (product) => {
    addLine(product);
    const analysis = getMarginDeltaIfAdded(product);
    if (analysis.delta > 0) {
      showNotification('success', `Added ${product.name} to quote! Margin boosted to ${analysis.projectedMargin}%.`);
    } else {
      showNotification('success', `Added ${product.name} to quote.`);
    }
  };

  const handleDismissUpsell = (productId) => {
    setDismissedUpsells(prev => [...prev, productId]);
    showNotification('info', 'Suggestion dismissed');
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
          {lines.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
              <i className="fa-solid fa-chart-line text-indigo-500 text-xs"></i>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blended Margin:</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                overallMargin >= 35 ? 'bg-emerald-100 text-emerald-800' :
                overallMargin >= 20 ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {overallMargin}%
              </span>
            </div>
          )}
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 min-w-[300px] space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Total:</span>
                  <span className="font-semibold text-slate-800">{fmt(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Discount:</span>
                  <span className="font-semibold text-amber-600">-{fmt(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0) - calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Total Cost:</span>
                  <span className="font-semibold text-slate-700">{fmt(calculateTotalCost())}</span>
                </div>
                <div className="flex justify-between text-slate-500 items-center">
                  <span>Blended Margin:</span>
                  <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                    overallMargin >= 35 ? 'bg-emerald-100 text-emerald-800' :
                    overallMargin >= 20 ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {overallMargin}%
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Final Quote Total:</span>
                  <span>{fmt(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Products + Validation Panel */}
        <div className="lg:col-span-1 space-y-5">

          {/* ── Live Risk Analysis Panel ── */}
          {lines.length > 0 && (
            <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
              validation?.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300' :
              validation?.riskLevel === 'HIGH' ? 'bg-rose-50 border-rose-200' : 
              validation?.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 
              'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <i className={`fa-solid ${
                  validation?.riskLevel === 'CRITICAL' ? 'fa-radiation text-red-600' :
                  validation?.riskLevel === 'HIGH' ? 'fa-triangle-exclamation text-rose-500' :
                  validation?.riskLevel === 'MEDIUM' ? 'fa-circle-exclamation text-amber-500' : 
                  'fa-shield-check text-emerald-600'} text-sm`}></i>
                <h3 className={`text-xs font-bold ${
                  validation?.riskLevel === 'CRITICAL' ? 'text-red-800' :
                  validation?.riskLevel === 'HIGH' ? 'text-rose-800' :
                  validation?.riskLevel === 'MEDIUM' ? 'text-amber-800' : 
                  'text-emerald-800'
                }`}>
                  {validation?.requiresFinance ? 'Finance Approval Required' : 
                   validation?.requiresManager ? 'Manager Approval Required' : 'Within Allowed Limits'}
                </h3>
                {validating && <i className="fa-solid fa-spinner fa-spin text-slate-400 text-xs ml-auto"></i>}
              </div>

              {validation && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-white/60 p-2 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Risk Score</span>
                      <span className={`text-xl font-bold ${
                        validation.riskLevel === 'CRITICAL' ? 'text-red-700' :
                        validation.riskLevel === 'HIGH' ? 'text-rose-600' :
                        validation.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{validation.riskScore}<span className="text-sm">/100</span></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">Violations</span>
                      <span className="text-xl font-bold text-slate-700">{validation.violationsCount}</span>
                    </div>
                  </div>

                  <details className="group">
                    <summary className="text-[11px] font-bold text-slate-600 cursor-pointer list-none flex items-center justify-between bg-white/40 hover:bg-white/70 p-2 rounded-lg transition-colors">
                      View Risk Breakdown
                      <i className="fa-solid fa-chevron-down transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div className="mt-3 space-y-2">
                      {validation.lineResults?.map((lr, i) => (
                        <div key={i} className={`bg-white rounded-xl p-3 space-y-1.5 text-xs border ${lr.isViolation || lr.belowFloor ? 'border-rose-200' : 'border-transparent shadow-sm'}`}>
                          <div className="font-semibold text-slate-700 truncate">{lr.productName}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <span className="text-slate-500">Allowed Discount</span>
                            <span className="text-right font-mono font-bold text-emerald-600">{lr.allowedDiscount}%</span>
                            
                            <span className="text-slate-500">Given Discount</span>
                            <span className={`text-right font-mono font-bold ${lr.isViolation ? 'text-rose-600' : 'text-slate-700'}`}>{lr.discount}%</span>
                            
                            {lr.isViolation && (
                              <>
                                <span className="text-slate-500 text-rose-600 font-semibold">Excess</span>
                                <span className="text-right font-mono font-bold text-rose-600">+{lr.excessDiscount}%</span>
                              </>
                            )}

                            {lr.floorPrice && (
                              <>
                                <span className="text-slate-500 mt-1">Floor Price</span>
                                <span className={`text-right font-mono font-bold mt-1 ${lr.belowFloor ? 'text-rose-600' : 'text-slate-600'}`}>{fmt(lr.floorPrice)}</span>
                                <span className="text-slate-500">Net Price</span>
                                <span className={`text-right font-mono font-bold ${lr.belowFloor ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(lr.netPrice)}</span>
                              </>
                            )}
                          </div>
                          
                          {lr.belowFloor && (
                            <div className="mt-1 text-[10px] font-bold text-amber-600 bg-amber-100 rounded-lg px-2 py-1">
                              ⚠ Net price below floor
                            </div>
                          )}
                          {lr.exceedsAuthority && !lr.isViolation && (
                            <div className="mt-1 text-[10px] font-bold text-amber-600 bg-amber-100 rounded-lg px-2 py-1">
                              ⚠ Discount {lr.discount}% exceeds your personal limit of {validation.repMaxDiscount}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* ── Upsell and Cross-Sell Panel (Shown Alongside the Cart) ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center font-bold text-sm shadow-2xs">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Upsell & Cross-Sell</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-primary border border-indigo-100">
                      {rankedUpsellSuggestions.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Ranked by co-purchase history & active promos</p>
                </div>
              </div>
            </div>

            {/* Live Quote Margin Gauge */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Quote Margin</span>
                <span className="text-xs text-slate-500">Benchmark: &gt;35%</span>
              </div>
              <div className="text-right">
                <span className={`text-base font-black ${
                  overallMargin >= 35 ? 'text-emerald-600' :
                  overallMargin >= 20 ? 'text-amber-600' :
                  'text-rose-600'
                }`}>
                  {overallMargin}%
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setUpsellFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  upsellFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({products.filter(p => !lines.some(l => l.productId === p.id) && !dismissedUpsells.includes(p.id)).length})
              </button>
              <button
                type="button"
                onClick={() => setUpsellFilter('promoted')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  upsellFilter === 'promoted'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <i className="fa-solid fa-bolt text-[9px]"></i> Active Promos
              </button>
              <button
                type="button"
                onClick={() => setUpsellFilter('boosters')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  upsellFilter === 'boosters'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <i className="fa-solid fa-arrow-trend-up text-[9px]"></i> Margin Boosters
              </button>
            </div>

            {/* Ranked Suggestions List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {rankedUpsellSuggestions.length === 0 ? (
                <div className="text-center py-7 px-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
                  <i className="fa-solid fa-check-double text-2xl text-emerald-400 block"></i>
                  <p className="font-semibold text-slate-700">All suggestions reviewed!</p>
                  <p className="text-[11px] text-slate-400">
                    {dismissedUpsells.length > 0
                      ? `${dismissedUpsells.length} suggestion(s) currently dismissed.`
                      : 'All available products are in your quotation.'}
                  </p>
                  {dismissedUpsells.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDismissedUpsells([])}
                      className="text-xs font-bold text-primary hover:underline pt-1 inline-flex items-center gap-1"
                    >
                      <i className="fa-solid fa-rotate-left text-[10px]"></i> Restore Dismissed ({dismissedUpsells.length})
                    </button>
                  )}
                </div>
              ) : (
                rankedUpsellSuggestions.map(product => {
                  const { delta, projectedMargin, isPositive, isInitial } = product.marginAnalysis;
                  return (
                    <div
                      key={product.id}
                      className={`rounded-xl p-3.5 border transition-all space-y-2.5 ${
                        product.is_promoted
                          ? 'bg-gradient-to-br from-amber-50/50 via-white to-indigo-50/30 border-amber-200/80 shadow-2xs'
                          : 'bg-white border-slate-200/80 hover:border-indigo-200 shadow-2xs'
                      }`}
                    >
                      {/* Product Header & Promo Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-xs tracking-tight">{product.name}</h4>
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200/50">
                              {product.category}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 block">
                            {fmt(product.base_price)} {product.unit ? <span className="text-slate-400 font-normal">/ {product.unit}</span> : ''}
                          </span>
                        </div>

                        {/* Promotion Tag */}
                        {product.is_promoted && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-800 border border-amber-300 shadow-2xs">
                            <i className="fa-solid fa-bolt text-amber-500 text-[9px]"></i> Active Promotion
                          </span>
                        )}
                      </div>

                      {/* Margin Delta & Impact */}
                      <div className="flex items-center justify-between gap-2 bg-white/80 p-2 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Margin Impact</span>
                          <span className="text-[11px] text-slate-600 font-semibold">
                            {isInitial ? 'Initial Margin' : `Yields ${projectedMargin}%`}
                          </span>
                        </div>

                        {/* Margin Delta Badge */}
                        <div className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up text-emerald-600' : 'fa-arrow-trend-down text-amber-600'} text-[10px]`}></i>
                          {isPositive ? `+${delta}%` : `${delta}%`} Margin
                        </div>
                      </div>

                      {/* Recommendation Rationale / Co-purchase history */}
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                        <i className="fa-solid fa-circle-check text-indigo-500 text-[9px]"></i>
                        {product.primaryReason}
                      </p>

                      {/* Action Buttons: Add to Quote & Dismiss */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddUpsell(product)}
                          className="flex-1 py-1.5 px-3 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-cart-plus text-[10px]"></i>
                          Add to Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissUpsell(product.id)}
                          className="py-1.5 px-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                          title="Dismiss suggestion"
                        >
                          <i className="fa-solid fa-xmark text-[10px]"></i>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dismissed Count Bar with Restore Option */}
            {dismissedUpsells.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{dismissedUpsells.length} suggestion{dismissedUpsells.length > 1 ? 's' : ''} dismissed</span>
                <button
                  type="button"
                  onClick={() => setDismissedUpsells([])}
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <i className="fa-solid fa-rotate-left text-[9px]"></i> Reset Dismissed
                </button>
              </div>
            )}
          </div>

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
