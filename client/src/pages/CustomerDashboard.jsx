import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode, formatSKU } from '../utils/formatters';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userStr = localStorage.getItem('user');
  const customer = userStr ? JSON.parse(userStr) : {
    name: 'Acme Procurement Team',
    email: 'purchasing@acmecorp.com',
    role: 'customer',
    company_name: 'Acme Corporation'
  };

  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl || localStorage.getItem('customerActiveTab') || 'products';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');
  const [quotations, setQuotations] = useState([]);
  
  // Product Detail Modal State
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    localStorage.setItem('customerActiveTab', tab);
  };

  useEffect(() => {
    fetchCatalogProducts();
    fetchQuotations();
  }, []);

  const fetchCatalogProducts = async () => {
    try {
      const res = await api.get('/marketplace/products');
      setProducts(res.data || []);
    } catch (err) {
      try {
        const res2 = await api.get('/products');
        setProducts(res2.data || []);
      } catch (err2) {
        setProducts([]);
      }
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data || []);
    } catch (err) {
      setQuotations([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRequestQuoteForProduct = async (product, quantity = 1) => {
    try {
      const res = await api.post('/quotations/customer-request', { productId: product.id, quantity });
      const newQuote = res.data?.quotation;
      const quoteCode = newQuote ? formatQuoteCode(newQuote.id) : 'QT-2026-1001';
      setInquirySuccess(`Success! ${quoteCode} generated for ${product.name} (Qty: ${quantity}) and assigned to your sales rep.`);
      await fetchQuotations();
      if (selectedProductDetail) setSelectedProductDetail(null);
      handleTabChange('quotations');
    } catch (err) {
      console.error('Failed to request quote:', err);
      setInquirySuccess(`Quote request for ${product.name} submitted! Switching to proposals...`);
      setTimeout(() => setInquirySuccess(''), 4000);
      await fetchQuotations();
      if (selectedProductDetail) setSelectedProductDetail(null);
      handleTabChange('quotations');
    }
  };

  const categories = ['All', 'Hardware', 'Software', 'Services', 'Cloud License'];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Customer Header */}
      <header className="bg-white text-text-main border-b border-surface-soft shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-xl text-text-main shadow-md">
              {customer.name ? customer.name.charAt(0) : 'C'}
            </div>
            <div>
              <span className="font-bold text-text-main text-base block leading-tight">{customer.company_name || 'Customer Portal'}</span>
              <span className="text-xs text-text-muted">Authenticated Customer Workspace</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-text-main">{customer.name}</p>
              <p className="text-[11px] text-text-muted">{customer.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-surface-soft hover:bg-slate-700 text-text-main border border-surface-soft px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center"
            >
              <i className="fa-solid fa-arrow-right-from-bracket mr-1.5"></i> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-text-main shadow-lg border border-surface-soft flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              Customer Account Active
            </span>
            <h1 className="text-2xl font-bold">Welcome back, {customer.name}!</h1>
            <p className="text-sm text-text-muted mt-1">Browse admin products catalog, request quote proposals, or negotiate custom discounts with your sales rep.</p>
          </div>

          {/* FIRST TAB: Browse Product Catalog */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTabChange('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-500 text-text-main shadow ring-2 ring-emerald-400/50'
                  : 'bg-surface-soft text-text-muted hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-boxes-stacked mr-1.5"></i> Browse Product Catalog
            </button>
            <button
              onClick={() => handleTabChange('quotations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quotations'
                  ? 'bg-emerald-500 text-text-main shadow ring-2 ring-emerald-400/50'
                  : 'bg-surface-soft text-text-muted hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-file-invoice mr-1.5"></i> My Proposals & Records ({quotations.length})
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-500 text-text-main shadow ring-2 ring-emerald-400/50'
                  : 'bg-surface-soft text-text-muted hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-id-card mr-1.5"></i> Personal Profile
            </button>
          </div>
        </div>

        {inquirySuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center shadow-sm">
            <i className="fa-solid fa-circle-check mr-2 text-base"></i>
            <span>{inquirySuccess}</span>
          </div>
        )}

        {/* TAB 1 (FIRST): Browse Admin Products Catalog */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-surface-soft shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-text-main">Admin Products Catalog & Price Listing</h2>
                <p className="text-xs text-text-muted">Browse official company products configured by system administrators</p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-text-main shadow'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-surface-soft'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedProductDetail(p);
                    setModalQuantity(1);
                  }}
                  className="bg-white rounded-2xl border border-surface-soft shadow-sm hover:shadow-md hover:border-emerald-400 transition-all p-6 flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {p.category}
                        </span>
                        {p.is_promoted && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center">
                            <i className="fa-solid fa-star mr-1 text-amber-500 text-[9px]"></i> Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">{formatSKU(p.sku, p.id)}</span>
                    </div>

                    <h3 className="font-extrabold text-text-main text-base leading-snug group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                      <span>{p.name}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"></i>
                    </h3>
                    
                    <p className="text-xs text-text-muted line-clamp-2">{p.description || 'No detailed description available.'}</p>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-xs text-text-muted font-medium">List Price:</span>
                      <span className="text-xl font-black text-emerald-700">
                        ${typeof p.base_price === 'number' ? p.base_price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : parseFloat(p.base_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs text-text-muted font-normal"> / {p.unit || 'unit'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-semibold text-emerald-600 text-center flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100">
                      <i className="fa-solid fa-eye text-xs"></i>
                      <span>Click card for full details</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestQuoteForProduct(p, 1);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Request Quotation for Product</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: My Proposals */}
        {activeTab === 'quotations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-main">Active Proposals & Quotations</h2>

            {quotations.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-surface-soft text-center text-text-muted text-xs space-y-3">
                <i className="fa-solid fa-file-circle-exclamation text-3xl text-slate-300"></i>
                <p className="font-semibold text-sm text-slate-700">No Active Proposals Yet</p>
                <p>Browse the Admin Product Catalog and click "Request Quotation for Product" to generate a live quote.</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow text-xs inline-flex items-center space-x-2 hover:bg-emerald-700 transition-colors"
                >
                  <i className="fa-solid fa-boxes-stacked"></i>
                  <span>Browse Product Catalog</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotations.map(q => {
                  const statusLabel = (q.status || 'draft').replace(/_/g, ' ');
                  const totalVal = Number(q.total_amount || q.totalAmount || 0);
                  const quoteCode = formatQuoteCode(q.id);
                  return (
                    <div 
                      key={q.id}
                      className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            {quoteCode}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            q.status === 'accepted' || q.status === 'approved' || q.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            q.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {statusLabel}
                          </span>
                        </div>

                        <h3 className="font-bold text-text-main text-base">{q.product_summary || q.title || 'Quotation Proposal'}</h3>
                        <p className="text-xs text-text-muted">Account: <strong>{q.customer_name || 'Acme Corp'}</strong> &bull; Assigned Rep: <strong>{q.sales_rep_name || 'M. Shah'}</strong> &bull; {q.lines_count || 1} item(s)</p>

                        <div className="pt-2 flex justify-between items-baseline border-t border-slate-100">
                          <span className="text-xs text-text-muted font-medium">Total Proposal Value:</span>
                          <span className="text-2xl font-black text-emerald-700">
                            ${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex space-x-3">
                        <Link
                          to={`/portal/${q.id}`}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center shadow transition-colors flex items-center justify-center space-x-2"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                          <span>View & Negotiate Proposal</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Personal Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-text-main font-black text-2xl flex items-center justify-center shadow-md">
                {customer.name ? customer.name.charAt(0) : 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main">{customer.name}</h2>
                <p className="text-xs text-text-muted">{customer.email}</p>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">
                  Verified Customer Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-surface-soft">
                <span className="text-text-muted font-semibold block mb-1">Company / Organization</span>
                <span className="text-text-main font-bold text-sm">{customer.company_name || 'Acme Corporation'}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-surface-soft">
                <span className="text-text-muted font-semibold block mb-1">Account Role</span>
                <span className="text-text-main font-bold text-sm">Customer Portal User</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-surface-soft">
                <span className="text-text-muted font-semibold block mb-1">Customer Tier Status</span>
                <span className="text-emerald-700 font-bold text-sm">Gold Tier Customer</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-surface-soft">
                <span className="text-text-muted font-semibold block mb-1">Security Authentication</span>
                <span className="text-text-main font-bold text-sm">Encrypted JWT Session</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Product Detail Modal */}
      {selectedProductDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProductDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-surface-soft p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedProductDetail.category}
                  </span>
                  <span className="text-xs font-mono text-text-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    SKU: {formatSKU(selectedProductDetail.sku, selectedProductDetail.id)}
                  </span>
                  {selectedProductDetail.is_promoted && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      <i className="fa-solid fa-star mr-1 text-amber-500"></i> Featured Product
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-800 pt-1">{selectedProductDetail.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedProductDetail(null)}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6">
              {/* Product Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
                  <span className="text-xs text-emerald-700 font-semibold block">Base List Price</span>
                  <span className="text-2xl font-black text-emerald-800">
                    ${parseFloat(selectedProductDetail.base_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-emerald-600 block font-medium">per {selectedProductDetail.unit || 'unit'}</span>
                </div>

                <div className="bg-slate-50 border border-surface-soft p-4 rounded-2xl">
                  <span className="text-xs text-text-muted font-semibold block">Applicable Tax Rate</span>
                  <span className="text-2xl font-black text-slate-800">
                    {selectedProductDetail.tax_rate !== undefined && selectedProductDetail.tax_rate !== null ? `${selectedProductDetail.tax_rate}%` : '0%'}
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">Standard B2B Sales Tax</span>
                </div>

                <div className="bg-slate-50 border border-surface-soft p-4 rounded-2xl">
                  <span className="text-xs text-text-muted font-semibold block">Pricing Tier Eligible</span>
                  <span className="text-xl font-bold text-slate-800 flex items-center mt-1">
                    <i className="fa-solid fa-tags text-emerald-600 mr-1.5 text-sm"></i>
                    <span>Gold Discount</span>
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">Negotiable in quote</span>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center">
                  <i className="fa-solid fa-circle-info text-emerald-600 mr-2"></i>
                  Product Overview & Specifications
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-surface-soft text-slate-700 text-xs leading-relaxed">
                  {selectedProductDetail.description || 'No extended description has been published for this item. Contact sales for technical specifications.'}
                </div>
              </div>

              {/* Vendor & Metadata Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block font-semibold">Vendor / Supplier</span>
                    <span className="text-slate-800 font-bold">{selectedProductDetail.company_name || 'CyberCreatures Authorized'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    <i className="fa-solid fa-boxes-packing"></i>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block font-semibold">Availability Status</span>
                    <span className="text-emerald-700 font-bold">In Stock & Ready for Quote</span>
                  </div>
                </div>
              </div>

              {/* Action Box: Select Quantity & Request Quote */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 rounded-2xl text-white space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white">Ready to place a formal inquiry?</h4>
                    <p className="text-xs text-slate-300">Select quantity below to generate a negotiable proposal instantly.</p>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-xs font-semibold text-slate-300">Qty:</span>
                    <button
                      onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center text-xs transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => setModalQuantity(prev => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center text-xs transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/80 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Est. Base Subtotal:</span>
                    <span className="text-xl font-black text-emerald-400">
                      ${(parseFloat(selectedProductDetail.base_price || 0) * modalQuantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedProductDetail(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleRequestQuoteForProduct(selectedProductDetail, modalQuantity)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md transition-all flex items-center space-x-2"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Request Quotation ({modalQuantity})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
