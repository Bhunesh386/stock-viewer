import { supabase } from "./supabase";

export interface Portfolio {
  id: string;
  user_id: string;
  cash_balance: number;
  created_at: string;
}

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export async function getPortfolio(userId: string) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as Portfolio;
}

export async function getHoldings(userId: string) {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as Holding[];
}

export async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Transaction[];
}

export async function buyStock(userId: string, symbol: string, quantity: number, price: number) {
  const total = quantity * price;

  // 1. Get Portfolio
  const portfolio = await getPortfolio(userId);
  if (portfolio.cash_balance < total) {
    throw new Error("Insufficient funds");
  }

  // 2. Deduct Cash
  const { error: pErr } = await supabase
    .from('portfolios')
    .update({ cash_balance: portfolio.cash_balance - total })
    .eq('id', portfolio.id);
  if (pErr) throw pErr;

  // 3. Upsert Holding
  const { data: existingHolding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (existingHolding) {
    const newQuantity = existingHolding.quantity + quantity;
    const newTotalCost = (existingHolding.quantity * existingHolding.avg_buy_price) + total;
    const newAvgPrice = newTotalCost / newQuantity;

    const { error: hErr } = await supabase
      .from('holdings')
      .update({ quantity: newQuantity, avg_buy_price: newAvgPrice })
      .eq('id', existingHolding.id);
    if (hErr) throw hErr;
  } else {
    const { error: hErr } = await supabase
      .from('holdings')
      .insert({ user_id: userId, symbol, quantity, avg_buy_price: price });
    if (hErr) throw hErr;
  }

  // 4. Record Transaction
  const { error: tErr } = await supabase
    .from('transactions')
    .insert({ user_id: userId, symbol, type: 'BUY', quantity, price, total });
  if (tErr) throw tErr;

  return true;
}

export async function sellStock(userId: string, symbol: string, quantity: number, price: number) {
  const total = quantity * price;

  // 1. Check Holding
  const { data: existingHolding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (!existingHolding || existingHolding.quantity < quantity) {
    throw new Error("Insufficient shares");
  }

  // 2. Add Cash
  const portfolio = await getPortfolio(userId);
  const { error: pErr } = await supabase
    .from('portfolios')
    .update({ cash_balance: portfolio.cash_balance + total })
    .eq('id', portfolio.id);
  if (pErr) throw pErr;

  // 3. Update/Delete Holding
  if (existingHolding.quantity === quantity) {
    const { error: hErr } = await supabase
      .from('holdings')
      .delete()
      .eq('id', existingHolding.id);
    if (hErr) throw hErr;
  } else {
    const { error: hErr } = await supabase
      .from('holdings')
      .update({ quantity: existingHolding.quantity - quantity })
      .eq('id', existingHolding.id);
    if (hErr) throw hErr;
  }

  // 4. Record Transaction
  const { error: tErr } = await supabase
    .from('transactions')
    .insert({ user_id: userId, symbol, type: 'SELL', quantity, price, total });
  if (tErr) throw tErr;

  return true;
}
