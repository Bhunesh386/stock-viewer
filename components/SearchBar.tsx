"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch }: { onSearch: (symbol: string) => void }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim().toUpperCase());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-500" />
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter ticker symbol (e.g. AAPL)..."
        className="w-full bg-background border border-cardBorder text-primary font-mono text-lg rounded focus:outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] block pl-10 pr-24 p-3 transition-all placeholder-secondary uppercase"
      />
      <button
        type="submit"
        className="absolute inset-y-1 right-1 px-4 text-xs font-bold tracking-widest bg-accent hover:bg-blue-600 text-white rounded transition-colors"
      >
        SEARCH
      </button>
    </form>
  );
}
