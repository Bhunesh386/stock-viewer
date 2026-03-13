"use client";

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

interface TimeframeSelectorProps {
  active: Timeframe;
  onSelect: (tf: Timeframe) => void;
}

export default function TimeframeSelector({ active, onSelect }: TimeframeSelectorProps) {
  const timeframes: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

  return (
    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`px-4 py-2 rounded font-mono text-sm transition-colors whitespace-nowrap
            ${active === tf 
              ? "bg-stockGreen text-black font-bold shadow-md" 
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
