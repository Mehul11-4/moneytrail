import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "2026-08"
}

export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    const month = currentMonth();
    const all = await db.budgets.where("month").equals(month).toArray();
    setBudgets(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Creates or updates the budget for a given scope ("overall" or category name)
  const setBudget = async (scope, monthlyLimit) => {
    const month = currentMonth();
    const existing = await db.budgets.where({ scope, month }).first();

    if (existing) {
      await db.budgets.update(existing.id, { monthlyLimit });
    } else {
      await db.budgets.add({ scope, month, monthlyLimit });
    }
    await loadBudgets();
  };

  const deleteBudget = async (id) => {
    await db.budgets.delete(id);
    await loadBudgets();
  };

  return { budgets, loading, setBudget, deleteBudget };
}
