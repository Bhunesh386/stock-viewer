import type { StockQuote } from "@/lib/finnhub";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";

interface StockCardProps {
  symbol: string;
  quote: StockQuote | null;
  error?: string;
  isValidating?: boolean;
  index: number;
}

export default function StockCard({ symbol, quote, error, isValidating, index }: StockCardProps) {
  if (error || !quote) {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 30, scale: 0.95 },
          visible: (i) => ({
            opacity: 1, y: 0, scale: 1,
            transition: { delay: i * 0.05, duration: 0.3 }
          })
        }}
        className="will-change-transform bg-card p-4 rounded border border-cardBorder flex flex-col items-center justify-center h-32 transition-colors"
      >
        <h3 className="text-xl font-bold uppercase tracking-widest">{symbol}</h3>
        <p className="text-stockRed font-mono text-sm mt-2">
          {isValidating ? "LOADING..." : (error || "INVALID SYMBOL")}
        </p>
      </motion.div>
    );
  }

  const isPositive = quote.d >= 0;
  const colorClass = isPositive ? "text-stockGreen" : "text-stockRed";
  const borderLeftClass = isPositive ? "border-l-4 border-l-stockGreen" : "border-l-4 border-l-stockRed";
  const sign = isPositive ? "+" : "";

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.03, y: -2, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: (i) => ({
          opacity: 1, y: 0, scale: 1,
          transition: { delay: i * 0.05, duration: 0.3 }
        })
      }}
      className="will-change-transform"
    >
      <Link href={`/dashboard/stock/${symbol}`} className={`block bg-card p-4 rounded border ${isValidating ? 'border-cardBorder opacity-80' : 'border-cardBorder'} flex flex-col justify-between h-32 hover:border-accent hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors shadow-lg ${borderLeftClass}`}>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold tracking-wider">{symbol}</h3>
          <div className="text-sm font-mono">
            <span>{sign}</span>
            <AnimatedNumber value={quote.dp} format={(v) => `${v.toFixed(2)}%`} />
          </div>
        </div>
        <div>
          <div className="text-3xl font-mono text-white">
            <AnimatedNumber value={quote.c} format={(v) => `$${v.toFixed(2)}`} />
          </div>
          <div className="text-sm font-mono mt-1 flex">
            <span>{sign}</span>
            <AnimatedNumber value={quote.d} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
