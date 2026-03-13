"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import PortfolioSummary from "@/components/PortfolioSummary";
import { getStockQuote, type StockQuote } from "@/lib/finnhub";

const DEFAULT_SYMBOLS = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA", "META", "NFLX"];

export default function DashboardPage() {
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [quotes, setQuotes] = useState<Record<string, StockQuote | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setEmail(session.user.email || "Unknown Terminal ID");
        setUserId(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchAllQuotes = useCallback(async (currentSymbols: string[]) => {
    const newQuotes: Record<string, StockQuote | null> = {};
    const newErrors: Record<string, string> = {};

    await Promise.all(
      currentSymbols.map(async (sym) => {
        try {
          const data = await getStockQuote(sym);
          if (data) {
            newQuotes[sym] = data;
          } else {
            newErrors[sym] = "Invalid symbol";
          }
        } catch {
          newErrors[sym] = "Failed to fetch";
        }
      })
    );

    setQuotes((prev) => ({ ...prev, ...newQuotes }));
    setErrors((prev) => ({ ...prev, ...newErrors }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!email) return;

    fetchAllQuotes(symbols);

    const interval = setInterval(() => {
      fetchAllQuotes(symbols);
    }, 10000);

    return () => clearInterval(interval);
  }, [symbols, email, fetchAllQuotes]);

  const handleSearch = async (symbol: string) => {
    if (!symbols.includes(symbol)) {
      setSymbols((prev) => [symbol, ...prev]);
      
      try {
        const data = await getStockQuote(symbol);
        if (data) {
          setQuotes((prev) => ({ ...prev, [symbol]: data }));
        } else {
          setErrors((prev) => ({ ...prev, [symbol]: "Invalid symbol" }));
        }
      } catch {
        setErrors((prev) => ({ ...prev, [symbol]: "Failed to fetch" }));
      }
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-xl mx-auto mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {userId && <PortfolioSummary userId={userId} />}

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stockGreen"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {symbols.map((sym) => (
              <StockCard
                key={sym}
                symbol={sym}
                quote={quotes[sym]}
                error={errors[sym]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
