import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function OperationsDashboard() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      // Operations only cares about confirmed deals ready for fulfillment
      const res = await api.get('/quotations');
      const confirmed = res.data.filter(q => q.status === 'confirmed');
      setQuotations(confirmed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Operations Hub...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations & Fulfillment Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Manage warehouse allocation and order fulfillment.</p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-box-open text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Pending Orders</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">All confirmed deals have been fulfilled or there are no confirmed quotations in the queue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Quotation Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date Confirmed</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-sm text-slate-600">
                    <Link to={`/app/quote/${q.id}`} className="text-primary-600 hover:underline">
                      #{q.id.split('-')[0].toUpperCase()}
                    </Link>
                  </td>
                  <td className="p-4 font-medium text-slate-900">{q.customer_name}</td>
                  <td className="p-4 text-slate-500 text-sm">{new Date(q.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending Allocation
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      to={`/app/quote/${q.id}`} 
                      className="inline-flex items-center px-3 py-1.5 border border-primary-200 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      <i className="fa-solid fa-boxes-packing mr-2"></i> Allocate
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
