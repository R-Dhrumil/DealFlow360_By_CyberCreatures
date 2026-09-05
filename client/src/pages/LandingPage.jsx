import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-store text-primary-600 text-2xl"></i>
            <span className="font-bold text-slate-900 text-xl tracking-wide">DealFlow360</span>
          </div>
          <div className="flex space-x-4 items-center">
            <Link to="/marketplace" className="text-slate-600 hover:text-primary-600 font-medium text-sm">
              Explore Marketplace
            </Link>
            <Link to="/login" className="btn-primary text-sm px-4 py-2">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl">
          The Next Generation <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-500">B2B Sales Operations</span> Platform
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
          Streamline quotations, manage complex multi-warehouse fulfillments, and accelerate deal approvals with intelligent, risk-aware workflows.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
            <i className="fa-solid fa-rocket mr-2"></i>
            Business Dashboard Demo
          </Link>
          <Link to="/portal/DEMO-123" className="bg-white text-slate-700 border border-slate-300 hover:border-slate-400 font-semibold px-8 py-4 rounded-lg shadow hover:shadow-md transition-all flex items-center justify-center">
            <i className="fa-solid fa-user-tie mr-2"></i>
            Customer Portal Demo
          </Link>
        </div>

        <div className="mt-24 w-full text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Complete Feature Suite</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto text-left">
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <i className="fa-solid fa-calculator text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Quotations</h3>
              <p className="text-slate-600 text-sm">Dynamic builder separating one-time hardware and recurring SaaS fees, presenting clean ROI to customers.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-4">
                <i className="fa-solid fa-arrow-trend-up text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Upsell Engine</h3>
              <p className="text-slate-600 text-sm">Intelligently recommends complementary products to boost deal values automatically during quotation.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <i className="fa-solid fa-shield-halved text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Blended Risk Scoring</h3>
              <p className="text-slate-600 text-sm">Intelligently route approvals based on value-weighted discount excesses across customer tiers and categories.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 mb-4">
                <i className="fa-solid fa-check-double text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Tier Approvals</h3>
              <p className="text-slate-600 text-sm">Manager and Finance-level approval workflows for high-risk deals, preventing margin erosion.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mb-4">
                <i className="fa-solid fa-truck-fast text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fulfillment Splitting</h3>
              <p className="text-slate-600 text-sm">Automatically split complex orders across multiple warehouses based on real-time stock, with manual overrides.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <i className="fa-solid fa-pen-nib text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">E-Signatures & Portal</h3>
              <p className="text-slate-600 text-sm">Dedicated branded customer portal with interactive chat negotiation and HTML5 canvas e-signatures.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
                <i className="fa-solid fa-chart-pie text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Deal Health Dashboard</h3>
              <p className="text-slate-600 text-sm">Real-time analytics tracking win rates, pending approvals, and active high-risk deals across your pipeline.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <i className="fa-solid fa-globe text-xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Tenant Architecture</h3>
              <p className="text-slate-600 text-sm">A robust Super Admin console managing multiple distinct tenant companies, users, and data isolation securely.</p>
            </div>

          </div>
        </div>
      </main>

      <footer className="bg-slate-900 py-8 text-center border-t border-slate-800">
        <p className="text-slate-400 text-sm">
          Built for the 24-Hour Hackathon &bull; By CyberCreatures
        </p>
      </footer>
    </div>
  );
}
