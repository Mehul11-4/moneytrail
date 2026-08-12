import { useState, useEffect, useCallback } from "react";
import { db } from "../db/database";

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const all = await db.products.orderBy("createdAt").reverse().toArray();
    setProducts(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (product) => {
    const pricePerQty = product.unitPurchasePrice / product.qtyPerUnit;
    await db.products.add({
      ...product,
      section: product.section || "Other",
      pricePerQty,
      stockQty: product.qtyPerUnit * product.unitsPurchased,
      createdAt: new Date().toISOString(),
    });
    await loadProducts();
  };

  const updateProduct = async (id, updates) => {
    // If purchase price or qtyPerUnit changes, recalculate pricePerQty
    const existing = await db.products.get(id);
    const merged = { ...existing, ...updates };
    const pricePerQty = merged.unitPurchasePrice / merged.qtyPerUnit;
    await db.products.update(id, { ...updates, pricePerQty });
    await loadProducts();
  };

  const deleteProduct = async (id) => {
    await db.products.delete(id);
    await loadProducts();
  };

  // Adds more stock to an existing product (restocking)
  const restockProduct = async (id, unitsAdded) => {
    const existing = await db.products.get(id);
    const addedQty = unitsAdded * existing.qtyPerUnit;
    await db.products.update(id, { stockQty: existing.stockQty + addedQty });
    await loadProducts();
  };

  // Adds back a raw Qty amount (not Units) — used when a sale is deleted/undone
  const restoreStockQty = async (id, qty) => {
    const existing = await db.products.get(id);
    if (!existing) return; // product may have been deleted separately
    await db.products.update(id, { stockQty: existing.stockQty + qty });
    await loadProducts();
  };

  // Called by Counter (Stage 3) when a sale happens
  const deductStock = async (id, qtySold) => {
    const existing = await db.products.get(id);
    const newStock = Math.max(0, existing.stockQty - qtySold);
    await db.products.update(id, { stockQty: newStock });
    await loadProducts();
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    deductStock,
    restoreStockQty,
  };
}
