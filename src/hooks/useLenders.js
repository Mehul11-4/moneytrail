import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useLenders() {
  const { user } = useAuth();
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLenders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lenders")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      console.error("Supabase load lenders error:", error);
    } else {
      setLenders(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadLenders();
  }, [loadLenders]);

  const addLender = async (name, phone) => {
    const { data, error } = await supabase
      .from("lenders")
      .insert({
        user_id: user.id,
        name: name.trim(),
        phone: phone?.trim() || null,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase add lender error:", error);
      throw error;
    }
    await loadLenders();
    return data;
  };

  const updateLender = async (id, name, phone) => {
    const { error } = await supabase
      .from("lenders")
      .update({ name: name.trim(), phone: phone?.trim() || null })
      .eq("id", id);
    if (error) {
      console.error("Supabase update lender error:", error);
      throw error;
    }
    await loadLenders();
  };

  const deleteLender = async (id) => {
    const { error } = await supabase.from("lenders").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete lender error:", error);
      throw error;
    }
    await loadLenders();
  };

  return {
    lenders,
    loading,
    addLender,
    updateLender,
    deleteLender,
    loadLenders,
  };
}
