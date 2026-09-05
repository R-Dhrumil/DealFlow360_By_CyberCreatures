import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/client';
import { formatQuoteCode } from '../utils/formatters';

const STAGES = [
  { name: 'Draft', color: 'border-slate-300 bg-slate-100 text-slate-700' },
  { name: 'Pending Approval', color: 'border-amber-status bg-amber-50 text-amber-800' },
  { name: 'Pending Finance', color: 'border-purple-400 bg-purple-50 text-purple-800' },
  { name: 'Approved', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
  { name: 'Confirmed', color: 'border-blue-400 bg-blue-50 text-blue-800' },
  { name: 'Rejected', color: 'border-rose-400 bg-rose-50 text-rose-800' }
];

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5001`;
};

export default function Pipeline() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmData, setConfirmData] = useState({ show: false, deal: null, targetStage: null });

  useEffect(() => {
    fetchQuotations();

    // Socket.IO Listener for real-time pipeline updates across connected clients
    const socket = io(getSocketUrl(), {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 10,
    });

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    socket.on('connect', () => {
      if (user) {
        socket.emit('register_user', {
          userId: user.id || user.userId,
          role: user.role,
          companyId: user.company_id || user.companyId || 'c1',
        });
      }
    });

    socket.on('pipeline_updated', () => {
      fetchQuotations(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchQuotations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/quotations');
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(q => ({
          rawId: q.id,
          id: formatQuoteCode(q.id),
          customer: q.product_summary || q.customer_name || 'Acme Corp',
          amount: parseFloat(q.total_amount || 0),
          riskScore: parseFloat(q.blended_risk_score || 0),
          stage: q.status === 'draft' ? 'Draft' 
               : q.status === 'pending_approval' ? 'Pending Approval' 
               : q.status === 'pending_finance_approval' ? 'Pending Finance' 
               : q.status === 'approved' ? 'Approved' 
               : q.status === 'rejected' ? 'Rejected'
               : 'Confirmed',
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
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredDeals = deals.filter(d =>
    d.customer.toLowerCase().includes(filterText.toLowerCase()) ||
    d.id.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleSubmitForApproval = async (e, quoteId) => {
    e.stopPropagation();
    try {
      await api.put(`/quotations/${quoteId}/submit`);
      await fetchQuotations(false);
    } catch (err) {
      console.error('Failed to submit quote for approval:', err);
      try {
        await api.put(`/quotations/${quoteId}/counter`, { lines: [], status: 'pending_approval' });
        await fetchQuotations(false);
      } catch (err2) {
        console.error('Fallback submit failed:', err2);
      }
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.setData('text/plain', deal.rawId || deal.id);
  };

  const handleDragOver = (e, stageName) => {
    e.preventDefault();
    if (dragOverStage !== stageName) {
      setDragOverStage(stageName);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStageName) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedDeal) return;
    if (draggedDeal.stage === targetStageName) return;

    setConfirmData({
      show: true,
      deal: draggedDeal,
      targetStage: targetStageName
    });
  };

  const executeDropAction = async () => {
    const { deal, targetStage } = confirmData;
    if (!deal || !targetStage) return;

    setIsSubmitting(true);

    // Optimistic local state update for instantaneous zero-delay UI feedback
    setDeals(prevDeals =>
      prevDeals.map(d => (d.rawId === deal.rawId || d.id === deal.id ? { ...d, stage: targetStage } : d))
    );

    const stageToStatusMap = {
      'Draft': 'draft',
      'Pending Approval': 'pending_approval',
      'Pending Finance': 'pending_finance_approval',
      'Approved': 'approved',
      'Confirmed': 'confirmed',
      'Rejected': 'rejected'
    };

    const newStatus = stageToStatusMap[targetStage] || 'draft';

    try {
      if (newStatus === 'pending_approval') {
        try {
          await api.put(`/quotations/${deal.rawId || deal.id}/submit`);
        } catch (e) {
          await api.put(`/quotations/${deal.rawId || deal.id}/counter`, { lines: [], status: newStatus });
        }
      } else if (newStatus === 'approved') {
        try {
          await api.put(`/quotations/${deal.rawId || deal.id}/approve`);
        } catch (e) {
          await api.put(`/quotations/${deal.rawId || deal.id}/counter`, { lines: [], status: newStatus });
        }
      } else if (newStatus === 'rejected') {
        try {
          await api.put(`/quotations/${deal.rawId || deal.id}/reject`, { reason: 'Moved to Rejected via Deal Pipeline Drag & Drop' });
        } catch (e) {
          await api.put(`/quotations/${deal.rawId || deal.id}/counter`, { lines: [], status: newStatus });
        }
      } else if (newStatus === 'confirmed') {
        try {
          await api.put(`/quotations/${deal.rawId || deal.id}/confirm`);
        } catch (e) {
          await api.put(`/quotations/${deal.rawId || deal.id}/counter`, { lines: [], status: newStatus });
        }
      } else {
        await api.put(`/quotations/${deal.rawId || deal.id}/counter`, { lines: [], status: newStatus });
      }

      await fetchQuotations(false);
    } catch (err) {
      console.error('Failed to update deal stage via drag & drop:', err);
      await fetchQuotations(false);
    } finally {
      setIsSubmitting(false);
      setDraggedDeal(null);
      setConfirmData({ show: false, deal: null, targetStage: null });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Deal Pipeline</h1>
          <p className="text-sm text-text-muted">Interactive Kanban Stage Tracker & Self-Governing Pipeline</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex items-center">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none"></i>
            <input
              type="text"
              placeholder="Search deals or customer..."
              className="pl-9 pr-4 py-2 bg-white border border-surface-soft rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64 shadow-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <Link to="/app/quote" className="btn-primary flex items-center shadow-md bg-primary text-on-primary shadow-sm p-2 rounded-xl">
            <i className="fa-solid fa-plus mr-2"></i> Create Quotation
          </Link>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-text-main">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-hand-pointer text-primary text-sm"></i>
          <span><strong>Tip:</strong> Drag any deal card and drop it into an allowed column. A confirmation modal will appear to request your permission before updating the stage.</span>
        </div>
        <button 
          onClick={fetchQuotations}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i> Refresh
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-6">
        {STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.name);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);
          const isOver = dragOverStage === stage.name;

          return (
            <div 
              key={stage.name} 
              className={`rounded-xl p-3 flex flex-col min-h-[520px] transition-all duration-150 border-2 ${
                isOver 
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md' 
                  : 'bg-slate-100/80 border-surface-soft/80'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragEnter={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 border-b border-surface-soft mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${stage.color}`}>
                    {stageDeals.length}
                  </span>
                  <h3 className="font-bold text-slate-800 text-xs tracking-tight">{stage.name}</h3>
                </div>
                <span className="text-xs font-semibold text-text-muted">
                  ${(stageTotal / 1000).toFixed(1)}k
                </span>
              </div>

              {/* Deal Cards Container */}
              <div className="flex-1 space-y-3">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className="bg-white rounded-lg p-4 border border-surface-soft shadow-sm hover:shadow-md hover:border-primary/60 transition-all cursor-grab active:cursor-grabbing group space-y-3"
                  >
                    <div className="flex justify-between items-start">
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

                    <div>
                      <h4 className="font-bold text-text-main text-sm mb-1">{deal.customer}</h4>
                      <p className="text-lg font-black text-slate-800">${deal.amount.toLocaleString()}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs text-text-muted gap-y-2">
                      <span><i className="fa-solid fa-box mr-1"></i> {deal.linesCount} items</span>
                      <div className="flex space-x-1 flex-wrap gap-1">
                        {/* Stage Specific Action Buttons */}
                        {deal.stage === 'Draft' && (
                          <button
                            onClick={(e) => handleSubmitForApproval(e, deal.rawId || deal.id)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition-colors flex items-center space-x-1 shadow-xs"
                          >
                            <i className="fa-solid fa-paper-plane text-[9px]"></i>
                            <span>Submit</span>
                          </button>
                        )}

                        {deal.stage.includes('Approval') && (
                          <Link
                            to="/app/approvals"
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold transition-colors flex items-center space-x-1 shadow-xs"
                          >
                            <i className="fa-solid fa-user-check text-[9px]"></i>
                            <span>Review</span>
                          </Link>
                        )}

                        <Link
                          to={`/app/quote/${deal.rawId || deal.id}`}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                        >
                          View
                        </Link>

                        <Link
                          to={`/portal/${deal.rawId || deal.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-medium transition-colors"
                          title="Open Customer Portal"
                        >
                          <i className="fa-solid fa-external-link text-[10px]"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className={`h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-center p-2 transition-colors ${
                    isOver 
                      ? 'border-primary text-primary font-bold bg-primary/5' 
                      : 'border-surface-soft text-text-muted'
                  }`}>
                    {isOver ? 'Drop deal here' : `No deals in ${stage.name}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Permission Modal */}
      {confirmData.show && confirmData.deal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mb-4">
              <i className="fa-solid fa-arrows-turn-to-dots"></i>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Pipeline Move</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to move <strong className="text-primary font-mono">{confirmData.deal.id}</strong> (<em>{confirmData.deal.customer}</em>) 
              from <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">{confirmData.deal.stage}</span> to <span className="inline-block px-2 py-0.5 rounded bg-primary/10 font-bold text-primary">{confirmData.targetStage}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmData({ show: false, deal: null, targetStage: null })}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={executeDropAction}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i> Moving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i> Yes, Move Deal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
