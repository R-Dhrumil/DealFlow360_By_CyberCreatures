import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Selected product for detail & quote modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [activeActionTab, setActiveActionTab] = useState('buy'); // 'buy' or 'quote'
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseSuccessOrder, setPurchaseSuccessOrder] = useState(null);

  const categories = ['All', 'Hardware', 'Software', 'Services'];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;

      const response = await api.get('/marketplace/products', { params });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchProducts]);

  const handleRequestQuote = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
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
      if (!user && !customerEmail) {
        showNotification('error', 'Please provide your work email to receive quotation proposals.');
      } else {
        showNotification('error', err.response?.data?.error || 'Failed to submit proposal request. Please try again.');
      }
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleInstantBuy = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) return;

    const email = user?.email || customerEmail;
    if (!email) {
      showNotification('error', 'Please enter your email to confirm the order receipt.');
      return;
    }

    try {
      setSubmittingPurchase(true);
      const res = await api.post('/marketplace/purchase', {
        productId: selectedProduct.id,
        quantity: modalQuantity,
        customerEmail: email,
        customerName: user?.name || (email ? email.split('@')[0] : 'Valued Buyer'),
        paymentMethod,
        notes: customerNotes
      });

      const { orderId, remainingStock, quantityPurchased } = res.data;
      showNotification('success', `🎉 Order confirmed! #${orderId}. ${quantityPurchased} unit(s) deducted from stock.`);
      
      // Update local products list stock in real time
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, stock: remainingStock } : p));
      setSelectedProduct(prev => prev ? { ...prev, stock: remainingStock } : null);
      
      setPurchaseSuccessOrder(res.data);
    } catch (err) {
      console.error('Purchase error:', err);
      showNotification('error', err.response?.data?.error || 'Failed to complete order. Please try again.');
    } finally {
      setSubmittingPurchase(false);
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
              {(category !== 'All' || search) && (
                <button
                  onClick={() => { setCategory('All'); setSearch(''); }}
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

            {/* Category Filter Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-body">Categories</label>
              <div className="flex flex-col space-y-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      category === cat
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-50 text-text-body hover:bg-border-soft border border-surface-soft'
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <span className="text-white text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Info Badge */}
            <div className="p-3.5 rounded-xl bg-border-soft border border-surface-soft text-[11px] text-text-muted leading-relaxed">
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
                onClick={() => { setCategory('All'); setSearch(''); }}
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

                    {/* Stock Status Bar */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-text-muted font-semibold flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-slate-400" />
                        Warehouse Stock:
                      </span>
                      {p.stock > 10 ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {p.stock} {p.unit || 'units'}
                        </span>
                      ) : p.stock > 0 ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Low Stock: {p.stock} left
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          Out of Stock
                        </span>
                      )}
                    </div>

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
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                          setModalQuantity(1);
                          setActiveActionTab('buy');
                          setPurchaseSuccessOrder(null);
                        }}
                        disabled={p.stock <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Buy Now</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(p);
                          setModalQuantity(1);
                          setActiveActionTab('quote');
                          setPurchaseSuccessOrder(null);
                        }}
                        className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Quote</span>
                      </button>
                    </div>

                    <div className="text-[10px] font-semibold text-slate-400 text-center flex items-center justify-center space-x-1 group-hover:text-primary transition-colors">
                      <Eye className="w-3 h-3" />
                      <span>View details &amp; inventory routing</span>
                    </div>
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
                  <span className="text-xs text-text-muted font-semibold block">Warehouse Stock Available</span>
                  <span className="text-xl font-bold flex items-center mt-1">
                    {selectedProduct.stock > 10 ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{selectedProduct.stock} units in stock</span>
                      </span>
                    ) : selectedProduct.stock > 0 ? (
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-amber-600" />
                        <span>Low Stock: {selectedProduct.stock} left</span>
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-red-600" />
                        <span>Out of Stock</span>
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-text-muted block font-medium">Auto-deducted on purchase</span>
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
                    <span className="text-[10px] text-text-muted block font-semibold">Inventory Status</span>
                    <span className="text-emerald-700 font-bold">
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} Units Ready for Dispatch` : 'Pending Restock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Confirmation Screen if Purchase Successful */}
              {purchaseSuccessOrder ? (
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-white space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/30">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-lg font-extrabold text-white">Purchase Confirmed!</h4>
                      <p className="text-xs text-emerald-300">Warehouse stock decremented &amp; order confirmed in pipeline.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 p-4 rounded-xl border border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order Ref:</span>
                      <span className="font-mono font-bold text-emerald-400">{purchaseSuccessOrder.orderId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Qty Purchased:</span>
                      <span className="font-bold text-white">{purchaseSuccessOrder.quantityPurchased} units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Amount:</span>
                      <span className="font-mono font-bold text-white">{formatMoney(purchaseSuccessOrder.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Remaining Stock:</span>
                      <span className="font-mono font-bold text-amber-300">{purchaseSuccessOrder.remainingStock} units</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setPurchaseSuccessOrder(null);
                        setSelectedProduct(null);
                      }}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                    >
                      Done • Continue Shopping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Mode Toggle */}
                  <div className="flex bg-slate-100 p-1.5 rounded-xl gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab('buy')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeActionTab === 'buy'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Instant Buy &amp; Decrement Stock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveActionTab('quote')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeActionTab === 'quote'
                          ? 'bg-purple-700 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Custom Proposal</span>
                    </button>
                  </div>

                  {activeActionTab === 'buy' ? (
                    /* Instant Buy Form */
                    <form onSubmit={handleInstantBuy} className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white space-y-4 shadow-lg border border-slate-700">
                      <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Direct Purchase &amp; Instant Fulfillment
                          </h4>
                          <p className="text-xs text-slate-300">
                            Available in warehouse: <strong className="text-emerald-400">{selectedProduct.stock} units</strong>
                          </p>
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
                            max={selectedProduct.stock ?? 9999}
                            value={modalQuantity > (selectedProduct.stock ?? 9999) ? (selectedProduct.stock ?? 9999) : modalQuantity}
                            onChange={(e) => setModalQuantity(Math.max(1, Math.min(selectedProduct.stock ?? 9999, parseInt(e.target.value) || 1)))}
                            className="w-12 text-center bg-transparent border-0 text-xs font-bold text-emerald-400 py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setModalQuantity(prev => Math.min(selectedProduct.stock ?? 9999, prev + 1))}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
                            { id: 'upi', label: 'UPI / Instant QR', icon: '📱' },
                            { id: 'cod', label: 'Cash on Delivery', icon: '💵' }
                          ].map(pm => (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                paymentMethod === pm.id
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              <span>{pm.icon}</span>
                              <span>{pm.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <input
                          type="email"
                          placeholder="Your work/buyer email..."
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Delivery notes or purchase order ref (optional)..."
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="pt-3 border-t border-white/15 flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Total Due ({modalQuantity} units):</span>
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            {formatMoney(parseFloat(selectedProduct.base_price || 0) * modalQuantity * (1 + (parseFloat(selectedProduct.tax_rate || 0) / 100)))}
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
                            disabled={submittingPurchase || selectedProduct.stock <= 0}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-2.5 px-5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                          >
                            {submittingPurchase ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing Purchase...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm Purchase &amp; Deduct Stock</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Quote Request Form */
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
                  )}
                </div>
              )}
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
