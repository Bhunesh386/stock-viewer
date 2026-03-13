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
      <div className="bg-card p-4 rounded border border-cardBorder flex flex-col items-center justify-center h-32 transition-colors">
        <h3 className="text-xl font-bold uppercase tracking-widest">{symbol}</h3>
        <p className="text-stockRed font-mono text-sm mt-2">
          {isValidating ? "LOADING..." : (error || "INVALID SYMBOL")}
        </p>
      </div>
    );
  }

  const isPositive = quote.d >= 0;
  const colorClass = isPositive ? "text-stockGreen" : "text-stockRed";
  const borderLeftClass = isPositive ? "border-l-4 border-l-stockGreen" : "border-l-4 border-l-stockRed";
  const sign = isPositive ? "+" : "";

  return (
    <Link href={`/dashboard/stock/${symbol}`} className={`block bg-card p-4 rounded border ${isValidating ? 'border-cardBorder opacity-80' : 'border-cardBorder'} flex flex-col justify-between h-32 hover:border-cardHoverBorder transition-colors shadow-lg ${borderLeftClass}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold tracking-wider">{symbol}</h3>
        <span className={`text-sm font-mono ${colorClass}`}>
          {sign}{quote.dp.toFixed(2)}%
        </span>
      </div>
      <div>
        <div className="text-3xl font-mono text-white">${quote.c.toFixed(2)}</div>
        <div className={`text-sm font-mono mt-1 ${colorClass}`}>
          {sign}{quote.d.toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
