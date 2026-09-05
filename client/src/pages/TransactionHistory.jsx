import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatQuoteCode } from '../utils/formatters';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.data?.success) {
        setTransactions(res.data.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200"><i className="fa-solid fa-check mr-1"></i> Completed</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200"><i className="fa-solid fa-clock mr-1"></i> Pending</span>;
      case 'failed':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200"><i className="fa-solid fa-xmark mr-1"></i> Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border border-slate-200 capitalize">{status}</span>;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.quotation_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <i className="fa-solid fa-money-check-dollar"></i>
            </div>
            Transaction History
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Review and monitor all company payment activities.</p>
        </div>
        <button onClick={fetchTransactions} className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-slate-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search by ID, Customer, or Quote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {['all', 'completed', 'pending', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === status 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Quote Ref</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin text-3xl mb-4 text-primary"></i>
                    <p className="font-medium text-sm">Loading transactions...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fa-solid fa-receipt text-2xl text-slate-300"></i>
                    </div>
                    <p className="font-bold text-slate-600">No transactions found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-hashtag text-slate-300 text-xs"></i>
                        <span className="font-mono text-xs font-bold text-slate-700">{tx.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">
                        {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                      {tx.customer_name || <span className="text-slate-400 italic">Unknown Customer</span>}
                    </td>
                    <td className="px-6 py-4">
                      {tx.quotation_id ? (
                        <button 
                          onClick={() => navigate(`/app/quote/${tx.quotation_id}`)}
                          className="font-mono text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {formatQuoteCode(tx.quotation_id)}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-black text-slate-900">{formatMoney(tx.amount)}</span>
                      {tx.payment_type && (
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                          {tx.payment_type.replace('-', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                        {tx.payment_method === 'upi' ? 'UPI' : tx.payment_method === 'cod' ? 'COD' : tx.payment_method || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
