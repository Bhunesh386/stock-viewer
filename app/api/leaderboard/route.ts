import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0; // Opt out of static caching

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: portfolios, error: pErr } = await supabase.from('portfolios').select('*');
    if (pErr) throw pErr;
    
    const { data: holdings, error: hErr } = await supabase.from('holdings').select('*');
    if (hErr) throw hErr;
    
    // We need current prices for all unique symbols held by anyone
    const uniqueSymbols = Array.from(new Set((holdings || []).map(h => h.symbol)));
    const prices: Record<string, number> = {};
    
    await Promise.all(
      uniqueSymbols.map(async (sym) => {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${finnhubKey}`);
          const data = await res.json();
          if (data && data.c) {
            prices[sym] = data.c;
          }
        } catch {
          // ignore
        }
      })
    );
    
    const leaderboard = (portfolios || []).map(p => {
      let holdingsValue = 0;
      const userHoldings = (holdings || []).filter(h => h.user_id === p.user_id);
      userHoldings.forEach(h => {
        const price = prices[h.symbol] || h.avg_buy_price;
        holdingsValue += (price * h.quantity);
      });
      
      const totalValue = p.cash_balance + holdingsValue;
      const pl = totalValue - 10000;
      
      return {
        user_id: p.user_id,
        email: p.email || (p as any).username || `user_${p.user_id.substring(0,6)}@hidden.com`, // Fallback since auth.users isn't readable via anon client
        totalValue,
        pl
      };
    });
    
    leaderboard.sort((a, b) => b.totalValue - a.totalValue);
    
    return NextResponse.json(leaderboard);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
