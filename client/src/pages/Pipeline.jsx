import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const STAGES = [
  { name: 'Draft', color: 'border-slate-300 bg-slate-100 text-slate-700' },
  { name: 'Pending Approval', color: 'border-amber-status bg-amber-50 text-amber-800' },
  { name: 'Pending Finance', color: 'border-purple-400 bg-purple-50 text-purple-800' },
  { name: 'Approved', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { name: 'Confirmed', color: 'border-blue-400 bg-blue-50 text-blue-800' }
];

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(q => ({
          id: q.id.slice(0, 8),
          customer: q.customer_name || 'Acme Corp',
          amount: parseFloat(q.total_amount || 0),
          riskScore: parseFloat(q.blended_risk_score || 0),
          stage: q.status === 'draft' ? 'Draft' : q.status === 'pending_approval' ? 'Pending Approval' : q.status === 'pending_finance_approval' ? 'Pending Finance' : q.status === 'approved' ? 'Approved' : 'Confirmed',
          rep: q.sales_rep_name || 'Alex Rep',
          linesCount: parseInt(q.lines_count || 1, 10),
          updatedAt: 'Recently'
        }));
        setDeals(formatted);
      } else {
        setDeals([]);
      }
    } catch (err) {
      setDeals([]);
    }
  };

  const filteredDeals = deals.filter(d => 
    d.customer.toLowerCase().includes(filterText.toLowerCase()) || 
    d.id.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Deal Pipeline (Kanban)</h1>
          <p className="text-sm text-text-muted">Self-Governing Deal Operations Stage Tracker</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-text-muted text-sm"></i>
            <input
              type="text"
              placeholder="Search deals or customer..."
              className="pl-9 pr-4 py-2 bg-white border border-surface-soft rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 shadow-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <Link to="/app/quote" className="btn-primary flex items-center shadow-md">
            <i className="fa-solid fa-plus mr-2"></i> Create Quotation
          </Link>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.name);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div key={stage.name} className="bg-slate-100/70 border border-surface-soft/80 rounded-xl p-3 flex flex-col min-h-[500px]">
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 border-b border-surface-soft mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${stage.color}`}>
                    {stageDeals.length}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm">{stage.name}</h3>
                </div>
                <span className="text-xs font-semibold text-text-muted">
                  ${(stageTotal / 1000).toFixed(1)}k
                </span>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 space-y-3">
                {stageDeals.map(deal => (
                  <div 
                    key={deal.id}
                    className="bg-white rounded-lg p-4 border border-surface-soft shadow-sm hover:shadow-md hover:border-primary-400 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-semibold text-primary-600 group-hover:underline">
                        {deal.id}
                      </span>
                      {deal.riskScore > 0 ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                          <i className="fa-solid fa-triangle-exclamation mr-1"></i> {deal.riskScore}% Risk
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-text-main text-sm mb-1">{deal.customer}</h4>
                    <p className="text-lg font-black text-slate-800 mb-3">${deal.amount.toLocaleString()}</p>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-text-muted">
                      <span><i className="fa-solid fa-box mr-1"></i> {deal.linesCount} items</span>
                      <div className="flex space-x-1">
                        <Link 
                          to={`/app/quote/${deal.id}`}
                          className="px-2 py-1 bg-slate-100 hover:bg-primary-600 hover:text-text-main rounded text-[11px] font-medium transition-colors"
                        >
                          View
                        </Link>
                        {deal.stage.includes('Approval') && (
                          <Link 
                            to="/app/approvals"
                            className="px-2 py-1 bg-amber-500 text-text-main rounded text-[11px] font-semibold hover:bg-amber-600 transition-colors"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-surface-soft rounded-lg flex items-center justify-center text-xs text-text-muted">
                    No deals in {stage.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
