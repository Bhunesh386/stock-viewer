export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) {
    console.error("Missing Finnhub API Key");
    return null;
  }
  
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${token}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error(`Finnhub error: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Finnhub returns empty structure if invalid (e.g., c === 0 and d === null)
    if (data.c === 0 && data.d === null) {
      return null;
    }
    
    return data as StockQuote;
  } catch (err) {
    console.error(`Failed to fetch quote for ${symbol}`, err);
    return null;
  }
}

export interface StockCandles {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: string;
  t: number[];
  v: number[];
}

export async function getStockCandles(symbol: string, resolution: string, from: number, to: number): Promise<StockCandles | null> {
  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) return null;
  
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${token}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`Finnhub error: ${res.statusText}`);
    const data = await res.json();
    if (data.s === 'no_data') return null;
    return data as StockCandles;
  } catch (err) {
    console.error(`Failed to fetch candles for ${symbol}`, err);
    return null;
  }
}

export interface StockProfile {
  name: string;
  ticker: string;
}

export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) return null;
  
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${token}`, {
      cache: 'force-cache'
    });
    if (!res.ok) throw new Error(`Finnhub error: ${res.statusText}`);
    return await res.json() as StockProfile;
  } catch (err) {
    console.error(`Failed to fetch profile for ${symbol}`, err);
    return null;
  }
}

export async function fetchCandles(symbol: string, timeframe: string) {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  const to = Math.floor(Date.now() / 1000);

  const config: Record<string, { resolution: string; from: number }> = {
    '1D': { resolution: '30', from: to - 2 * 24 * 60 * 60 },
    '4D': { resolution: '60', from: to - 8 * 24 * 60 * 60 },
    '1W': { resolution: '60', from: to - 14 * 24 * 60 * 60 },
    '1M': { resolution: 'D', from: to - 30 * 24 * 60 * 60 },
    '3M': { resolution: 'D', from: to - 90 * 24 * 60 * 60 },
    '6M': { resolution: 'D', from: to - 180 * 24 * 60 * 60 },
    '1Y': { resolution: 'D', from: to - 365 * 24 * 60 * 60 },
  };

  const { resolution, from } = config[timeframe] || config['1M'];

  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.s === 'no_data' || !data.t || data.t.length === 0) {
    return null;
  }

  return data.t.map((time: number, i: number) => ({
    time: time,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
  })).sort((a: {time: number}, b: {time: number}) => a.time - b.time);
}
