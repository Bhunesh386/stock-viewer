import type { StockQuote } from "@/lib/finnhub";
import Link from "next/link";

interface StockCardProps {
  symbol: string;
  quote: StockQuote | null;
  error?: string;
  isValidating?: boolean;
}

export default function StockCard({ symbol, quote, error, isValidating }: StockCardProps) {
  if (error || !quote) {
    return (
      <div className="bg-card p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center h-28 hover:border-gray-600 transition">
        <h3 className="text-lg font-bold uppercase">{symbol}</h3>
        <p className="text-stockRed font-mono text-sm mt-2">
          {isValidating ? "Loading..." : (error || "Invalid symbol")}
        </p>
      </div>
    );
  }

  const isPositive = quote.d >= 0;
  const colorClass = isPositive ? "text-stockGreen" : "text-stockRed";
  const sign = isPositive ? "+" : "";

  return (
    <Link href={`/dashboard/stock/${symbol}`} className={`block bg-card p-4 rounded-lg border ${isValidating ? 'border-gray-600 opacity-80' : 'border-gray-800'} flex flex-col justify-between h-28 hover:border-gray-500 transition shadow-lg`}>
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold tracking-wider">{symbol}</h3>
        <span className={`text-sm font-mono ${colorClass}`}>
          {sign}{quote.dp.toFixed(2)}%
        </span>
      </div>
      <div>
        <div className="text-2xl font-mono">${quote.c.toFixed(2)}</div>
        <div className={`text-sm font-mono mt-1 ${colorClass}`}>
          {sign}{quote.d.toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
