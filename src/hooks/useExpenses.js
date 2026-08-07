import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    const all = await db.expenses.orderBy("date").reverse().toArray();
    setExpenses(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const addExpense = async (expense) => {
    await db.expenses.add({
      ...expense,
      createdAt: new Date().toISOString(),
    });
    await loadExpenses();
  };

  const deleteExpense = async (id) => {
    await db.expenses.delete(id);
    await loadExpenses();
  };

  const updateExpense = async (id, updates) => {
    await db.expenses.update(id, updates);
    await loadExpenses();
  };

  return { expenses, loading, addExpense, deleteExpense, updateExpense };
}
