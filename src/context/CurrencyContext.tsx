import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchExchangeRates } from '../lib/api.ts';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromUSD: number;
  flag: string;
  label: string;
}

export const INITIAL_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateFromUSD: 1.0,
    flag: '🇺🇸',
    label: 'USD ($)',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rateFromUSD: 86.5,
    flag: '🇮🇳',
    label: 'INR (₹)',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateFromUSD: 0.92,
    flag: '🇪🇺',
    label: 'EUR (€)',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateFromUSD: 0.78,
    flag: '🇬🇧',
    label: 'GBP (£)',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    rateFromUSD: 3.67,
    flag: '🇦🇪',
    label: 'AED (د.إ)',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    rateFromUSD: 1.39,
    flag: '🇨🇦',
    label: 'CAD (CA$)',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    rateFromUSD: 1.34,
    flag: '🇸🇬',
    label: 'SGD (S$)',
  },
};

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (usdAmount: number, overrideCode?: CurrencyCode) => string;
  convertPrice: (usdAmount: number, overrideCode?: CurrencyCode) => number;
  allCurrencies: CurrencyInfo[];
  rateSource: string;
  lastUpdated: string;
  isStale: boolean;
  ratesLoading: boolean;
  refreshRates: () => Promise<void>;
  rateDisclaimer: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [currencyMap, setCurrencyMap] = useState<Record<CurrencyCode, CurrencyInfo>>(INITIAL_CURRENCIES);
  const [rateSource, setRateSource] = useState<string>('Live Open Exchange Rates API');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isStale, setIsStale] = useState<boolean>(false);
  const [ratesLoading, setRatesLoading] = useState<boolean>(true);

  const loadRates = async () => {
    try {
      const data = await fetchExchangeRates();
      if (data && data.rates) {
        setCurrencyMap((prev) => {
          const next = { ...prev };
          (Object.keys(next) as CurrencyCode[]).forEach((code) => {
            if (data.rates[code] && typeof data.rates[code] === 'number') {
              next[code] = {
                ...next[code],
                rateFromUSD: Number(data.rates[code]),
              };
            }
          });
          return next;
        });
        setRateSource(data.source || 'Open Exchange Rates (Live Synced)');
        setLastUpdated(data.lastUpdated || new Date().toISOString());
        setIsStale(Boolean(data.isStale));
      }
    } catch (err) {
      console.warn('Could not load live exchange rates, using local fallback:', err);
      setIsStale(true);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aerowings_display_currency');
      if (saved && INITIAL_CURRENCIES[saved as CurrencyCode]) {
        setCurrencyCode(saved as CurrencyCode);
      }
    } catch {
      // ignore
    }
    loadRates();

    // Refresh rates every 30 minutes
    const interval = setInterval(loadRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSetCurrency = (code: CurrencyCode) => {
    if (currencyMap[code]) {
      setCurrencyCode(code);
      try {
        localStorage.setItem('aerowings_display_currency', code);
      } catch {
        // ignore
      }
    }
  };

  const currency = currencyMap[currencyCode] || currencyMap.USD;

  const convertPrice = (usdAmount: number, overrideCode?: CurrencyCode): number => {
    const target = overrideCode ? currencyMap[overrideCode] : currency;
    const rate = target?.rateFromUSD || 1.0;
    return Number((usdAmount * rate).toFixed(2));
  };

  const formatPrice = (usdAmount: number, overrideCode?: CurrencyCode): string => {
    const target = overrideCode ? currencyMap[overrideCode] : currency;
    const rate = target?.rateFromUSD || 1.0;
    const converted = Math.round(usdAmount * rate);

    if (target.code === 'INR') {
      return `₹${converted.toLocaleString('en-IN')}`;
    }
    if (target.code === 'EUR') {
      return `€${converted.toLocaleString('de-DE')}`;
    }
    if (target.code === 'GBP') {
      return `£${converted.toLocaleString('en-GB')}`;
    }
    if (target.code === 'AED') {
      return `${converted.toLocaleString('en-US')} AED`;
    }
    if (target.code === 'CAD') {
      return `CA$${converted.toLocaleString('en-US')}`;
    }
    if (target.code === 'SGD') {
      return `S$${converted.toLocaleString('en-US')}`;
    }
    return `$${converted.toLocaleString('en-US')}`;
  };

  const formattedTimestamp = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rateDisclaimer = isStale
    ? `Exchange rates sourced from ${rateSource} (Last updated ${formattedTimestamp} UTC). Warning: Rate cache is currently operating in fallback mode.`
    : `Exchange rates live-synced from ${rateSource} (Updated ${formattedTimestamp} UTC). Fares are permanently authorized in USD; multi-currency conversions are real-time travel estimates.`;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        formatPrice,
        convertPrice,
        allCurrencies: Object.values(currencyMap),
        rateSource,
        lastUpdated,
        isStale,
        ratesLoading,
        refreshRates: loadRates,
        rateDisclaimer,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
