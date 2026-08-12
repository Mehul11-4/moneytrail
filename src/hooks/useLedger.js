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
    } else {
      const existing = await db.products.get(productId);
      await restockProduct(productId, unitsPurchased);
      totalAmount = existing.unitPurchasePrice * unitsPurchased;
    }

    await addLedgerEntry({
      type: "kharch",
      subtype: "Purchase Goods",
      amount: totalAmount,
      date,
      note,
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
