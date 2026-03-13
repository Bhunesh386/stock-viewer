"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPortfolio, getHoldings, type Portfolio, type Holding } from "@/lib/trading";
import { getStockQuote } from "@/lib/finnhub";

export default function PortfolioSummary({ userId }: { userId: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const pf = await getPortfolio(userId);
        setPortfolio(pf);

        const hlds = await getHoldings(userId);
        setHoldings(hlds);

        // Fetch current prices
        let holdingsValue = 0;
        await Promise.all(
          hlds.map(async (h) => {
            const quote = await getStockQuote(h.symbol);
            if (quote) {
              holdingsValue += (quote.c * h.quantity);
            } else {
              holdingsValue += (h.avg_buy_price * h.quantity);
            }
          })
        );
        
        setTotalValue(pf.cash_balance + holdingsValue);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-gray-800 animate-pulse h-32 flex items-center justify-center mb-6 shadow-xl">
        <span className="text-gray-500 font-mono">LOADING PORTFOLIO DATA...</span>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const startingBalance = 10000;
  const currentTotal = totalValue || portfolio.cash_balance;
  const pl = currentTotal - startingBalance;
  const plPercent = (pl / startingBalance) * 100;
  const isPositive = pl >= 0;
  const colorClass = isPositive ? "text-stockGreen" : "text-stockRed";
  const sign = isPositive ? "+" : "";

  return (
    <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-1">Total Portfolio Value</h2>
          <div className="text-4xl font-mono">${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="mt-4 md:mt-0 text-left md:text-right">
          <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-1">Total P/L</h2>
          <div className={`text-xl font-mono ${colorClass}`}>
            {sign}${Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({sign}{plPercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 border-t border-gray-800 pt-6">
        <div className="bg-background rounded p-4 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Available Cash</div>
          <div className="font-mono text-lg">${portfolio.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-background rounded p-4 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Holdings</div>
          <div className="font-mono text-lg">{holdings.length} Assets</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link href="/dashboard/portfolio" className="text-sm font-bold tracking-widest text-stockGreen hover:underline hover:text-green-400 transition">
          VIEW PORTFOLIO DETAILS &rarr;
        </Link>
      </div>
    </div>
  );
}
