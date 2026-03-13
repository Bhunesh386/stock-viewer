"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPortfolio, getHoldings, getTransactions, type Portfolio, type Holding, type Transaction, buyStock, sellStock } from "@/lib/trading";
import { getStockQuote } from "@/lib/finnhub";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "@/components/AnimatedNumber";

type EnrichedHolding = Holding & { currentPrice: number, totalValue: number, pl: number, plPercent: number };

export default function PortfolioPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const router = useRouter();

  // Quick Buy state
  const [buySymbol, setBuySymbol] = useState("");
  const [buyQty, setBuyQty] = useState<number | "">("");
  const [buyPrice, setBuyPrice] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Sell Modal state
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellHolding, setSellHolding] = useState<EnrichedHolding | null>(null);
  const [sellQty, setSellQty] = useState<number | "">("");
  const [sellLoading, setSellLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUserId(session.user.id);
        setEmail(session.user.email || "Unknown User");
        fetchData(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const fetchData = async (uid: string) => {
    try {
      const pf = await getPortfolio(uid);
      setPortfolio(pf);

      const hlds = await getHoldings(uid);
      const enrichedHoldings = await Promise.all(
        hlds.map(async (h) => {
          const quote = await getStockQuote(h.symbol);
          const currentPrice = quote?.c || h.avg_buy_price;
          const totalValue = currentPrice * h.quantity;
          const costBasis = h.avg_buy_price * h.quantity;
          const pl = totalValue - costBasis;
          const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
          return { ...h, currentPrice, totalValue, pl, plPercent };
        })
      );
      setHoldings(enrichedHoldings.filter(h => h.quantity > 0));

      const txs = await getTransactions(uid);
      setTransactions(txs.slice(0, 10)); // last 10
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchQuote = async () => {
      if (buySymbol.length > 0) {
        const quote = await getStockQuote(buySymbol.toUpperCase());
        setBuyPrice(quote?.c || null);
      } else {
        setBuyPrice(null);
      }
    };
    const timeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeout);
  }, [buySymbol]);

  const handleQuickBuy = async () => {
    if (!buySymbol || !buyQty || !buyPrice || !userId) return;
    setBuyLoading(true);
    try {
      await buyStock(userId, buySymbol.toUpperCase(), Number(buyQty), buyPrice);
      toast.success(`Bought ${buyQty} shares of ${buySymbol.toUpperCase()}`);
      setBuySymbol("");
      setBuyQty("");
      fetchData(userId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Buy failed");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleSellConfirm = async () => {
    if (!sellHolding || !sellQty || !userId) return;
    setSellLoading(true);
    try {
      await sellStock(userId, sellHolding.symbol, Number(sellQty), sellHolding.currentPrice);
      toast.success(`Sold ${sellQty} shares of ${sellHolding.symbol}`);
      setSellModalOpen(false);
      setSellHolding(null);
      setSellQty("");
      fetchData(userId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sell failed");
    } finally {
      setSellLoading(false);
    }
  };

  if (!email || loading || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stockGreen"></div>
      </div>
    );
  }

  const holdingsValue = holdings.reduce((acc, h) => acc + h.totalValue, 0);
  const totalValue = portfolio.cash_balance + holdingsValue;
  const startingBalance = 10000;
  // P&L = (total portfolio value) - 10000
  const totalPL = totalValue - startingBalance;
  const totalPLPercent = (totalPL / startingBalance) * 100;

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <h1 className="text-2xl font-bold tracking-widest text-white mb-6">PORTFOLIO OVERVIEW</h1>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-cardBorder p-6 shadow-xl rounded-lg text-center lg:text-left transition-colors hover:border-cardHoverBorder">
            <h2 className="text-secondary text-xs tracking-widest uppercase mb-2">Starting Balance</h2>
            <div className="text-3xl font-mono text-white">
              <AnimatedNumber value={10000} format={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-cardBorder p-6 shadow-xl rounded-lg text-center lg:text-left transition-colors hover:border-cardHoverBorder">
            <h2 className="text-secondary text-xs tracking-widest uppercase mb-2">Cash Available</h2>
            <div className="text-3xl font-mono text-stockGreen">
              <AnimatedNumber value={portfolio.cash_balance} format={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-cardBorder p-6 shadow-xl rounded-lg text-center lg:text-left transition-colors hover:border-cardHoverBorder">
            <h2 className="text-secondary text-xs tracking-widest uppercase mb-2">Portfolio Value</h2>
            <div className="text-3xl font-mono text-white">
              <AnimatedNumber value={totalValue} format={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            whileHover={{ scale: 1.02 }}
            transition={{ delay: 0.4 }} 
            className={`bg-card border p-6 shadow-xl rounded-lg text-center lg:text-left transition-all relative ${totalPL >= 0 ? "border-stockGreen/30 shadow-[0_0_15px_rgba(0,255,136,0.15)] glow-pulse" : "border-stockRed/30 shadow-[0_0_15px_rgba(255,68,68,0.15)] glow-pulse"}`}
          >
            <h2 className="text-secondary text-xs tracking-widest uppercase mb-2">Total P&L</h2>
            <div className={`text-3xl font-mono flex gap-1 justify-center lg:justify-start items-center ${totalPL >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
              <span>{totalPL >= 0 ? '+' : ''}</span>
              <AnimatedNumber value={totalPL} format={(v) => `$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <span className="ml-2 text-xl">({totalPL >= 0 ? '+' : ''}</span>
              <AnimatedNumber value={Math.abs(totalPLPercent)} format={(v) => `${v.toFixed(2)}`} className="text-xl" />
              <span className="text-xl">%)</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Holdings Table */}
          <div className="lg:col-span-2 bg-card border border-cardBorder p-6 shadow-xl rounded-lg overflow-x-auto transition-colors hover:border-cardHoverBorder">
            <h2 className="text-secondary text-sm font-bold tracking-widest uppercase mb-4">Current Holdings</h2>
            {holdings.length === 0 ? (
              <div className="text-secondary text-center py-12 font-mono">Your portfolio is empty. Go buy some stocks!</div>
            ) : (
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-cardBorder text-secondary text-xs uppercase tracking-wider">
                    <th className="pb-3 px-2">Symbol</th>
                    <th className="pb-3 px-2 text-right">Qty</th>
                    <th className="pb-3 px-2 text-right">Avg Price</th>
                    <th className="pb-3 px-2 text-right">Current Price</th>
                    <th className="pb-3 px-2 text-right">Current Value</th>
                    <th className="pb-3 px-2 text-right">P&L</th>
                    <th className="pb-3 px-2 text-right">P&L%</th>
                    <th className="pb-3 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {holdings.map((h) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                        key={h.id} 
                        className="border-b border-cardBorder/50 hover:bg-cardBorder/30 transition group"
                      >
                        <td className="py-4 px-2 font-bold group-hover:text-accent transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/stock/${h.symbol}`)}>
                          {h.symbol}
                        </td>
                        <td className="py-4 px-2 text-right">{h.quantity}</td>
                        <td className="py-4 px-2 text-right">${h.avg_buy_price.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right">${h.currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right text-white">${h.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-4 px-2 text-right ${h.pl >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
                          {h.pl >= 0 ? '+' : ''}${h.pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`py-4 px-2 text-right ${h.pl >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
                          {h.pl >= 0 ? '+' : ''}{h.plPercent.toFixed(2)}%
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button 
                            onClick={() => {
                              setSellHolding(h);
                              setSellQty(h.quantity); // default to max
                              setSellModalOpen(true);
                            }}
                            className="bg-stockRed/10 text-stockRed border border-stockRed hover:bg-stockRed hover:text-white font-bold py-1 px-3 text-xs tracking-widest transition-colors rounded"
                          >
                            SELL
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            )}
          </div>
          
          {/* Quick Buy Panel */}
          <div className="bg-card border border-cardBorder p-6 shadow-xl rounded-lg h-fit transition-colors hover:border-cardHoverBorder">
            <h2 className="text-secondary text-sm font-bold tracking-widest uppercase mb-4">Quick Buy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-secondary uppercase tracking-wider mb-2">Symbol</label>
                <input
                  type="text"
                  value={buySymbol}
                  onChange={(e) => setBuySymbol(e.target.value)}
                  className="w-full bg-background border border-cardBorder rounded p-3 text-white font-mono focus:outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all uppercase placeholder-gray-700"
                  placeholder="AAPL"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary uppercase tracking-wider mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={buyQty}
                  onChange={(e) => setBuyQty(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full bg-background border border-cardBorder rounded p-3 text-white font-mono focus:outline-none focus:border-accent focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all placeholder-gray-700"
                  placeholder="0"
                />
              </div>

              <div className="p-4 bg-background border border-cardBorder rounded space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm font-mono text-secondary">
                  <span>Current Price</span>
                  <span>{buyPrice !== null ? `$${buyPrice.toFixed(2)}` : '--'}</span>
                </div>
                <div className="h-px bg-cardBorder w-full" />
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-white font-bold tracking-wider">Estimated Cost</span>
                  <span className="text-stockRed">${(Number(buyQty || 0) * (buyPrice || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-mono pt-2">
                  <span className="text-secondary font-bold tracking-wider">Available Cash</span>
                  <span className="text-stockGreen">${portfolio.cash_balance.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleQuickBuy}
                disabled={buyLoading || !buySymbol || !buyQty || !buyPrice || portfolio.cash_balance < (Number(buyQty) * buyPrice)}
                className="w-full py-4 rounded font-bold tracking-widest bg-accent text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {buyLoading ? "PROCESSING..." : "CONFIRM BUY"}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History (Last 10) */}
        <div className="bg-card border border-cardBorder p-6 shadow-xl rounded-lg transition-colors hover:border-cardHoverBorder">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-secondary text-sm font-bold tracking-widest uppercase">Recent Transactions</h2>
            <Link href="/dashboard/history" className="text-accent hover:text-blue-400 text-sm font-bold tracking-widest uppercase transition-colors">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-secondary text-center py-6 font-mono">No recent transactions</div>
            ) : (
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-cardBorder text-secondary text-xs uppercase tracking-wider">
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Symbol</th>
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2 text-right">Quantity</th>
                    <th className="pb-3 px-2 text-right">Price</th>
                    <th className="pb-3 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-cardBorder/50 hover:bg-cardBorder/30 transition">
                      <td className="py-3 px-2 text-secondary text-sm">{new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-2 font-bold text-white">{t.symbol}</td>
                      <td className={`py-3 px-2 font-bold tracking-widest text-sm ${t.type === 'BUY' ? 'text-stockGreen' : 'text-stockRed'}`}>{t.type}</td>
                      <td className="py-3 px-2 text-right text-white">{t.quantity}</td>
                      <td className="py-3 px-2 text-right text-white">${t.price.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-white">${t.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* Sell Modal */}
      {sellModalOpen && sellHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-cardBorder p-6 rounded-lg shadow-2xl w-full max-w-sm">
            <h2 className="text-white text-lg font-bold tracking-widest uppercase mb-4">Sell {sellHolding.symbol}</h2>
            
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between text-secondary">
                <span>Current Price</span>
                <span className="text-white">${sellHolding.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Max Shares Available</span>
                <span className="text-white">{sellHolding.quantity}</span>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs text-secondary uppercase tracking-wider mb-2">Quantity to Sell</label>
                <input
                  type="number"
                  min="1"
                  max={sellHolding.quantity}
                  value={sellQty}
                  onChange={(e) => setSellQty(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full bg-background border border-cardBorder rounded p-3 text-white font-mono focus:outline-none focus:border-stockRed focus:shadow-[0_0_10px_rgba(255,68,68,0.3)] transition-all placeholder-gray-700"
                />
              </div>

              <div className="h-px bg-cardBorder my-4" />

              <div className="flex justify-between font-bold text-base">
                <span className="text-secondary mt-1 tracking-widest">Estimated Return</span>
                <span className="text-stockGreen">${(Number(sellQty || 0) * sellHolding.currentPrice).toFixed(2)}</span>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => { setSellModalOpen(false); setSellHolding(null); setSellQty(""); }}
                  className="flex-1 py-3 tracking-widest text-white rounded bg-transparent border border-cardBorder hover:bg-cardHoverBorder transition-colors font-bold text-xs"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSellConfirm}
                  disabled={sellLoading || !sellQty || Number(sellQty) > sellHolding.quantity}
                  className="flex-1 py-3 tracking-widest text-white rounded bg-stockRed hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs"
                >
                  {sellLoading ? "WORKING..." : "CONFIRM SELL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
