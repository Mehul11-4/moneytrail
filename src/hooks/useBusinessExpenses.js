import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

export function useBusinessExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const all = await db.businessExpenses.orderBy("date").reverse().toArray();
    setExpenses(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const addExpense = async (expense) => {
    await db.businessExpenses.add({
      ...expense,
      createdAt: new Date().toISOString(),
    });
    await loadExpenses();
  };

  const deleteExpense = async (id) => {
    await db.businessExpenses.delete(id);
    await loadExpenses();
  };

  return { expenses, loading, addExpense, deleteExpense };
}
