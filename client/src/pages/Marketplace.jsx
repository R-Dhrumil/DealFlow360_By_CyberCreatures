import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Marketplace() {
  const { formatMoney } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      
      const response = await api.get('/marketplace/products', { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a slight debounce to search to make it feel premium
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [category, search]);

  const categories = ['All', 'Hardware', 'Software', 'Services'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-200">
      {/* Premium Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/5 blur-[120px]"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-500/20 to-emerald-500/5 blur-[100px]"></div>
        </div>

        <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <i className="fa-solid fa-store text-white text-lg"></i>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">DealFlow<span className="text-emerald-400">360</span></h1>
          </div>
          <div className="flex items-center space-x-6">
            <a href="/login" className="text-slate-300 hover:text-white font-semibold transition-colors text-sm">Business Login</a>
            <a href="/customer/login" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              Customer Portal <i className="fa-solid fa-arrow-right ml-1"></i>
            </a>
          </div>
        </header>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Discover Premium <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">B2B Solutions</span>
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-medium">
            Explore our curated marketplace of enterprise-grade hardware, software, and specialized services tailored for your business growth.
          </p>

          {/* Glassmorphic Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl">
              <i className="fa-solid fa-magnifying-glass text-slate-300 ml-4 text-lg"></i>
              <input 
                type="text" 
                className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-slate-400 font-medium text-lg" 
                placeholder="Search products, software, or services..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-xl font-bold shadow-md cursor-pointer hover:bg-emerald-400 transition-colors">
                Search
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-8 space-y-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center">
                <i className="fa-solid fa-layer-group text-emerald-500 mr-2"></i> Categories
              </h3>
              <div className="flex flex-col space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                      category === cat 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 translate-x-1' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <i className="fa-solid fa-check text-white/80"></i>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
              <h4 className="font-bold mb-2">Need a custom quote?</h4>
              <p className="text-xs text-slate-300 mb-4">Login to your customer portal to request customized pricing for large volume orders.</p>
              <a href="/customer/login" className="block text-center text-xs font-bold bg-white text-slate-900 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                Login Now
              </a>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-3xl p-4 h-80 border border-slate-100 animate-pulse shadow-sm flex flex-col">
                  <div className="h-40 bg-slate-100 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-auto"></div>
                  <div className="h-10 bg-slate-100 rounded-xl mt-4"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-box-open text-slate-300 text-4xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No products found</h3>
              <p className="text-slate-500 font-medium">We couldn't find any products matching your current filters.</p>
              <button 
                onClick={() => { setCategory('All'); setSearch(''); }}
                className="mt-6 text-emerald-600 font-bold hover:text-emerald-700 bg-emerald-50 px-6 py-2.5 rounded-full transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => {
                // Determine icon based on category
                let iconClass = 'fa-box';
                let bgGradient = 'from-emerald-400 to-teal-500';
                if (product.category === 'Hardware') {
                  iconClass = 'fa-server';
                  bgGradient = 'from-blue-500 to-indigo-600';
                } else if (product.category === 'Software') {
                  iconClass = 'fa-code';
                  bgGradient = 'from-violet-500 to-purple-600';
                } else if (product.category === 'Services') {
                  iconClass = 'fa-headset';
                  bgGradient = 'from-amber-400 to-orange-500';
                }

                return (
                  <div key={product.id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full relative">
                    
                    {product.is_promoted && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-md">
                        <i className="fa-solid fa-star mr-1"></i> Featured
                      </div>
                    )}

                    {/* Product Image/Icon Area */}
                    <div className="h-44 bg-slate-50 p-6 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-slate-100 transition-colors">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${bgGradient} text-white flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                        <i className={`fa-solid ${iconClass} text-3xl`}></i>
                      </div>
                      
                      {/* Brand Pill */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm z-10">
                        {product.company_logo ? (
                          <img src={product.company_logo} alt={product.company_name} className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex justify-center items-center">
                            <i className="fa-solid fa-building text-[8px] text-slate-500"></i>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{product.company_name}</span>
                      </div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-3 flex justify-between items-start gap-2">
                        <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                      </div>
                      
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 mb-4 w-fit border border-slate-200">
                        {product.category}
                      </div>
                      
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1 font-medium leading-relaxed">
                        {product.description}
                      </p>
                      
                      {/* Price & Action */}
                      <div className="pt-5 border-t border-slate-100 mt-auto flex items-end justify-between group/action">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starting at</p>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{formatMoney(product.base_price)}</span>
                            <span className="text-xs font-semibold text-slate-400 ml-1">/ {product.unit}</span>
                          </div>
                        </div>
                        <a href="/customer/login" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300 border border-slate-200 group-hover:border-transparent">
                           <i className="fa-solid fa-arrow-right"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
