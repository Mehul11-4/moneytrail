import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useParties() {
  const { user } = useAuth();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadParties = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("parties")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      console.error("Supabase load parties error:", error);
    } else {
      setParties(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  const addParty = async (name, phone) => {
    const { data, error } = await supabase
      .from("parties")
      .insert({ user_id: user.id, name: name.trim(), phone: phone.trim() })
      .select()
      .single();
    if (error) {
      console.error("Supabase add party error:", error);
      throw error;
    }
    await loadParties();
    return data;
  };

  const findOrCreateParty = async (name, phone) => {
    const existing = parties.find((p) => p.phone === phone.trim());
    if (existing) return existing;
    return await addParty(name, phone);
  };

  return { parties, loading, addParty, findOrCreateParty, loadParties };
}
