"use client";

import { motion } from "framer-motion";

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

interface TimeframeSelectorProps {
  active: Timeframe;
  onSelect: (tf: Timeframe) => void;
}

export default function TimeframeSelector({ active, onSelect }: TimeframeSelectorProps) {
  const timeframes: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

  return (
    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 relative">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`relative px-4 py-2 rounded font-mono text-sm transition-colors whitespace-nowrap z-10
            ${active === tf 
              ? "text-white font-bold" 
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            }`}
        >
          {active === tf && (
            <motion.div
              layoutId="activeTimeframe"
              className="absolute inset-0 bg-accent rounded -z-10 shadow-lg glow"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{tf}</span>
        </button>
      ))}
    </div>
  );
}
