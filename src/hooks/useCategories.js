import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#10B981" },
  { name: "Transport", color: "#6366F1" },
  { name: "Rent", color: "#F59E0B" },
  { name: "Shopping", color: "#EC4899" },
  { name: "Bills", color: "#EF4444" },
  { name: "Entertainment", color: "#8B5CF6" },
  { name: "Other", color: "#9CA3AF" },
];

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("categories").select("*");

    if (error) {
      console.error("Supabase load categories error:", error);
      return;
    }

    if (data.length === 0) {
      // First time this user has ever loaded categories — seed the defaults
      const seeded = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        user_id: user.id,
      }));
      const { error: seedError } = await supabase
        .from("categories")
        .insert(seeded);
      if (seedError) {
        console.error("Supabase seed categories error:", seedError);
      } else {
        const { data: reloaded } = await supabase
          .from("categories")
          .select("*");
        setCategories(reloaded || []);
      }
    } else {
      setCategories(data);
    }
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return { categories };
}
