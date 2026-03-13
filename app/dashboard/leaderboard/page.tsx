"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  totalValue: number;
  pl: number;
}

export default function LeaderboardPage() {
  const [email, setEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setEmail(session.user.email || "Unknown User");
        setCurrentUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, [currentUserId]);

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header email={email} />
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-widest text-white mb-6">GLOBAL LEADERBOARD</h1>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stockGreen"></div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-gray-800 shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0d1117] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6 text-right">Total Value</th>
                  <th className="py-4 px-6 text-right">P/L vs $10K</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === currentUserId;
                  const username = entry.email.split('@')[0];
                  
                  return (
                    <tr 
                      key={entry.user_id} 
                      className={`border-b border-gray-800/50 transition ${isCurrentUser ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'}`}
                    >
                      <td className="py-5 px-6 font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-gray-300/20 text-gray-300' : index === 2 ? 'bg-orange-600/20 text-orange-500' : 'bg-transparent text-gray-500'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-5 px-6 font-bold tracking-wide">
                        {username} {isCurrentUser && <span className="ml-2 text-xs bg-stockGreen/20 text-stockGreen px-2 py-1 rounded">YOU</span>}
                      </td>
                      <td className="py-5 px-6 font-mono text-right text-lg">
                        ${entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-5 px-6 font-mono text-right ${entry.pl >= 0 ? 'text-stockGreen' : 'text-stockRed'}`}>
                        {entry.pl >= 0 ? '+' : ''}${entry.pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
