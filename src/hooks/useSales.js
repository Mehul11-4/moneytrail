import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    setLoading(true);
    const all = await db.sales.orderBy("createdAt").reverse().toArray();
    setSales(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const recordSale = async (sale) => {
    const now = new Date();
    await db.sales.add({
      ...sale,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: now.toISOString(),
    });
    await loadSales();
  };

  const deleteSale = async (id) => {
    await db.sales.delete(id);
    await loadSales();
  };

  return { sales, loading, recordSale, deleteSale };
}
