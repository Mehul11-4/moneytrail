import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

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
    });
    if (error) {
      console.error("Supabase add ledger entry error:", error);
      throw error;
    }
    await loadEntries();
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

  const updateLedgerEntry = async (id, updates) => {
    const { error } = await supabase
      .from("ledger_entries")
      .update(updates)
      .eq("id", id);
    if (error) {
      console.error("Supabase update ledger entry error:", error);
      throw error;
    }
    await loadEntries();
  };

  return {
    entries,
    loading,
    addLedgerEntry,
    deleteLedgerEntry,
    updateLedgerEntry,
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
    createdAt: e.created_at,
  }));
}
