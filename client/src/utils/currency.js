/**
 * Centralized Multi-Currency Utility for DealFlow360
 * Connects directly with the enterprise multi-currency system (CurrencyContext / CurrencySettings).
 * Base currency for all internal calculations is INR (₹).
 */

export const DEFAULT_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rateFromINR: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateFromINR: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateFromINR: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateFromINR: 0.0095 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rateFromINR: 0.044 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rateFromINR: 0.016 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateFromINR: 1.80 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rateFromINR: 0.016 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateFromINR: 0.018 },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭', rateFromINR: 0.011 },
];

export const STORAGE_KEY_CURRENCY = 'df360_selected_currency';
export const STORAGE_KEY_RATES = 'df360_currency_rates';

/**
 * Get active exchange rates (combining defaults with admin-overridden rates)
 */
export function getActiveRates() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    return saved ? JSON.parse(saved) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Get the currently selected currency code from storage or fallback to INR
 */
export function getActiveCurrencyCode() {
  if (typeof localStorage === 'undefined') return 'INR';
  return localStorage.getItem(STORAGE_KEY_CURRENCY) || 'INR';
}

/**
 * Get metadata for a currency code (symbol, name, flag, rate)
 */
export function getCurrencyMeta(code) {
  const targetCode = (code || getActiveCurrencyCode()).toUpperCase();
  const rates = getActiveRates();
  const base = DEFAULT_CURRENCIES.find(c => c.code === targetCode) || DEFAULT_CURRENCIES[0];
  return {
    ...base,
    rateFromINR: rates[base.code] ?? base.rateFromINR
  };
}

/**
 * Convert an amount from base currency (INR) to the specified or active target currency
 */
export function convertCurrency(inrAmount, targetCode) {
  const meta = getCurrencyMeta(targetCode);
  const num = Number(inrAmount) || 0;
  return num * meta.rateFromINR;
}

/**
 * Standard Multi-Currency Formatter
 * Formats any INR base amount according to the active or requested currency.
 * 
 * Supports both signatures:
 *   formatCurrency(val, 'USD')
 *   formatCurrency(val, { currencyCode: 'USD', compact: true, decimals: 2 })
 * 
 * @param {number|string} inrValue - Amount in base currency (INR)
 * @param {string|Object} [optsOrCurrencyCode] - Currency code (e.g. 'USD') or options object
 * @param {string} [optsOrCurrencyCode.currencyCode] - Target currency (default: active currency)
 * @param {boolean} [optsOrCurrencyCode.compact=false] - Format with K/M/B suffix
 * @param {number} [optsOrCurrencyCode.decimals=2] - Number of fraction digits
 * @param {boolean} [optsOrCurrencyCode.showCode=false] - Append currency code (e.g. $100.00 USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(inrValue, optsOrCurrencyCode = {}) {
  const opts = typeof optsOrCurrencyCode === 'string'
    ? { currencyCode: optsOrCurrencyCode }
    : (optsOrCurrencyCode || {});

  const {
    currencyCode,
    compact = false,
    decimals = 2,
    showCode = false
  } = opts;

  const meta = getCurrencyMeta(currencyCode);
  const converted = convertCurrency(inrValue, meta.code);

  let formatted = '';
  if (compact) {
    const abs = Math.abs(converted);
    if (abs >= 1_000_000_000) {
      formatted = `${meta.symbol}${(converted / 1_000_000_000).toFixed(decimals)}B`;
    } else if (abs >= 1_000_000) {
      formatted = `${meta.symbol}${(converted / 1_000_000).toFixed(decimals)}M`;
    } else if (abs >= 1_000) {
      formatted = `${meta.symbol}${(converted / 1_000).toFixed(1)}K`;
    } else {
      formatted = `${meta.symbol}${converted.toFixed(0)}`;
    }
  } else {
    formatted = `${meta.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }

  if (showCode) {
    formatted += ` ${meta.code}`;
  }

  return formatted;
}

export const formatMoney = formatCurrency;
export default formatCurrency;
