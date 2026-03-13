"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Portfolio", href: "/dashboard/portfolio" },
    { name: "History", href: "/dashboard/history" },
    { name: "Leaderboard", href: "/dashboard/leaderboard" },
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-cardBorder bg-card text-primary space-y-4 md:space-y-0 relative z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1, 0.8, 1] }}
        transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
      >
        <Link href="/dashboard" className="text-xl font-bold tracking-widest text-stockGreen">
          STOCKTERM
        </Link>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-4 sm:space-x-6">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.name} href={link.href} className={`relative text-sm transition ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center space-x-4">
        <motion.span 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8 }}
          className="text-sm text-gray-400 hidden sm:inline"
        >
          {email}
        </motion.span>
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
