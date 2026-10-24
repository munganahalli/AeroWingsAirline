export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  source: string;
  lastUpdated: string;
  isStale: boolean;
  error?: string;
}

// Sensible baseline rates for instant fallback if external network is unavailable
const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.78,
  AED: 3.67,
  CAD: 1.39,
  SGD: 1.34,
};

let cachedRates: ExchangeRatesData = {
  base: 'USD',
  rates: { ...DEFAULT_RATES },
  source: 'Benchmark Aviation Rates (Initializing)',
  lastUpdated: new Date().toISOString(),
  isStale: false,
};

let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export async function fetchLiveExchangeRates(): Promise<ExchangeRatesData> {
  const now = Date.now();
  // Return cached rates if fresh
  if (now - lastFetchTime < CACHE_TTL_MS && !cachedRates.isStale && lastFetchTime > 0) {
    return cachedRates;
  }

  try {
    // Official open exchange rate API (free, reliable, no secret key required in client)
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Exchange rate provider returned status ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && typeof data.rates === 'object') {
      const liveRates: Record<string, number> = {};
      for (const curr of Object.keys(DEFAULT_RATES)) {
        if (data.rates[curr] && typeof data.rates[curr] === 'number') {
          liveRates[curr] = Number(data.rates[curr].toFixed(4));
        } else {
          liveRates[curr] = DEFAULT_RATES[curr];
        }
      }

      cachedRates = {
        base: 'USD',
        rates: liveRates,
        source: 'Open Exchange Rates (Live-Synced)',
        lastUpdated: new Date().toISOString(),
        isStale: false,
      };
      lastFetchTime = now;
      console.log(`[AeroWings FX] Exchange rates refreshed from live provider at ${cachedRates.lastUpdated}`);
      return cachedRates;
    } else {
      throw new Error('Malformed response from exchange rate provider');
    }
  } catch (err: any) {
    console.warn('[AeroWings FX] Could not fetch live exchange rates:', err.message);
    // Return last cached rates marked with honest stale notice
    cachedRates = {
      base: 'USD',
      rates: cachedRates.rates || DEFAULT_RATES,
      source: 'Open Exchange Rates (Cached / Offline Fallback)',
      lastUpdated: cachedRates.lastUpdated || new Date().toISOString(),
      isStale: true,
      error: `Live exchange-rate provider unavailable (${err.message}). Using latest cached benchmark rates.`,
    };
    return cachedRates;
  }
}

// Initial fetch on boot
fetchLiveExchangeRates().catch(() => {});
