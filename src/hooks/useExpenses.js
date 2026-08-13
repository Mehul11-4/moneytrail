import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase load error:", error);
    } else {
      setExpenses(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const addExpense = async (expense) => {
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      note: expense.note,
    });
    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      await loadExpenses();
    }
    return { error };
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete error:", error);
    } else {
      await loadExpenses();
    }
  };

  const updateExpense = async (id, updates) => {
    const { error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id);
    if (error) {
      console.error("Supabase update error:", error);
    } else {
      await loadExpenses();
    }
  };

  return { expenses, loading, addExpense, deleteExpense, updateExpense };
}
