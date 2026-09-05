import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const LANDING_PRODUCTS = [
  { id: 'p1', sku: 'HW-SRV-01', name: 'Enterprise Server X1', category: 'Hardware', base_price: 5000, unit: 'unit', description: 'High-performance enterprise server rack unit engineered for AI models & mission-critical database workloads.', features: ['Dual Xeon Processors', '512GB ECC RAM', 'Redundant Power Supply'] },
  { id: 'p2', sku: 'SW-LIC-01', name: 'SaaS Platform License', category: 'Software', base_price: 100, unit: 'user/month', description: 'Cloud analytics & CPQ platform license with automated pipeline tracking & margin risk scoring.', features: ['Automated Margin Scoring', 'Real-time CPQ Builder', 'E-Signature Integration'] },
  { id: 'p3', sku: 'SVC-ONB-01', name: 'Implementation Services', category: 'Services', base_price: 2500, unit: 'package', description: 'Onboarding & custom integration support package with 24/7 dedicated solutions engineer access.', features: ['Custom ERP Integration', 'Dedicated Solutions Engineer', '24/7 Priority SLA'] },
  { id: 'p4', sku: 'HW-NET-02', name: 'Gigabit Switch 48-Port', category: 'Hardware', base_price: 1800, unit: 'unit', description: 'Enterprise managed Layer-3 network switch with PoE+ power delivery across all ports.', features: ['48 PoE+ Gigabit Ports', '10G SFP+ Uplinks', 'Stackable Architecture'] },
  { id: 'p5', sku: 'SW-SEC-05', name: 'Endpoint Security Suite', category: 'Software', base_price: 45, unit: 'device/month', description: 'Next-generation antivirus, zero-day threat prevention, and real-time endpoint security protection.', features: ['AI Threat Detection', 'Zero-Day Protection', 'Centralized Admin Portal'] },
  { id: 'p6', sku: 'CLD-STR-09', name: 'Cloud Storage Vault 10TB', category: 'Cloud License', base_price: 350, unit: 'month', description: 'Ultra-secure encrypted cloud storage vault with instant failover recovery and disaster backup.', features: ['AES-256 Encryption', 'Instant Failover', 'Multi-Region Replication'] },
];

export default function LandingPage() {
  const [settings, setSettings] = useState({
    site_name: 'DealFlow360',
    tagline: 'B2B Sales Operations & CPQ Platform',
    logo_url: ''
  });

  const [products, setProducts] = useState(LANDING_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    api.get('/settings/public').then(res => {
      if (res.data) {
        setSettings({
          site_name: res.data.site_name || 'DealFlow360',
          tagline: res.data.tagline || 'B2B Sales Operations & CPQ Platform',
          logo_url: res.data.logo_url || ''
        });
      }
    }).catch(console.error);

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/marketplace/products');
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Using default landing products');
    }
  };

  const categories = ['All', 'Hardware', 'Software', 'Services', 'Cloud License'];

  const filteredProducts = products.filter(p => {
    return selectedCategory === 'All' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-md">
              DF
            </div>
            <span className="font-extrabold text-white text-xl tracking-wide">{settings.site_name}</span>
          </div>

          <div className="flex space-x-3 items-center">
            <Link to="/marketplace" className="text-slate-300 hover:text-white font-semibold text-xs px-3 py-2">
              Marketplace
            </Link>
            <Link to="/login" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow">
              Sign In / Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 sm:px-6 lg:px-8 py-16 bg-slate-950 text-white">
        <div className="max-w-4xl space-y-6">
          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Enterprise CPQ & Operations Platform
          </span>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            The Next Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">{settings.site_name}</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            {settings.tagline} — Streamlining product price listings, discount governance, multi-tier approvals & customer quotations.
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <Link to="/login" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center">
              <i className="fa-solid fa-rocket mr-2"></i>
              Launch Operations Hub
            </Link>
            <Link to="/login" className="bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold px-8 py-3.5 rounded-xl transition-all text-xs flex items-center justify-center">
              <i className="fa-solid fa-user-tie mr-2"></i>
              Customer Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* REPLACED SECTION: Products Listing by Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Catalog & Solutions by Category
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Explore official products configured by business administrators with real-time base list pricing
          </p>
        </div>

        {/* Category Pills Filter */}
        <div className="flex justify-center flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${selectedCategory === cat
                  ? 'bg-purple-600 text-white ring-2 ring-purple-500/50 shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              {cat === 'All' ? '🌐 All Categories' :
                cat === 'Hardware' ? '🖥️ Hardware' :
                  cat === 'Software' ? '💻 Software' :
                    cat === 'Services' ? '🛠️ Services' : '☁️ Cloud License'}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    {p.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{p.sku || 'SKU-00' + p.id}</span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{p.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>

                {p.features && (
                  <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center text-[11px]">
                        <i className="fa-solid fa-check text-emerald-500 mr-2 text-xs"></i>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-xs text-slate-400 font-medium">Starting List Price:</span>
                  <span className="text-2xl font-black text-purple-700">
                    ${typeof p.base_price === 'number' ? p.base_price.toLocaleString() : p.base_price}
                    <span className="text-xs text-slate-400 font-normal"> / {p.unit || 'unit'}</span>
                  </span>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full bg-slate-900 hover:bg-purple-600 text-white text-xs font-bold py-3 px-4 rounded-xl shadow transition-colors text-center block"
              >
                Sign In to Request Quotation
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 py-8 text-center border-t border-slate-800 text-white mt-auto">
        <p className="text-slate-400 text-xs font-medium">
          DealFlow360 Sales Operations Platform &bull; Built by CyberCreatures
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
