import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // True only when the user opened a "reset password" link from their email.
  // Checked from the link itself AND from Supabase's PASSWORD_RECOVERY event.
  const [isRecovery, setIsRecovery] = useState(() =>
    window.location.hash.includes("type=recovery"),
  );

  useEffect(() => {
    // Check if already logged in (e.g. returning visit)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events happening anywhere in the app
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
        if (event === "SIGNED_OUT") setIsRecovery(false);
        setSession(session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) setIsRecovery(false);
    return { error };
  };

  const signOut = async () => {
    sessionStorage.removeItem("moneytrail_mode");
    await supabase.auth.signOut();
  };

  const updateEmail = async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    return { error };
  };

  const finishRecovery = () => setIsRecovery(false);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        loading,
        signUp,
        signIn,
        signOut,
        updateEmail,
        updatePassword,
        resetPassword,
        isRecovery,
        finishRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
