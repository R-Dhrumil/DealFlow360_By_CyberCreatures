import React, { useState } from 'react';
import { useCurrency, DEFAULT_CURRENCIES } from '../contexts/CurrencyContext';

const CURRENCY_LABELS = {
  INR: { description: 'Base currency. All values stored in INR.', locked: true },
};

export default function CurrencySettings() {
  const { currencies, saveRates, customRates } = useCurrency();

  // Local state for editing rates
  const [rates, setRates] = useState(() => {
    const map = {};
    DEFAULT_CURRENCIES.forEach(c => {
      map[c.code] = customRates?.[c.code] ?? c.rateFromINR;
    });
    return map;
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (code, value) => {
    setRates(prev => ({ ...prev, [code]: parseFloat(value) || 0 }));
    setSaved(false);
    setError('');
  };

  const handleSave = () => {
    // Validate: INR must stay 1
    if (Number(rates['INR']) !== 1) {
      setError('INR rate must always be 1 (base currency).');
      return;
    }
    for (const [code, rate] of Object.entries(rates)) {
      if (isNaN(rate) || rate <= 0) {
        setError(`Invalid rate for ${code}. Must be a positive number.`);
        return;
      }
    }
    saveRates(rates);
    setSaved(true);
  };

  const handleReset = () => {
    const map = {};
    DEFAULT_CURRENCIES.forEach(c => { map[c.code] = c.rateFromINR; });
    setRates(map);
    saveRates(map);
    setSaved(true);
  };

  // Preview: 1000 INR in each currency
  const previewINR = 1000;

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <i className="fa-solid fa-coins text-lg"></i>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Currency Settings</h1>
            <p className="text-sm text-slate-500">Set exchange rates relative to Indian Rupee (INR — base currency)</p>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2 max-w-2xl">
          <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
          <span>All monetary values are stored internally in <strong>₹ INR</strong>. Exchange rates you set here are applied only for display purposes across the platform.</span>
        </div>
      </div>

      {/* Rate Editor */}
      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-0 bg-slate-100 border-b border-slate-200 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <div className="col-span-1">Flag</div>
            <div className="col-span-2">Code</div>
            <div className="col-span-3">Currency</div>
            <div className="col-span-3">Rate (1 INR =)</div>
            <div className="col-span-3 text-right">Preview (₹1000)</div>
          </div>

          {/* Currency Rows */}
          <div className="divide-y divide-slate-100">
            {DEFAULT_CURRENCIES.map(c => {
              const rate = rates[c.code] ?? c.rateFromINR;
              const isBase = c.code === 'INR';
              const preview = (previewINR * rate).toLocaleString(undefined, {
                minimumFractionDigits: isBase ? 0 : 2,
                maximumFractionDigits: isBase ? 0 : 4,
              });

              return (
                <div
                  key={c.code}
                  className={`grid grid-cols-12 gap-0 px-6 py-4 items-center transition-colors ${isBase ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}`}
                >
                  <div className="col-span-1 text-2xl">{c.flag}</div>
                  <div className="col-span-2">
                    <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-md ${isBase ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {c.code}
                    </span>
                    {isBase && (
                      <span className="ml-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">BASE</span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-semibold text-slate-800">{c.symbol} {c.name}</p>
                  </div>
                  <div className="col-span-3">
                    <div className="relative max-w-[150px]">
                      <input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        value={rate}
                        disabled={isBase}
                        onChange={(e) => handleChange(c.code, e.target.value)}
                        className={`w-full text-sm font-mono rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 transition-all ${
                          isBase
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-400/30 focus:border-indigo-400 hover:border-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {c.symbol}{preview}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-xmark"></i> {error}
          </div>
        )}

        {/* Success */}
        {saved && !error && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i> Exchange rates saved successfully! All users will see updated values.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            Save Exchange Rates
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-rotate-left"></i>
            Reset to Defaults
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-indigo-500"></i>
            How Exchange Rates Work
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-arrow-right text-indigo-400 mt-0.5 shrink-0"></i>
              <span><strong>Base Currency:</strong> All deal values, quotations, and revenue figures are stored in ₹ INR.</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-arrow-right text-indigo-400 mt-0.5 shrink-0"></i>
              <span><strong>Rate Format:</strong> Enter how many units of each currency equal 1 INR. E.g., 1 INR = 0.012 USD.</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-arrow-right text-indigo-400 mt-0.5 shrink-0"></i>
              <span><strong>Display Only:</strong> Rates affect only the display; the underlying stored value remains unchanged in INR.</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="fa-solid fa-arrow-right text-indigo-400 mt-0.5 shrink-0"></i>
              <span><strong>Persistence:</strong> Rates are saved in browser storage and apply globally across all user sessions on this device.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
