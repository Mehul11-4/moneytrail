import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../db/database";

export function useBalance() {
  const [entries, setEntries] = useState([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const balanceEntries = await db.balanceEntries
      .orderBy("date")
      .reverse()
      .toArray();
    const allExpenses = await db.expenses.toArray();
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    setEntries(balanceEntries);
    setExpenseTotal(totalExpenses);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBalanceEntry = async (entry) => {
    await db.balanceEntries.add({
      ...entry,
      createdAt: new Date().toISOString(),
    });
    await loadData();
  };

  const deleteBalanceEntry = async (id) => {
    await db.balanceEntries.delete(id);
    await loadData();
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
