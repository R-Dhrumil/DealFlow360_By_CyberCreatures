import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';

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
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [confirmData, setConfirmData] = useState({ show: false, deal: null, targetStage: null });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(q => ({
          rawId: q.id,
          id: formatQuoteCode(q.id),
          customer: q.product_summary || q.customer_name || 'Acme Corp',
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

  const handleDrop = (targetStage) => {
    if (!draggedDeal || draggedDeal.stage === targetStage) return;
    setConfirmData({ show: true, deal: draggedDeal, targetStage });
  };

  const executeDropAction = async () => {
    const { deal, targetStage } = confirmData;
    const fromStage = deal.stage;
    
    try {
      let endpoint = '';
      
      // Smart State Machine Mapping
      if (fromStage === 'Draft' && (targetStage === 'Pending Approval' || targetStage === 'Pending Finance')) {
        endpoint = `/quotations/${deal.rawId}/submit`;
      } else if ((fromStage === 'Pending Approval' || fromStage === 'Pending Finance') && targetStage === 'Approved') {
        endpoint = `/quotations/${deal.rawId}/approve`;
      } else if ((fromStage === 'Pending Approval' || fromStage === 'Pending Finance') && targetStage === 'Draft') {
        endpoint = `/quotations/${deal.rawId}/reject`;
      } else if (fromStage === 'Approved' && targetStage === 'Confirmed') {
        endpoint = `/quotations/${deal.rawId}/confirm`;
      } else {
        alert(`Invalid Pipeline Move: You cannot drag a deal directly from ${fromStage} to ${targetStage}.`);
        setConfirmData({ show: false, deal: null, targetStage: null });
        return;
      }
      
      await api.put(endpoint);
      setConfirmData({ show: false, deal: null, targetStage: null });
      fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to move deal. Check your permissions.');
      setConfirmData({ show: false, deal: null, targetStage: null });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Deal Pipeline</h1>
          <p className="text-sm text-text-muted">Self-Governing Deal Operations Stage Tracker</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-text-muted text-sm"></i>
            <input
              type="text"
              placeholder="Search deals or customer..."
              className="pl-9 pr-4 py-2 bg-white border border-surface-soft rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64 shadow-sm"
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
            <div 
              key={stage.name} 
              className="bg-slate-100/70 border border-surface-soft/80 rounded-xl p-3 flex flex-col min-h-[500px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(stage.name);
              }}
            >
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
                    draggable={true}
                    onDragStart={() => setDraggedDeal(deal)}
                    className="bg-white rounded-lg p-4 border border-surface-soft shadow-sm hover:shadow-md hover:border-primary/60 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-semibold text-primary group-hover:underline">
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
                          to={`/app/quote/${deal.rawId || deal.id}`}
                          className="px-2 py-1 bg-slate-100 hover:bg-primary hover:text-text-main rounded text-[11px] font-medium transition-colors"
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

      {/* Confirmation Modal */}
      {confirmData.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Pipeline Move</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to move <strong className="text-primary">{confirmData.deal.id}</strong> ({confirmData.deal.customer}) 
              from <span className="font-semibold">{confirmData.deal.stage}</span> to <span className="font-semibold">{confirmData.targetStage}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmData({ show: false, deal: null, targetStage: null })}
                className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDropAction}
                className="px-4 py-2 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              >
                Yes, Move Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
