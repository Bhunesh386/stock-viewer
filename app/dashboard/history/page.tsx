"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTransactions, type Transaction } from "@/lib/trading";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

export default function HistoryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const txs = await getTransactions(userId);
      setTransactions(txs);
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

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-widest text-white mb-6">TRANSACTION HISTORY</h1>

        <div className="bg-card p-6 rounded-lg border border-gray-800 shadow-xl overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="text-gray-500 text-center py-12 font-mono">NO TRANSACTIONS FOUND</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Symbol</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2 text-right">Quantity</th>
                  <th className="pb-3 px-2 text-right">Price</th>
                  <th className="pb-3 px-2 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="py-4 px-2 font-mono text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="py-4 px-2 font-bold">{t.symbol}</td>
                    <td className={`py-4 px-2 font-bold tracking-widest ${t.type === 'BUY' ? 'text-stockGreen' : 'text-stockRed'}`}>
                      {t.type}
                    </td>
                    <td className="py-4 px-2 font-mono text-right">{t.quantity}</td>
                    <td className="py-4 px-2 font-mono text-right">${t.price.toFixed(2)}</td>
                    <td className="py-4 px-2 font-mono text-right">${t.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
