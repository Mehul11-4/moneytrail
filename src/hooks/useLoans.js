import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export function useLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLoans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase load loans error:", error);
    } else {
      setLoans(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const addLoan = async (loan) => {
    const { error } = await supabase.from("loans").insert({
      user_id: user.id,
      lender_name: loan.lenderName.trim(),
      amount: loan.amount,
      interest_rate: loan.interestRate || null,
      date: loan.date,
      note: loan.note,
    });
    if (error) {
      console.error("Supabase add loan error:", error);
      throw error;
    }
    await loadLoans();
  };

  const updateLoan = async (id, updates) => {
    const { error } = await supabase.from("loans").update(updates).eq("id", id);
    if (error) {
      console.error("Supabase update loan error:", error);
      throw error;
    }
    await loadLoans();
  };

  const deleteLoan = async (id) => {
    const { error } = await supabase.from("loans").delete().eq("id", id);
    if (error) {
      console.error("Supabase delete loan error:", error);
    } else {
      await loadLoans();
    }
  };

  const toggleRepaid = async (id, isRepaid) => {
    await updateLoan(id, { is_repaid: isRepaid });
  };

  return { loans, loading, addLoan, updateLoan, deleteLoan, toggleRepaid };
}
