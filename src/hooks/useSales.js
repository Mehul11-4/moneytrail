import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allPayments, setAllPayments] = useState([]);

  const loadAllPayments = async () => {
    const { data, error } = await supabase.from("udhaar_payments").select("*");
    if (error) {
      console.error("Supabase load all payments error:", error);
    } else {
      setAllPayments(data || []);
    }
  };

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
    loadAllPayments();
  }, [loadSales]);

  const getNextInvoiceNo = async () => {
    const { count } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true });
    return (count || 0) + 1;
  };

  const recordSale = async (sale) => {
    const now = new Date();
    const finalDate = sale.saleDate || now.toISOString().split("T")[0];
    const invoiceNo = await getNextInvoiceNo();

    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      invoice_no: invoiceNo,
      product_id: sale.productId,
      product_name: sale.productName,
      qty_sold: sale.qtySold,
      price_per_qty_at_sale: sale.pricePerQtyAtSale,
      mrp_at_sale: sale.mrpAtSale,
      total: sale.total,
      payment_mode: sale.paymentMode,
      customer_name: sale.customerName,
      billing_name: sale.billingName || sale.customerName,
      customer_phone: sale.customerPhone,
      received_amount: sale.receivedAmount,
      party_id: sale.partyId || null,
      date: finalDate,
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    if (error) {
      console.error("Supabase record sale error:", error);
      throw error;
    }
    await loadSales();
  };

  // Records multiple cart items as ONE transaction (shared payment mode,
  // customer, date, and transaction_id) — used by the multi-item Sale Voucher.
  const recordMultiSale = async (cartItems, meta) => {
    const now = new Date();
    const finalDate = meta.saleDate || now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const transactionId = crypto.randomUUID();
    const invoiceNo = await getNextInvoiceNo();

    // Received amount and balance due apply to the WHOLE transaction, so we
    // store the full received amount on the first row only — the block's
    // total/receivedAmount are always calculated by summing/reading that row.
    const rows = cartItems.map((item, i) => ({
      user_id: user.id,
      invoice_no: invoiceNo,
      product_id: item.productId,
      product_name: item.productName,
      qty_sold: item.qtySold,
      price_per_qty_at_sale: item.pricePerQtyAtSale,
      mrp_at_sale: item.mrpAtSale,
      total: item.total,
      payment_mode: meta.paymentMode,
      customer_name: meta.customerName,
      billing_name: meta.billingName || meta.customerName,
      customer_phone: meta.customerPhone,
      received_amount: i === 0 ? meta.receivedAmount : 0,
      party_id: meta.partyId || null,
      date: finalDate,
      time,
      transaction_id: transactionId,
    }));

    const { error } = await supabase.from("sales").insert(rows);
    if (error) {
      console.error("Supabase record multi-sale error:", error);
      throw error;
    }
    await loadSales();
  };

  const deleteSale = async (id) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete sale error:", error);
    } else {
      await loadSales();
    }
  };

  // Edit a SINGLE-ITEM sale's quantity and/or date. Recalculates total using
  // the original MRP (custom-total overrides are not preserved through an
  // edit — re-enter a custom price by deleting and re-adding if needed).
  // Multi-item cart sales are not editable here — delete and re-enter instead.
  const updateSale = async (sale, newQty, newDate) => {
    const qtyDiff = newQty - sale.qtySold;
    if (qtyDiff !== 0) {
      const { data: product } = await supabase
        .from("products")
        .select("is_static")
        .eq("id", sale.productId)
        .single();
      if (product && !product.is_static) {
        // Selling MORE than before means stock goes DOWN by the extra amount,
        // so the delta is negative of qtyDiff.
        const { error: rpcErr } = await supabase.rpc("adjust_stock", {
          product_id: sale.productId,
          delta: -qtyDiff,
        });
        if (rpcErr) {
          console.error("Supabase adjust stock (atomic) error:", rpcErr);
          throw rpcErr;
        }
      }
    }

    const newTotal = sale.mrpAtSale * newQty;
    const { error } = await supabase
      .from("sales")
      .update({ qty_sold: newQty, total: newTotal, date: newDate })
      .eq("id", sale.id);

    if (error) {
      console.error("Supabase update sale error:", error);
      throw error;
    }
    await loadSales();
  };
  const recordPayment = async (saleId, additionalAmount, paymentDate) => {
    const { data: sale, error: fetchErr } = await supabase
      .from("sales")
      .select("total, received_amount")
      .eq("id", saleId)
      .single();

    if (fetchErr) {
      console.error("Supabase fetch sale for payment error:", fetchErr);
      throw fetchErr;
    }

    const newReceived = Math.min(
      sale.total,
      (sale.received_amount || 0) + additionalAmount,
    );

    const { error } = await supabase
      .from("sales")
      .update({ received_amount: newReceived })
      .eq("id", saleId);

    if (error) {
      console.error("Supabase record payment error:", error);
      throw error;
    }

    // Log this specific payment with its date, so we can show a full
    // payment history later — separate from the running total on the sale.
    const { error: logErr } = await supabase.from("udhaar_payments").insert({
      user_id: user.id,
      sale_id: saleId,
      amount: additionalAmount,
      payment_date: paymentDate || new Date().toISOString().split("T")[0],
    });
    if (logErr) console.error("Supabase log udhaar payment error:", logErr);

    await loadSales();
    await loadAllPayments();
  };

  // Apply ONE lump payment across a party's outstanding Udhaar sales,
  // oldest first, until the amount is fully used or balances run out.
  const recordPartyPayment = async (partyId, totalAmount, paymentDate) => {
    const outstandingSales = sales
      .filter((s) => s.partyId === partyId && s.paymentMode === "Udhaar")
      .filter((s) => s.total - (s.receivedAmount || 0) > 0)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    let remaining = totalAmount;
    for (const sale of outstandingSales) {
      if (remaining <= 0) break;
      const balanceDue = sale.total - (sale.receivedAmount || 0);
      const applyAmount = Math.min(balanceDue, remaining);
      if (applyAmount > 0) {
        await recordPayment(sale.id, applyAmount, paymentDate);
        remaining -= applyAmount;
      }
    }
    return totalAmount - remaining; // actual amount successfully applied
  };

  const getPaymentHistory = async (saleId) => {
    const { data, error } = await supabase
      .from("udhaar_payments")
      .select("*")
      .eq("sale_id", saleId)
      .order("payment_date", { ascending: false });
    if (error) {
      console.error("Supabase fetch payment history error:", error);
      return [];
    }
    return data;
  };

  return {
    sales,
    loading,
    recordSale,
    recordMultiSale,
    deleteSale,
    updateSale,
    recordPayment,
    recordPartyPayment,
    getPaymentHistory,
    allPayments,
  };
}

// Convert snake_case DB fields to the camelCase shape the rest of the app expects
function mapSalesFromDb(rows) {
  return rows.map((s) => ({
    id: s.id,
    invoiceNo: s.invoice_no,
    productId: s.product_id,
    productName: s.product_name,
    qtySold: s.qty_sold,
    pricePerQtyAtSale: s.price_per_qty_at_sale,
    mrpAtSale: s.mrp_at_sale,
    total: s.total,
    paymentMode: s.payment_mode,
    customerName: s.customer_name,
    billingName: s.billing_name,
    customerPhone: s.customer_phone,
    receivedAmount: s.received_amount || 0,
    partyId: s.party_id,
    date: s.date,
    time: s.time,
    createdAt: s.created_at,
    transactionId: s.transaction_id,
  }));
}
