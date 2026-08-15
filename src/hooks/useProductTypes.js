import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const DEFAULT_TYPES = [
  "Cigarette",
  "Gutka",
  "Tambaku",
  "Bidi",
  "Wafers",
  "Biscuits",
  "Other",
];

export function useProductTypes() {
  const { user } = useAuth();
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTypes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("product_types")
      .select("*")
      .order("name");

    if (error) {
      console.error("Supabase load product types error:", error);
      setLoading(false);
      return;
    }

    if (data.length === 0) {
      const seeded = DEFAULT_TYPES.map((name) => ({ name, user_id: user.id }));
      const { error: seedError } = await supabase
        .from("product_types")
        .insert(seeded);
      if (seedError) {
        console.error("Supabase seed product types error:", seedError);
      } else {
        const { data: reloaded } = await supabase
          .from("product_types")
          .select("*")
          .order("name");
        setProductTypes(reloaded || []);
      }
    } else {
      setProductTypes(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const addProductType = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { error: new Error("Name cannot be empty.") };

    const exists = productTypes.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists)
      return { error: new Error("This product type already exists.") };

    const { error } = await supabase
      .from("product_types")
      .insert({ name: trimmed, user_id: user.id });
    if (!error) await loadTypes();
    return { error };
  };

  return { productTypes, loading, addProductType };
}
