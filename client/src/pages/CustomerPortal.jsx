import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client'; // Assuming customer has some token or public access token

export default function CustomerPortal() {
  const { id: quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // E-Signature state
  const [showSignModal, setShowSignModal] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchQuotationAndMessages();
  }, [quotationId]);

  const fetchQuotationAndMessages = async () => {
    try {
      // Mock data for demo since we haven't built all the specific endpoints
      setQuotation({
        id: quotationId,
        status: 'presented',
        company_name: 'CyberCreatures',
        company_logo: null,
        created_at: new Date().toISOString(),
        lines: [
          { id: 1, product_name: 'Enterprise Server X1', category: 'Hardware', line_type: 'one_time', quantity: 2, unit_price: 5000, discount_percent: 10 },
          { id: 2, product_name: 'SaaS Platform License', category: 'Software', line_type: 'recurring', quantity: 50, unit_price: 100, discount_percent: 15 },
        ]
      });
      
      setMessages([
        { id: 1, sender_type: 'sales_rep', content: 'Hi there! Here is the latest proposal we discussed.', created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setLoading(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Optimistic UI update
    const newMsg = {
      id: Date.now(),
      sender_type: 'customer',
      content: newMessage,
      created_at: new Date().toISOString()
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // In a real app, we would POST this to the server
    // api.post(`/quotations/${quotationId}/messages`, { content: newMessage })
  };

  const handleAction = (action) => {
    if (action === 'accept') {
      setShowSignModal(true);
    } else {
      alert('Changes requested. Sales rep notified.');
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = () => {
    // In a real app, you would get the data URL and POST to the server
    // const signatureDataUrl = canvasRef.current.toDataURL();
    alert('Quotation accepted and digitally signed! The sales rep will be notified.');
    setQuotation({ ...quotation, status: 'accepted' });
    setShowSignModal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Customer Portal Header - Distinct styling from internal app */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {quotation.company_logo ? (
              <img src={quotation.company_logo} alt="Company Logo" className="h-8" />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold">
                {quotation.company_name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-slate-800">{quotation.company_name} Proposal</span>
          </div>
          <div className="text-sm text-slate-500">
            Quotation #{quotation.id?.split('-')[0]}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Proposal Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Proposal Details</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  quotation.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {quotation.status}
                </span>
              </div>
              
              <div className="p-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200">
                      <th className="pb-3">Product / Service</th>
                      <th className="pb-3 text-right">Type</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-right">Net Price</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotation.lines.map(line => {
                      const netPrice = line.unit_price * (1 - line.discount_percent / 100);
                      return (
                        <tr key={line.id}>
                          <td className="py-4">
                            <p className="font-medium text-slate-800">{line.product_name}</p>
                            {line.discount_percent > 0 && (
                              <p className="text-xs text-green-600 mt-1 font-medium">Includes {line.discount_percent}% discount</p>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              {line.line_type === 'recurring' ? 'Monthly' : 'One-time'}
                            </span>
                          </td>
                          <td className="py-4 text-right text-slate-600">{line.quantity}</td>
                          <td className="py-4 text-right text-slate-600">${netPrice.toFixed(2)}</td>
                          <td className="py-4 text-right font-semibold text-slate-800">${(netPrice * line.quantity).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Negotiation Chat */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center">
                  <i className="fa-regular fa-comments mr-2 text-slate-400"></i>
                  Discussion
                </h3>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'customer' 
                        ? 'bg-primary-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.sender_type === 'customer' ? 'text-primary-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input 
                    type="text" 
                    className="input-field flex-1" 
                    placeholder="Type a message or request changes..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">One-time Costs</span>
                  <span className="font-medium text-slate-800">$9,000.00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Monthly Recurring</span>
                  <span className="font-medium text-slate-800">$4,250.00/mo</span>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-slate-700">Total Due Today</span>
                  <span className="text-2xl font-bold text-slate-900">$9,000.00</span>
                </div>
              </div>

              {quotation.status !== 'accepted' ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleAction('accept')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
                  >
                    <i className="fa-solid fa-check mr-2"></i> Accept Proposal
                  </button>
                  <button 
                    onClick={() => document.querySelector('input[type="text"]').focus()}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
                  >
                    <i className="fa-regular fa-comment-dots mr-2"></i> Request Changes
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <i className="fa-solid fa-circle-check text-green-500 text-3xl mb-2"></i>
                  <h4 className="font-bold text-green-800">Proposal Accepted</h4>
                  <p className="text-sm text-green-700 mt-1">Thank you for your business. We will be in touch shortly.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>

      {/* E-Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sign Proposal</h3>
            <p className="text-slate-500 mb-6 text-sm">Please draw your signature below to legally accept Quotation #{quotation.id?.split('-')[0]}.</p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 mb-4 overflow-hidden touch-none">
              <canvas 
                ref={canvasRef}
                width={450}
                height={200}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              ></canvas>
            </div>
            
            <div className="flex justify-between items-center">
              <button onClick={clearSignature} className="text-slate-500 hover:text-slate-700 text-sm font-medium">
                <i className="fa-solid fa-eraser mr-1"></i> Clear
              </button>
              <div className="space-x-3">
                <button onClick={() => setShowSignModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={submitSignature} className="btn-primary">
                  Sign & Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
