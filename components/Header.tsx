"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Header({ email }: { email: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-background text-primary">
      <div className="text-xl font-bold tracking-widest text-stockGreen">STOCKTERM</div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400">{email}</span>
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
