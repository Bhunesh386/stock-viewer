"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header({ email }: { email: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-800 bg-background text-primary space-y-4 md:space-y-0">
      <Link href="/dashboard" className="text-xl font-bold tracking-widest text-stockGreen">
        STOCKTERM
      </Link>
      <div className="flex flex-wrap justify-center gap-3 sm:space-x-6">
        <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">Dashboard</Link>
        <Link href="/dashboard/portfolio" className="text-sm text-gray-300 hover:text-white transition">Portfolio</Link>
        <Link href="/dashboard/history" className="text-sm text-gray-300 hover:text-white transition">History</Link>
        <Link href="/dashboard/leaderboard" className="text-sm text-gray-300 hover:text-white transition">Leaderboard</Link>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400 hidden sm:inline">{email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-1.5 rounded bg-card hover:bg-gray-800 transition text-sm text-stockRed"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
