"use client";

import type { StockQuote, StockProfile } from "@/lib/finnhub";

interface StockInfoPanelProps {
  quote: StockQuote | null;
  profile: StockProfile | null;
  symbol: string;
}

export default function StockInfoPanel({ quote, profile, symbol }: StockInfoPanelProps) {
  if (!quote) return null;

  const isPositive = quote.d >= 0;
  const colorClass = isPositive ? "text-stockGreen" : "text-stockRed";
  const sign = isPositive ? "+" : "";

  return (
    <div className="bg-card border border-gray-800 rounded-lg p-6 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest">{symbol}</h1>
          <h2 className="text-gray-400 mt-1">{profile?.name || "Unknown Company"}</h2>
        </div>
        <div className="mt-4 md:mt-0 text-left md:text-right">
          <div className="text-4xl font-mono">${quote.c.toFixed(2)}</div>
          <div className={`text-lg font-mono mt-1 ${colorClass}`}>
            {sign}{quote.d.toFixed(2)} ({sign}{quote.dp.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Open</div>
          <div className="font-mono">${quote.o.toFixed(2)}</div>
        </div>
        <div className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prev Close</div>
          <div className="font-mono">${quote.pc.toFixed(2)}</div>
        </div>
        <div className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Day High</div>
          <div className="font-mono text-stockGreen">${quote.h.toFixed(2)}</div>
        </div>
        <div className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Day Low</div>
          <div className="font-mono text-stockRed">${quote.l.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
