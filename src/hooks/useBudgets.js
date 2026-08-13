import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const month = currentMonth();
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month);

    if (error) {
      console.error("Supabase load budgets error:", error);
    } else {
      setBudgets(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const setBudget = async (scope, monthlyLimit) => {
    const month = currentMonth();
    const { data: existing } = await supabase
      .from("budgets")
      .select("id")
      .eq("scope", scope)
      .eq("month", month)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("budgets")
        .update({ monthly_limit: monthlyLimit })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("budgets").insert({
        user_id: user.id,
        scope,
        month,
        monthly_limit: monthlyLimit,
      }));
    }

    if (error) console.error("Supabase set budget error:", error);
    await loadBudgets();
  };

  const deleteBudget = async (id) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete budget error:", error);
    } else {
      await loadBudgets();
    }
  };

  return { budgets, loading, setBudget, deleteBudget };
}
