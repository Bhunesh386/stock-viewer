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
import TradePanel from "@/components/TradePanel";
import { 
  getStockQuote, 
  fetchCandles, 
  getStockProfile, 
  type StockQuote, 
  type StockProfile 
} from "@/lib/finnhub";

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [profile, setProfile] = useState<StockProfile | null>(null);
  const [candles, setCandles] = useState<Array<{time: number, open: number, high: number, low: number, close: number}> | null>(null);
  
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [marketClosed, setMarketClosed] = useState(false);

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
    setMarketClosed(false);

    try {
      const data = await fetchCandles(symbol, tf);
      setCandles(data);
      if (!data) {
        setChartError("No data available for this timeframe on free tier. Try 1M or above.");
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card p-4 sm:p-6 rounded-lg border border-gray-800 shadow-xl h-[500px] flex flex-col">
            <TimeframeSelector active={timeframe} onSelect={setTimeframe} />
            <div className="relative flex-grow mt-4">
              <StockChart data={candles} loading={loadingChart} error={chartError} marketClosed={marketClosed} timeframe={timeframe} />
            </div>
          </div>
          <div className="h-[500px]">
            <TradePanel symbol={symbol} currentPrice={quote?.c || 0} />
          </div>
        </div>
      </main>
    </div>
  );
}
