import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function CurrencyPicker({ className = '' }) {
  const { currencies, selected, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
        title="Select Display Currency"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-mono">{selected.code}</span>
        <span className="text-slate-400 font-medium">{selected.symbol}</span>
        <i className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-left">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Currency</p>
            <p className="text-[10px] text-slate-500">Converted in real-time for display</p>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {currencies.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  c.code === selected.code
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">
                    {c.code} <span className="font-normal text-slate-400">· {c.symbol}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{c.name}</p>
                </div>
                {c.code === selected.code && (
                  <i className="fa-solid fa-check text-indigo-600 text-xs shrink-0"></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
