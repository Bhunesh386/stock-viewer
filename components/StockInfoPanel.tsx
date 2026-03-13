"use client";

import type { StockQuote, StockProfile } from "@/lib/finnhub";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";

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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-widest">{symbol}</h1>
          <h2 className="text-gray-400 mt-1">{profile?.name || "Unknown Company"}</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="mt-4 md:mt-0 text-left md:text-right">
          <div className="text-4xl font-mono">
            <AnimatedNumber value={quote.c} format={(v) => `$${v.toFixed(2)}`} />
          </div>
          <div className={`text-lg font-mono mt-1 ${colorClass} flex items-center justify-end gap-1`}>
            <span>{sign}</span>
            <AnimatedNumber value={quote.d} />
            <span className="ml-1">({sign}</span>
            <AnimatedNumber value={quote.dp} />
            <span>%)</span>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Open</div>
          <div className="font-mono">${quote.o.toFixed(2)}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prev Close</div>
          <div className="font-mono">${quote.pc.toFixed(2)}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Day High</div>
          <div className="font-mono text-stockGreen">${quote.h.toFixed(2)}</div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-background rounded p-3 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Day Low</div>
          <div className="font-mono text-stockRed">${quote.l.toFixed(2)}</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
