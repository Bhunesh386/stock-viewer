"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import StockInfoPanel from "@/components/StockInfoPanel";
import TimeframeSelector, { Timeframe } from "@/components/TimeframeSelector";
import StockChart from "@/components/StockChart";
import { 
  getStockQuote, 
  getStockCandles, 
  getStockProfile, 
  type StockQuote, 
  type StockCandles, 
  type StockProfile 
} from "@/lib/finnhub";

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [profile, setProfile] = useState<StockProfile | null>(null);
  const [candles, setCandles] = useState<StockCandles | null>(null);
  
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setEmail(session.user.email || "Unknown Terminal ID");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Initial load
  useEffect(() => {
    if (!email) return;

    getStockQuote(symbol).then(setQuote);
    getStockProfile(symbol).then(setProfile);
  }, [symbol, email]);

  const fetchChartData = useCallback(async (tf: Timeframe) => {
    setLoadingChart(true);
    setChartError(null);
    setCandles(null);

    // Calculate timestamps
    const to = Math.floor(Date.now() / 1000);
    let from = to;
    let resolution = "D";

    switch (tf) {
      case "1D": // 1 min resolution, 1 day back (ignoring weekends is hard by exact hours, so just 24h)
        from = to - 24 * 60 * 60;
        resolution = "1";
        break;
      case "1W": // 15 min, 7 days
        from = to - 7 * 24 * 60 * 60;
        resolution = "15";
        break;
      case "1M": // 60 min, 30 days
        from = to - 30 * 24 * 60 * 60;
        resolution = "60";
        break;
      case "3M": // daily, 90 days
        from = to - 90 * 24 * 60 * 60;
        resolution = "D";
        break;
      case "6M": // daily, 180 days
        from = to - 180 * 24 * 60 * 60;
        resolution = "D";
        break;
      case "1Y": // daily, 365 days
        from = to - 365 * 24 * 60 * 60;
        resolution = "D";
        break;
    }

    try {
      const data = await getStockCandles(symbol, resolution, from, to);
      if (data) {
        setCandles(data);
      } else {
        setChartError("No candle data available for this timeframe. Market may be closed or symbol unsupported.");
      }
    } catch {
      setChartError("Failed to load chart data");
    } finally {
      setLoadingChart(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (!email) return;
    fetchChartData(timeframe);
  }, [email, timeframe, fetchChartData]);

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-stockGreen hover:text-green-400 transition mb-4"
        >
          <ArrowLeft size={20} />
          <span>Return to Dashboard</span>
        </Link>
        
        <StockInfoPanel quote={quote} profile={profile} symbol={symbol} />

        <div className="bg-card p-4 sm:p-6 rounded-lg border border-gray-800 shadow-xl">
          <TimeframeSelector active={timeframe} onSelect={setTimeframe} />
          <StockChart data={candles} loading={loadingChart} error={chartError} />
        </div>
      </main>
    </div>
  );
}
