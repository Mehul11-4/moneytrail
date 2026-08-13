import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useBalance() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: balanceEntries, error: balErr } = await supabase
      .from("balance_entries")
      .select("*")
      .order("date", { ascending: false });

    const { data: allExpenses, error: expErr } = await supabase
      .from("expenses")
      .select("amount");

    if (balErr) console.error("Supabase load balance error:", balErr);
    if (expErr)
      console.error("Supabase load expenses (for balance) error:", expErr);

    setEntries(balanceEntries || []);
    setExpenseTotal((allExpenses || []).reduce((sum, e) => sum + e.amount, 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBalanceEntry = async (entry) => {
    const { error } = await supabase.from("balance_entries").insert({
      user_id: user.id,
      amount: entry.amount,
      date: entry.date,
      note: entry.note,
    });
    if (error) {
      console.error("Supabase add balance entry error:", error);
    } else {
      await loadData();
    }
  };

  const deleteBalanceEntry = async (id) => {
    const { error } = await supabase
      .from("balance_entries")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase delete balance entry error:", error);
    } else {
      await loadData();
    }
  };

  const totalAdded = useMemo(
    () => entries.reduce((sum, e) => sum + e.amount, 0),
    [entries],
  );
  const remainingBalance = useMemo(
    () => totalAdded - expenseTotal,
    [totalAdded, expenseTotal],
  );

  return {
    entries,
    loading,
    totalAdded,
    expenseTotal,
    remainingBalance,
    addBalanceEntry,
    deleteBalanceEntry,
  };
}
