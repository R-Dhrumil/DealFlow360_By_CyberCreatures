import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Marketplace() {
  const { formatMoney } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
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
    fetchProducts();
  }, [category, search]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-surface-soft py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-store text-primary text-2xl"></i>
          <h1 className="text-xl font-bold text-slate-800">DealFlow360 Marketplace</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/login" className="text-slate-600 hover:text-primary font-medium">Business Login</a>
          <a href="/customer/login" className="btn-primary">Customer Portal</a>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="card p-4 sticky top-6">
            <h2 className="font-semibold text-slate-800 mb-4">Filters</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-text-muted"></i>
                <input 
                  type="text" 
                  className="input-field pl-9" 
                  placeholder="Search products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <i className="fa-solid fa-spinner fa-spin text-primary text-3xl"></i>
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="fa-solid fa-box-open text-text-muted text-5xl mb-4"></i>
              <h3 className="text-lg font-medium text-slate-800">No products found</h3>
              <p className="text-text-muted mt-2">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="card overflow-hidden hover:shadow-premium transition-shadow duration-300 flex flex-col">
                  {product.is_promoted && (
                    <div className="bg-primary text-text-main text-xs font-bold uppercase tracking-wider py-1 px-3">
                      <i className="fa-solid fa-star mr-1"></i> Featured
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center space-x-2 mb-3">
                      {product.company_logo ? (
                         <img src={product.company_logo} alt={product.company_name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex justify-center items-center">
                          <i className="fa-solid fa-building text-xs text-text-muted"></i>
                        </div>
                      )}
                      <span className="text-xs font-medium text-text-muted">{product.company_name}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{product.name}</h3>
                    <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mb-3 w-fit">
                      {product.category}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">{product.description}</p>
                    
                    <div className="pt-4 border-t border-slate-100 mt-auto flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold text-text-main">{formatMoney(product.base_price)}</span>
                        <span className="text-xs text-text-muted ml-1">/ {product.unit}</span>
                      </div>
                      <button className="text-primary hover:text-primary-dark p-2 rounded-full hover:bg-border-soft transition-colors" title="Requires login to quote">
                         <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
