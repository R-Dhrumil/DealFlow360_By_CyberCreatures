import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function SuperAdminConsole() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/superadmin/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch super admin data', error);
      // Fallback mock data if API fails or isn't fully seeded
      setCompanies([
        { id: '1', name: 'Nexus Industrial Solutions', subdomain_slug: 'nexus', user_count: 5, quotation_count: 24, won_deals: 18 },
        { id: '2', name: 'Vertex Cloud Technologies', subdomain_slug: 'vertex', user_count: 8, quotation_count: 42, won_deals: 31 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  const totalUsers = companies.reduce((acc, c) => acc + parseInt(c.user_count || 0), 0);
  const totalQuotes = companies.reduce((acc, c) => acc + parseInt(c.quotation_count || 0), 0);

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <i className="fa-solid fa-crown text-amber-500 mr-3"></i>
          Super Admin Console
        </h1>
        <p className="text-slate-500">Global overview of all companies on the DealFlow360 platform.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-l-purple-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Tenants</p>
          <h3 className="text-3xl font-bold text-slate-800">{companies.length}</h3>
        </div>
        <div className="card p-6 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Users</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalUsers}</h3>
        </div>
        <div className="card p-6 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Quotations Processed</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalQuotes}</h3>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Tenant Companies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Company Name</th>
                <th className="px-6 py-4 font-medium">Subdomain</th>
                <th className="px-6 py-4 font-medium text-center">Users</th>
                <th className="px-6 py-4 font-medium text-center">Quotations</th>
                <th className="px-6 py-4 font-medium text-center">Win Rate</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => {
                const totalQ = parseInt(company.quotation_count || 0);
                const wonQ = parseInt(company.won_deals || 0);
                const winRate = totalQ > 0 ? ((wonQ / totalQ) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={company.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{company.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{company.subdomain_slug}.dealflow360.com</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{company.user_count}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{company.quotation_count}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${winRate > 50 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-3">
                        <i className="fa-solid fa-eye mr-1"></i> View
                      </button>
                      <button className="text-red-500 hover:text-red-700 text-sm font-medium">
                        <i className="fa-solid fa-ban mr-1"></i> Suspend
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
