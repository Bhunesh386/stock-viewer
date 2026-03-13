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
        className="w-full bg-card border border-gray-800 text-primary text-sm rounded-lg focus:ring-1 focus:outline-none focus:ring-stockGreen focus:border-stockGreen block pl-10 pr-20 p-3 transition"
      />
      <button
        type="submit"
        className="absolute inset-y-1 right-1 px-4 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-primary rounded-md transition"
      >
        Search
      </button>
    </form>
  );
}
