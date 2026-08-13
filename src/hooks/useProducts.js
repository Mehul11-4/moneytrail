import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load products error:", error);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (product) => {
    const pricePerQty = product.unitPurchasePrice / product.qtyPerUnit;
    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      section: product.section || "Other",
      name: product.name,
      unit_label: product.unitLabel,
      qty_per_unit: product.qtyPerUnit,
      unit_purchase_price: product.unitPurchasePrice,
      price_per_qty: pricePerQty,
      mrp_per_qty: product.mrpPerQty,
      stock_qty: product.qtyPerUnit * product.unitsPurchased,
    });
    if (error) {
      console.error("Supabase add product error:", error);
    } else {
      await loadProducts();
    }
  };

  const updateProduct = async (id, updates) => {
    const { data: existing } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    const merged = { ...existing, ...mapUpdatesToDb(updates) };
    const pricePerQty = merged.unit_purchase_price / merged.qty_per_unit;

    const { error } = await supabase
      .from("products")
      .update({ ...mapUpdatesToDb(updates), price_per_qty: pricePerQty })
      .eq("id", id);

    if (error) {
      console.error("Supabase update product error:", error);
    } else {
      await loadProducts();
    }
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete product error:", error);
    } else {
      await loadProducts();
    }
  };

  const restockProduct = async (id, unitsAdded) => {
    const { data: existing } = await supabase
      .from("products")
      .select("stock_qty, qty_per_unit")
      .eq("id", id)
      .single();
    const addedQty = unitsAdded * existing.qty_per_unit;
    const { error } = await supabase
      .from("products")
      .update({ stock_qty: existing.stock_qty + addedQty })
      .eq("id", id);
    if (error) {
      console.error("Supabase restock error:", error);
    } else {
      await loadProducts();
    }
  };

  const deductStock = async (id, qtySold) => {
    const { data: existing } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", id)
      .single();
    const newStock = Math.max(0, existing.stock_qty - qtySold);
    const { error } = await supabase
      .from("products")
      .update({ stock_qty: newStock })
      .eq("id", id);
    if (error) {
      console.error("Supabase deduct stock error:", error);
    } else {
      await loadProducts();
    }
  };

  const restoreStockQty = async (id, qty) => {
    const { data: existing } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", id)
      .single();
    if (!existing) return;
    const { error } = await supabase
      .from("products")
      .update({ stock_qty: existing.stock_qty + qty })
      .eq("id", id);
    if (error) {
      console.error("Supabase restore stock error:", error);
    } else {
      await loadProducts();
    }
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

// Inventory.jsx edit form sends camelCase field names — convert to snake_case for Supabase
function mapUpdatesToDb(updates) {
  const map = {};
  if (updates.name !== undefined) map.name = updates.name;
  if (updates.unitLabel !== undefined) map.unit_label = updates.unitLabel;
  if (updates.qtyPerUnit !== undefined) map.qty_per_unit = updates.qtyPerUnit;
  if (updates.unitPurchasePrice !== undefined)
    map.unit_purchase_price = updates.unitPurchasePrice;
  if (updates.mrpPerQty !== undefined) map.mrp_per_qty = updates.mrpPerQty;
  if (updates.stockQty !== undefined) map.stock_qty = updates.stockQty;
  return map;
}
