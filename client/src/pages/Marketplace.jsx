import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatSKU } from '../utils/formatters';
import {
  Store,
  Search,
  Building,
  Star,
  ArrowUpRight,
  Eye,
  Send,
  X,
  Boxes,
  Tag,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export default function Marketplace() {
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  // Selected product for detail & quote modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      try {
        const params = {};
        if (category) params.category = category;
        if (search) params.search = search;

        const response = await api.get('/marketplace/products', { params });
        if (!cancelled) {
          setProducts(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCatalog();
    return () => { cancelled = true; };
  }, [category, search]);

  const handleRequestQuote = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    try {
      setSubmittingInquiry(true);
      await api.post('/inquiries', {
        productId: selectedProduct.id,
        quantity: modalQuantity,
        notes: customerNotes,
        customerEmail: user?.email || customerEmail,
        customerName: user?.name || (customerEmail ? customerEmail.split('@')[0] : 'Guest Buyer')
      });

      showNotification('success', `Proposal request for ${selectedProduct.name} (x${modalQuantity}) dispatched successfully! A sales rep will respond shortly.`);
      setSelectedProduct(null);
      setCustomerEmail('');
      setCustomerNotes('');
      setModalQuantity(1);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      // If unauthorized and email not provided, guide user
      if (!user && !customerEmail) {
        showNotification('error', 'Please provide your work email to receive quotation proposals.');
      } else {
        showNotification('error', err.response?.data?.error || 'Failed to submit proposal request. Please try again.');
      }
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9fe] text-text-main flex flex-col font-sans antialiased">
      
      {/* ─── Header ─── */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-40 border-b border-surface-soft py-4 px-6 md:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-text-main group-hover:text-primary transition-colors flex items-center gap-1.5">
                DealFlow360
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  Marketplace
                </span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/" className="text-xs text-text-muted hover:text-primary font-semibold px-3 py-2 rounded-lg hover:bg-border-soft transition-all hidden sm:inline-block">
            Home
          </Link>
          <Link to="/login" className="text-xs text-text-body hover:text-primary font-semibold px-3.5 py-2 rounded-lg border border-surface-soft hover:border-primary/30 bg-white shadow-xs transition-all">
            Business Login
          </Link>
          <Link to="/customer/login" className="btn-primary text-xs py-2 px-4 shadow-sm">
            Customer Portal
          </Link>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
        
        {/* ─── Sidebar Filters ─── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-soft">
              <h2 className="font-extrabold text-sm text-text-main flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Filter Catalog
              </h2>
              {(category || search) && (
                <button
                  onClick={() => { setCategory(''); setSearch(''); }}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Search Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-body">Search Products</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl pl-9 pr-3.5 py-2 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  placeholder="Search products or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-body">Category</label>
              <select
                className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
              </select>
            </div>

            {/* Catalog Info Badge */}
            <div className="p-3 rounded-xl bg-border-soft border border-surface-soft text-[11px] text-text-muted leading-relaxed">
              <span className="font-semibold text-text-main block mb-0.5">Enterprise Direct Pricing</span>
              Select any item to view tier volume discounts or request official multi-department proposals.
            </div>
          </div>
        </aside>

        {/* ─── Product Grid Section ─── */}
        <section className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-text-main tracking-tight">Available Enterprise Catalog</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {products.length} {products.length === 1 ? 'product' : 'products'} available for instant quote request
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-72 bg-white rounded-2xl border border-surface-soft p-12 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-semibold text-text-muted">Loading product catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-soft p-12 text-center shadow-xs space-y-3">
              <Boxes className="w-12 h-12 text-text-muted mx-auto stroke-1" />
              <h3 className="text-base font-bold text-text-main">No products found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                No catalog items matched your filter criteria. Try adjusting your search query or reset category filters.
              </p>
              <button
                onClick={() => { setCategory(''); setSearch(''); }}
                className="btn-secondary text-xs mt-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setModalQuantity(1);
                  }}
                  className="bg-white rounded-2xl border border-surface-soft shadow-sm hover:shadow-md hover:border-primary/40 transition-all p-6 flex flex-col justify-between space-y-4 cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header: Category & SKU & Featured */}
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="bg-[#faf2ff] text-primary border border-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {p.category}
                        </span>
                        {p.is_promoted && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center">
                            <Star className="w-2.5 h-2.5 mr-1 fill-amber-500 text-amber-500" /> Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">{formatSKU(p.sku, p.id)}</span>
                    </div>

                    {/* Vendor Info */}
                    {p.company_name && (
                      <div className="flex items-center space-x-1.5 text-xs text-text-muted">
                        {p.company_logo ? (
                          <img src={p.company_logo} alt={p.company_name} className="w-4 h-4 rounded-full object-contain" />
                        ) : (
                          <Building className="w-3.5 h-3.5 text-text-muted" />
                        )}
                        <span className="font-semibold text-slate-700 truncate">{p.company_name}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-extrabold text-text-main text-base leading-snug group-hover:text-primary transition-colors flex items-center justify-between">
                      <span className="line-clamp-1">{p.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 ml-1" />
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {p.description || 'Enterprise grade solution configured with automated margin governance.'}
                    </p>

                    {/* Price Strip */}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-xs text-text-muted font-medium">List Price:</span>
                      <span className="text-xl font-black text-primary font-mono">
                        {formatMoney(p.base_price)}
                        <span className="text-xs text-text-muted font-normal"> / {p.unit || 'unit'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-semibold text-primary text-center flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3" />
                      <span>Click card for full details</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                        setModalQuantity(1);
                      }}
                      className="btn-primary w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Quotation for Product</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ─── Product Detail & Quote Request Modal ─── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-surface-soft relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-surface-soft pb-4">
              <div className="space-y-1 pr-6">
                <div className="flex items-center space-x-2">
                  <span className="bg-[#faf2ff] text-primary border border-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  {selectedProduct.is_promoted && (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Featured
                    </span>
                  )}
                  <span className="text-xs font-mono text-text-muted">{formatSKU(selectedProduct.sku, selectedProduct.id)}</span>
                </div>
                <h2 className="text-2xl font-black text-text-main pt-1 tracking-tight">{selectedProduct.name}</h2>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6">
              {/* Product Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#faf2ff] border border-surface-soft p-4 rounded-2xl">
                  <span className="text-xs text-primary font-semibold block">Base List Price</span>
                  <span className="text-2xl font-black text-primary font-mono">
                    {formatMoney(selectedProduct.base_price)}
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">per {selectedProduct.unit || 'unit'}</span>
                </div>

                <div className="bg-slate-50 border border-surface-soft p-4 rounded-2xl">
                  <span className="text-xs text-text-muted font-semibold block">Standard Sales Tax</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">
                    {selectedProduct.tax_rate !== undefined && selectedProduct.tax_rate !== null ? `${selectedProduct.tax_rate}%` : '0%'}
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">Auto-Calculated in Quote</span>
                </div>

                <div className="bg-slate-50 border border-surface-soft p-4 rounded-2xl">
                  <span className="text-xs text-text-muted font-semibold block">Pricing Tier Eligible</span>
                  <span className="text-xl font-bold text-slate-800 flex items-center mt-1">
                    <Tag className="w-4 h-4 text-emerald-600 mr-1.5" />
                    <span>Volume Discount</span>
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">Negotiable with Sales Rep</span>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Product Overview &amp; Specifications
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-surface-soft text-text-body text-xs leading-relaxed">
                  {selectedProduct.description || 'Enterprise specification configured for quote-to-cash lifecycle and immediate dispatch routing.'}
                </div>
              </div>

              {/* Vendor & Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-surface-soft flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-primary flex items-center justify-center font-bold text-sm">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block font-semibold">Vendor / Supplier</span>
                    <span className="text-text-main font-bold">{selectedProduct.company_name || 'CyberCreatures Authorized'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-surface-soft flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block font-semibold">Availability Status</span>
                    <span className="text-emerald-700 font-bold">In Stock &amp; Ready for Quote</span>
                  </div>
                </div>
              </div>

              {/* Quote Request Form */}
              <form onSubmit={handleRequestQuote} className="bg-gradient-to-br from-[#110d1a] to-[#201925] p-6 rounded-2xl text-white space-y-4 shadow-lg">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white">Request Official Commercial Proposal</h4>
                    <p className="text-xs text-slate-300">Submit an inquiry to trigger parallel approvals and volume discount models.</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                    <span className="text-xs font-semibold text-slate-300">Qty:</span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center bg-transparent border-0 text-xs font-bold text-emerald-400 py-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setModalQuantity(prev => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Email and Notes Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <input
                    type="email"
                    placeholder="Your work email (for proposal dispatch)..."
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Specific requirements or target delivery date..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-3 border-t border-white/15 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Estimated Base Subtotal:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {formatMoney(parseFloat(selectedProduct.base_price || 0) * modalQuantity)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="btn-primary py-2.5 px-5 text-xs shadow-lg flex items-center gap-2"
                    >
                      {submittingInquiry ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Dispatch Proposal Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 md:px-12 border-t border-surface-soft bg-white text-center text-xs text-text-muted mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DealFlow360 Enterprise Catalog. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-primary transition-colors">Landing Page</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link to="/customer/login" className="hover:text-primary transition-colors">Customer Portal</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
