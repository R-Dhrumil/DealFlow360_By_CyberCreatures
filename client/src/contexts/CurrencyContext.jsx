import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  DEFAULT_CURRENCIES, 
  STORAGE_KEY_CURRENCY, 
  STORAGE_KEY_RATES,
  formatCurrency as formatCurrencyUtil 
} from '../utils/currency';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Load custom rates set by super admin (override defaults)
  const loadRates = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  };

  const [customRates, setCustomRates] = useState(loadRates);
  const [selectedCode, setSelectedCode] = useState(
    () => localStorage.getItem(STORAGE_KEY_CURRENCY) || 'INR'
  );

  // Merge defaults with any admin-overridden rates
  const currencies = DEFAULT_CURRENCIES.map(c => ({
    ...c,
    rateFromINR: customRates?.[c.code] ?? c.rateFromINR,
  }));

  const selected = currencies.find(c => c.code === selectedCode) || currencies[0];

  // Switch currency (any user)
  const setCurrency = useCallback((code) => {
    setSelectedCode(code);
    localStorage.setItem(STORAGE_KEY_CURRENCY, code);
  }, []);

  // Super admin saves new rates (INR → X)
  const saveRates = useCallback((ratesMap) => {
    setCustomRates(ratesMap);
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(ratesMap));
  }, []);

  // Convert a value that is stored in INR to the selected currency
  const convert = useCallback((inrValue) => {
    const val = Number(inrValue) || 0;
    return val * selected.rateFromINR;
  }, [selected]);

  // Format a value (stored in INR) as a currency string in selected currency
  const formatMoney = useCallback((inrValue, opts = {}) => {
    const converted = convert(inrValue);
    const { compact = false } = opts;
    if (compact) {
      if (converted >= 1_000_000_000) return `${selected.symbol}${(converted / 1_000_000_000).toFixed(2)}B`;
      if (converted >= 1_000_000)     return `${selected.symbol}${(converted / 1_000_000).toFixed(2)}M`;
      if (converted >= 1_000)         return `${selected.symbol}${(converted / 1_000).toFixed(1)}K`;
      return `${selected.symbol}${converted.toFixed(0)}`;
    }
    return `${selected.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convert, selected]);

  return (
    <CurrencyContext.Provider value={{
      currencies,
      selected,
      selectedCode,
      setCurrency,
      saveRates,
      customRates,
      convert,
      formatMoney,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}

export { DEFAULT_CURRENCIES };
