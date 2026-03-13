"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
    } else {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        {!isSuccess && (
          <motion.div 
            key="login-card"
            initial={{ opacity: 0, y: 30 }}
            animate={shake ? { opacity: 1, y: 0, x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full bg-card border border-cardBorder rounded-lg shadow-2xl p-8"
          >
            <h1 className="text-3xl font-bold tracking-widest text-stockGreen text-center mb-8">
              STOCKTERM
            </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Email Terminal ID</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-cardBorder rounded p-3 text-primary focus:ring-1 focus:ring-accent focus:border-accent focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] focus:outline-none transition font-sans placeholder-secondary"
              placeholder="operator@system.io"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Access Code</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-cardBorder rounded p-3 text-primary focus:ring-1 focus:ring-accent focus:border-accent focus:shadow-[0_0_10px_rgba(59,130,246,0.3)] focus:outline-none transition tracking-widest placeholder-secondary"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="text-stockRed text-sm bg-red-950/30 p-3 rounded border border-red-900/50 break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3 rounded transition uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          Unregistered operator?{" "}
          <Link href="/signup" className="text-stockGreen hover:underline">
            Request Access
          </Link>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
