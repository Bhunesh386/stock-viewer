"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-gray-800 rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold tracking-widest text-stockGreen text-center mb-8">
          STOCKTERM
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Terminal ID</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded p-3 text-primary focus:ring-1 focus:ring-stockGreen focus:border-stockGreen focus:outline-none transition font-sans"
              placeholder="operator@system.io"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Code</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-gray-700 rounded p-3 text-primary focus:ring-1 focus:ring-stockGreen focus:border-stockGreen focus:outline-none transition tracking-widest"
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
            className="w-full bg-stockGreen hover:bg-green-400 text-black font-bold py-3 rounded transition uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Initialize Session"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          Unregistered operator?{" "}
          <Link href="/signup" className="text-stockGreen hover:underline">
            Request Access
          </Link>
        </div>
      </div>
    </div>
  );
}
