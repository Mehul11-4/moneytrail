import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "./useProducts";

export function usePurchases() {
  const { user } = useAuth();
  const { addProduct, loadProducts } = useProducts();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const getNextInvoiceNo = async () => {
    const { count } = await supabase
      .from("purchases")
      .select("*", { count: "exact", head: true });
    return (count || 0) + 1;
  };

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load purchases error:", error);
    } else {
      setPurchases(mapFromDb(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Records a single item purchase. `product` can be an EXISTING product id,
  // or an object describing a brand-new product to create first.
  const recordPurchaseItem = async ({
    productId,
    isNewProduct,
    newProductDetails,
    qty,
    rate,
    unitRate,
    purchaseDate,
  }) => {
    let finalProductId = productId;
    let productName;

    if (isNewProduct) {
      // `rate` is now already the PER-UNIT price (e.g. ₹140 per pack) —
      // no multiplication needed, unlike the old buggy version.
      await addProduct({
        name: newProductDetails.name,
        section: newProductDetails.section,
        unitLabel: newProductDetails.unitLabel,
        qtyPerUnit: newProductDetails.qtyPerUnit,
        unitPurchasePrice: rate,
        unitsPurchased: qty / newProductDetails.qtyPerUnit,
        mrpPerQty: newProductDetails.mrpPerQty,
      });
      const { data: created } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      finalProductId = created.id;
      productName = created.name;
    } else {
      const { error: rpcErr } = await supabase.rpc("adjust_stock", {
        product_id: productId,
        delta: qty,
      });
      if (rpcErr) {
        console.error("Supabase adjust stock (purchase) error:", rpcErr);
        throw rpcErr;
      }

      const { data: product } = await supabase
        .from("products")
        .select("name, unit_purchase_price, qty_per_unit")
        .eq("id", productId)
        .single();
      productName = product?.name || "Unknown";

      // If the rate entered this time differs from what's stored, update
      // BOTH the per-Unit price (pre-fills next restock) AND the per-piece
      // Cost Price shown in Inventory — price_per_qty = unitRate / qtyPerUnit.
      if (unitRate && product && unitRate !== product.unit_purchase_price) {
        const qtyPerUnit = product.qty_per_unit || 1;
        const newCostPerPiece = unitRate / qtyPerUnit;
        const { error: priceErr } = await supabase
          .from("products")
          .update({
            unit_purchase_price: unitRate,
            price_per_qty: newCostPerPiece,
          })
          .eq("id", productId);
        if (priceErr)
          console.error("Supabase update product price error:", priceErr);
      }
    }

    await loadProducts();
    return { productId: finalProductId, productName };
  };

  const recordPurchase = async (item, meta) => {
    const now = new Date();
    const finalDate = meta.purchaseDate || now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const invoiceNo = await getNextInvoiceNo();

    const { productId, productName } = await recordPurchaseItem({
      ...item,
      purchaseDate: finalDate,
    });

    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      invoice_no: invoiceNo,
      product_id: productId,
      product_name: productName,
      qty: item.qty,
      units: item.units,
      rate: item.rate,
      total: item.total, // use the exact amount the user saw — never recompute
      party_name: meta.partyName,
      billing_name: meta.billingName || meta.partyName,
      party_phone: meta.partyPhone,
      received_amount: meta.paidAmount,
      payment_mode: meta.paymentMode,
      date: finalDate,
      time,
    });
    if (error) {
      console.error("Supabase record purchase error:", error);
      throw error;
    }
    await loadPurchases();
  };

  const recordMultiPurchase = async (items, meta) => {
    const now = new Date();
    const finalDate = meta.purchaseDate || now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const transactionId = crypto.randomUUID();
    const invoiceNo = await getNextInvoiceNo();

    const rows = [];
    for (const [i, item] of items.entries()) {
      const { productId, productName } = await recordPurchaseItem({
        ...item,
        purchaseDate: finalDate,
      });
      rows.push({
        user_id: user.id,
        invoice_no: invoiceNo,
        product_id: productId,
        product_name: productName,
        qty: item.qty,
        units: item.units,
        rate: item.rate,
        total: item.total, // use the exact amount the user saw — never recompute
        party_name: meta.partyName,
        billing_name: meta.billingName || meta.partyName,
        party_phone: meta.partyPhone,
        // Received amount applies to the whole transaction — store it on the
        // first row only, matching how Sale handles multi-item transactions.
        received_amount: i === 0 ? meta.paidAmount : 0,
        payment_mode: meta.paymentMode,
        date: finalDate,
        time,
        transaction_id: transactionId,
      });
    }

    const { error } = await supabase.from("purchases").insert(rows);
    if (error) {
      console.error("Supabase record multi-purchase error:", error);
      throw error;
    }
    await loadPurchases();
  };

  const deletePurchase = async (purchase) => {
    // Reverse the stock this purchase added
    const { error: rpcErr } = await supabase.rpc("adjust_stock", {
      product_id: purchase.productId,
      delta: -purchase.qty,
    });
    if (rpcErr)
      console.error("Supabase reverse stock on purchase delete error:", rpcErr);

    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchase.id);
    if (error) {
      console.error("Supabase delete purchase error:", error);
    } else {
      await loadPurchases();
      await loadProducts();
    }
  };

  return {
    purchases,
    loading,
    recordPurchase,
    recordMultiPurchase,
    deletePurchase,
  };
}

function mapFromDb(rows) {
  return rows.map((p) => ({
    id: p.id,
    invoiceNo: p.invoice_no,
    productId: p.product_id,
    productName: p.product_name,
    qty: p.qty,
    units: p.units,
    rate: p.rate,
    total: p.total,
    partyName: p.party_name,
    billingName: p.billing_name,
    partyPhone: p.party_phone,
    receivedAmount: p.received_amount || 0,
    paymentMode: p.payment_mode,
    date: p.date,
    time: p.time,
    transactionId: p.transaction_id,
    createdAt: p.created_at,
  }));
}
