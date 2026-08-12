import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";
import { useProducts } from "./useProducts";

export function useLedger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { products, addProduct, restockProduct } = useProducts();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const all = await db.ledgerEntries.orderBy("createdAt").reverse().toArray();
    setEntries(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addLedgerEntry = async (entry) => {
    await db.ledgerEntries.add({
      ...entry,
      createdAt: new Date().toISOString(),
    });
    await loadEntries();
  };

  // Purchase Goods — a Kharch entry that ALSO updates Inventory
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
      const all = await db.products.orderBy("createdAt").reverse().toArray();
      finalProductId = all[0].id;
      totalAmount =
        productDetails.unitPurchasePrice * productDetails.unitsPurchased;
      productName = productDetails.name;
      unitLabel = productDetails.unitLabel;
    } else {
      const existing = await db.products.get(productId);
      await restockProduct(productId, unitsPurchased);
      totalAmount = existing.unitPurchasePrice * unitsPurchased;
      productName = existing.name;
      unitLabel = existing.unitLabel;
    }

    // Always lead the note with what was actually purchased, so every entry
    // is self-explanatory in lists — append the user's own note if they gave one
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
    await db.ledgerEntries.delete(id);
    await loadEntries();
  };

  return {
    entries,
    loading,
    addLedgerEntry,
    addPurchaseGoods,
    deleteLedgerEntry,
  };
}
