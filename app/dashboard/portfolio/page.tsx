"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getPortfolio, getHoldings, type Portfolio, type Holding } from "@/lib/trading";
import { getStockQuote } from "@/lib/finnhub";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

const COLORS = ['#00FF88', '#FF3366', '#33CCFF', '#FFCC00', '#FF9933', '#9933FF', '#00CC99', '#FF66B2'];

export default function PortfolioPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<(Holding & { currentPrice: number, totalValue: number, pl: number, plPercent: number })[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setEmail(session.user.email || "Unknown User");
        fetchData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      const pf = await getPortfolio(userId);
      setPortfolio(pf);

      const hlds = await getHoldings(userId);
      const enrichedHoldings = await Promise.all(
        hlds.map(async (h) => {
          const quote = await getStockQuote(h.symbol);
          const currentPrice = quote?.c || h.avg_buy_price;
          const totalValue = currentPrice * h.quantity;
          const costBasis = h.avg_buy_price * h.quantity;
          const pl = totalValue - costBasis;
          const plPercent = (pl / costBasis) * 100;

          return { ...h, currentPrice, totalValue, pl, plPercent };
        })
      );

      // filter out zero quantity holdings
      setHoldings(enrichedHoldings.filter(h => h.quantity > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!email || loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stockGreen"></div>
      </div>
    );
  }

  const holdingsValue = holdings.reduce((acc, h) => acc + h.totalValue, 0);
  const totalValue = (portfolio?.cash_balance || 0) + holdingsValue;
  const startingBalance = 10000;
  const totalPL = totalValue - startingBalance;
  const totalPLPercent = (totalPL / startingBalance) * 100;

  const chartData = holdings.map(h => ({ name: h.symbol, value: h.totalValue }));
  if (portfolio?.cash_balance && portfolio.cash_balance > 0) {
    chartData.push({ name: 'CASH', value: portfolio.cash_balance });
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-widest text-white mb-6">PORTFOLIO OVERVIEW</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl">
            <h2 className="text-gray-500 text-xs tracking-widest uppercase mb-2">Total Value</h2>
            <div className="text-3xl font-mono">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl">
            <h2 className="text-gray-500 text-xs tracking-widest uppercase mb-2">Cash Balance</h2>
            <div className="text-3xl font-mono text-stockGreen">${portfolio?.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl">
            <h2 className="text-gray-500 text-xs tracking-widest uppercase mb-2">Total P/L</h2>
            <div className={`text-3xl font-mono ${totalPL >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
              {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalPL >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-gray-800 shadow-xl overflow-x-auto">
            <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-4">Current Holdings</h2>
            {holdings.length === 0 ? (
              <div className="text-gray-500 text-center py-8 font-mono">NO ACTIVE HOLDINGS</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="pb-3 px-2">Symbol</th>
                    <th className="pb-3 px-2 text-right">Qty</th>
                    <th className="pb-3 px-2 text-right">Avg Price</th>
                    <th className="pb-3 px-2 text-right">Current</th>
                    <th className="pb-3 px-2 text-right">Total Value</th>
                    <th className="pb-3 px-2 text-right">P/L</th>
                    <th className="pb-3 px-2 text-right">P/L %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition group cursor-pointer" onClick={() => router.push(`/dashboard/stock/${h.symbol}`)}>
                      <td className="py-4 px-2 font-bold group-hover:text-stockGreen">{h.symbol}</td>
                      <td className="py-4 px-2 font-mono text-right">{h.quantity}</td>
                      <td className="py-4 px-2 font-mono text-right">${h.avg_buy_price.toFixed(2)}</td>
                      <td className="py-4 px-2 font-mono text-right">${h.currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-2 font-mono text-right">${h.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`py-4 px-2 font-mono text-right ${h.pl >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
                        {h.pl >= 0 ? '+' : ''}${h.pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-4 px-2 font-mono text-right ${h.pl >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
                        {h.pl >= 0 ? '+' : ''}{h.plPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl h-[400px]">
            <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-4">Allocation</h2>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'CASH' ? '#4B5563' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  // @ts-expect-error recharts type mismatch
                  formatter={(value: number) => `$${Number(value).toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {chartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs font-mono">
                  <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: entry.name === 'CASH' ? '#4B5563' : COLORS[index % COLORS.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
