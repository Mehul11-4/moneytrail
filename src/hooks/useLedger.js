import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "./useProducts";

export function useLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addProduct, restockProduct } = useProducts();

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load ledger error:", error);
    } else {
      setEntries(mapEntriesFromDb(data));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addLedgerEntry = async (entry) => {
    const { error } = await supabase.from("ledger_entries").insert({
      user_id: user.id,
      type: entry.type,
      subtype: entry.subtype,
      amount: entry.amount,
      date: entry.date,
      note: entry.note,
      product_id: entry.productId || null,
    });
    if (error) {
      console.error("Supabase add ledger entry error:", error);
      throw error;
    }
    await loadEntries();
  };

  const addPurchaseGoods = async ({
    productId,
    isNewProduct,
    productDetails,
    unitsPurchased,
    date,
    note,
  }) => {
    let finalProductId = productId;
    let totalAmount;
    let productName;
    let unitLabel;

    if (isNewProduct) {
      await addProduct({
        name: productDetails.name,
        section: productDetails.section,
        unitLabel: productDetails.unitLabel,
        qtyPerUnit: productDetails.qtyPerUnit,
        unitPurchasePrice: productDetails.unitPurchasePrice,
        unitsPurchased: productDetails.unitsPurchased,
        mrpPerQty: productDetails.mrpPerQty,
      });

      const { data: newlyCreated, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchErr) {
        console.error("Supabase fetch new product error:", fetchErr);
        throw fetchErr;
      }

      finalProductId = newlyCreated.id;
      totalAmount =
        productDetails.unitPurchasePrice * productDetails.unitsPurchased;
      productName = productDetails.name;
      unitLabel = productDetails.unitLabel;
    } else {
      const { data: existing, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchErr) {
        console.error("Supabase fetch existing product error:", fetchErr);
        throw fetchErr;
      }

      await restockProduct(productId, unitsPurchased);
      totalAmount = existing.unit_purchase_price * unitsPurchased;
      productName = existing.name;
      unitLabel = existing.unit_label;
    }

    const autoDescription = `${productName} — ${unitsPurchased} ${unitLabel}${unitsPurchased > 1 ? "s" : ""}`;
    const fullNote = note ? `${autoDescription} (${note})` : autoDescription;

    await addLedgerEntry({
      type: "kharch",
      subtype: "Purchase Goods",
      amount: totalAmount,
      date,
      note: fullNote,
      productId: finalProductId,
    });
  };

  const deleteLedgerEntry = async (id) => {
    const { error } = await supabase
      .from("ledger_entries")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Supabase delete ledger entry error:", error);
    } else {
      await loadEntries();
    }
  };

  return {
    entries,
    loading,
    addLedgerEntry,
    addPurchaseGoods,
    deleteLedgerEntry,
  };
}

function mapEntriesFromDb(rows) {
  return rows.map((e) => ({
    id: e.id,
    type: e.type,
    subtype: e.subtype,
    amount: e.amount,
    date: e.date,
    note: e.note,
    productId: e.product_id,
    createdAt: e.created_at,
  }));
}
