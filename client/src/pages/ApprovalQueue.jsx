import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/approvals/pending');
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to fetch approvals', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (quotationId, action) => {
    if ((action === 'reject' || action === 'return') && !reason) {
      alert(`Please provide a reason for ${action === 'reject' ? 'rejection' : 'returning'}.`);
      return;
    }

    try {
      await api.post(`/approvals/${quotationId}/action`, { action, reason });
      alert(`Quotation ${action}ed successfully.`);
      setReason('');
      setExpandedId(null);
      fetchApprovals();
    } catch (error) {
      console.error(`Failed to ${action} quotation`, error);
      alert('Action failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
        <p className="text-text-muted">Review quotations that exceeded discount ceilings.</p>
      </header>

      {approvals.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-check-circle text-green-500 text-5xl mb-4"></i>
          <h3 className="text-lg font-medium text-slate-800">All caught up!</h3>
          <p className="text-text-muted mt-2">There are no quotations pending your approval right now.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-surface-soft">
                <tr className="text-sm font-medium text-slate-600">
                  <th className="px-6 py-4">Quotation ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Sales Rep</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Blended Risk Score</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((approval) => (
                  <React.Fragment key={approval.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-text-muted">{approval.id.split('-')[0]}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{approval.customer_name}</td>
                      <td className="px-6 py-4 text-slate-600">{approval.rep_name}</td>
                      <td className="px-6 py-4 text-text-muted text-sm">{new Date(approval.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          <i className="fa-solid fa-triangle-exclamation"></i>
                          <span>{parseFloat(approval.blended_risk_score).toFixed(2)}%</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
                          className="text-text-muted hover:text-primary-600 px-3 py-1"
                        >
                          {expandedId === approval.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === approval.id && (
                      <tr className="bg-slate-50 border-b-2 border-surface-soft">
                        <td colSpan="6" className="px-6 py-6">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Line Items Causing Risk</h4>
                          <div className="bg-white rounded border border-surface-soft p-4 mb-4">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="text-text-muted border-b border-slate-100">
                                  <th className="pb-2">Product</th>
                                  <th className="pb-2">Qty</th>
                                  <th className="pb-2 text-right">Unit Price</th>
                                  <th className="pb-2 text-right">Discount Given</th>
                                  <th className="pb-2 text-right text-red-500">Margin Impact</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {approval.lines.map(line => (
                                  <tr key={line.id}>
                                    <td className="py-2 font-medium text-slate-800">{line.product_name} <span className="text-xs font-normal text-text-muted block">{line.category}</span></td>
                                    <td className="py-2 text-slate-600">{line.quantity}</td>
                                    <td className="py-2 text-slate-600 text-right">${parseFloat(line.unit_price).toFixed(2)}</td>
                                    <td className="py-2 text-right">
                                      <span className="font-medium text-slate-800">{parseFloat(line.discount_percent)}%</span>
                                    </td>
                                    <td className="py-2 text-right">
                                      {parseFloat(line.discount_percent) > parseFloat(line.margin_percent) / 2 ? (
                                        <i className="fa-solid fa-circle text-red-500 text-xs"></i>
                                      ) : (
                                        <i className="fa-solid fa-circle text-yellow-500 text-xs"></i>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-4 items-end justify-between border-t border-surface-soft pt-4 mt-2">
                            <div className="w-full md:w-1/2">
                              <label className="block text-sm font-medium text-slate-700 mb-1">Reason (required for Reject/Return)</label>
                              <textarea 
                                className="input-field h-20 resize-none" 
                                placeholder="E.g., Discount is too high for this volume..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                              ></textarea>
                            </div>
                            <div className="flex space-x-3 w-full md:w-auto mt-4 md:mt-0">
                              <button onClick={() => handleAction(approval.id, 'return')} className="btn-secondary w-full md:w-auto">
                                <i className="fa-solid fa-rotate-left mr-2"></i>Return to Rep
                              </button>
                              <button onClick={() => handleAction(approval.id, 'reject')} className="btn-danger w-full md:w-auto">
                                <i className="fa-solid fa-xmark mr-2"></i>Reject
                              </button>
                              <button onClick={() => handleAction(approval.id, 'approve')} className="btn-primary bg-green-600 hover:bg-green-700 ring-green-500 w-full md:w-auto">
                                <i className="fa-solid fa-check mr-2"></i>Approve
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
