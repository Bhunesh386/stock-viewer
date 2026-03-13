"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getPortfolio, getHoldings, buyStock, sellStock, type Portfolio, type Holding } from "@/lib/trading";
import { supabase } from "@/lib/supabase";

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
}

export default function TradePanel({ symbol, currentPrice }: TradePanelProps) {
  const [activeTab, setActiveTab] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<number | "">("");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [userHolding, setUserHolding] = useState<Holding | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchData(session.user.id);
      }
    });

    // Listen for focus to refresh cash balances
    const onFocus = () => {
      if (userId) fetchData(userId);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [symbol, userId]);

  const fetchData = async (uid: string) => {
    try {
      const pf = await getPortfolio(uid);
      setPortfolio(pf);
      const hlds = await getHoldings(uid);
      setUserHolding(hlds.find(h => h.symbol === symbol) || null);
    } catch {}
  };

  const parsedQty = typeof quantity === "number" ? quantity : 0;
  const estimatedValue = parsedQty * currentPrice;

  const canBuy = portfolio ? portfolio.cash_balance >= estimatedValue : false;
  const canSell = userHolding ? userHolding.quantity >= parsedQty : false;

  const handleTrade = async () => {
    if (!userId || parsedQty <= 0) return;
    
    setLoading(true);
    let success = false;
    
    try {
      if (activeTab === "BUY") {
        if (!canBuy) throw new Error("Insufficient funds");
        await buyStock(userId, symbol, parsedQty, currentPrice);
        toast.success(`Bought ${parsedQty} shares of ${symbol}`);
        success = true;
      } else {
        if (!canSell) throw new Error("Insufficient shares");
        await sellStock(userId, symbol, parsedQty, currentPrice);
        toast.success(`Sold ${parsedQty} shares of ${symbol}`);
        success = true;
      }
    } catch (err: any) {
      toast.error(err.message || "Trade failed");
    } finally {
      setLoading(false);
      if (success) {
        setQuantity("");
        fetchData(userId);
      }
    }
  };

  if (!portfolio) return (
    <div className="bg-card border border-gray-800 rounded-lg p-6 animate-pulse h-full min-h-[400px]"></div>
  );

  return (
    <div className="bg-card border border-gray-800 rounded-lg p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab("BUY")}
            className={`flex-1 py-3 text-center font-bold tracking-widest text-sm transition-colors ${
              activeTab === "BUY" ? "text-stockGreen border-b-2 border-stockGreen" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ORDER BUY
          </button>
          <button
            onClick={() => setActiveTab("SELL")}
            className={`flex-1 py-3 text-center font-bold tracking-widest text-sm transition-colors ${
              activeTab === "SELL" ? "text-stockRed border-b-2 border-stockRed" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ORDER SELL
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : "")}
              className="w-full bg-background border border-gray-700 rounded p-4 text-white font-mono text-xl focus:outline-none focus:border-gray-500 transition"
              placeholder="0"
            />
          </div>

          <div className="p-4 bg-background border border-gray-800 rounded space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Current Price</span>
              <span className="font-mono">${currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="h-px bg-gray-800 w-full" />

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-bold">Estimated Total</span>
              <span className="font-mono text-xl text-white">${estimatedValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {activeTab === "BUY" ? (
          <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-800">
            <span className="text-gray-500 uppercase tracking-wider">Available Cash</span>
            <span className="font-mono text-stockGreen text-sm">${portfolio.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-800">
            <span className="text-gray-500 uppercase tracking-wider">Shares Owned</span>
            <span className="font-mono text-sm">{userHolding?.quantity || 0}</span>
          </div>
        )}

        <button
          onClick={handleTrade}
          disabled={loading || parsedQty <= 0 || (activeTab === "BUY" ? !canBuy : !canSell)}
          className={`w-full py-4 rounded font-bold tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "BUY" 
              ? "bg-stockGreen/10 text-stockGreen hover:bg-stockGreen hover:text-black border border-stockGreen" 
              : "bg-stockRed/10 text-stockRed hover:bg-stockRed hover:text-black border border-stockRed"
          }`}
        >
          {loading ? "PROCESSING..." : `CONFIRM ${activeTab}`}
        </button>
      </div>
    </div>
  );
}
