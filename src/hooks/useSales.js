import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load sales error:", error);
    } else {
      setSales(mapSalesFromDb(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const recordSale = async (sale) => {
    const now = new Date();
    // Use the provided saleDate if given (for backdated entries), otherwise today.
    // Time is always "now" — we don't ask the user to guess a past time.
    const finalDate = sale.saleDate || now.toISOString().split("T")[0];

    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      product_id: sale.productId,
      product_name: sale.productName,
      qty_sold: sale.qtySold,
      price_per_qty_at_sale: sale.pricePerQtyAtSale,
      mrp_at_sale: sale.mrpAtSale,
      total: sale.total,
      payment_mode: sale.paymentMode,
      customer_name: sale.customerName,
      customer_phone: sale.customerPhone,
      date: finalDate,
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    if (error) {
      console.error("Supabase record sale error:", error);
    } else {
      await loadSales();
    }
  };

  const deleteSale = async (id) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete sale error:", error);
    } else {
      await loadSales();
    }
  };

  return { sales, loading, recordSale, deleteSale };
}

// Convert snake_case DB fields to the camelCase shape the rest of the app expects
function mapSalesFromDb(rows) {
  return rows.map((s) => ({
    id: s.id,
    productId: s.product_id,
    productName: s.product_name,
    qtySold: s.qty_sold,
    pricePerQtyAtSale: s.price_per_qty_at_sale,
    mrpAtSale: s.mrp_at_sale,
    total: s.total,
    paymentMode: s.payment_mode,
    customerName: s.customer_name,
    customerPhone: s.customer_phone,
    date: s.date,
    time: s.time,
    createdAt: s.created_at,
  }));
}
