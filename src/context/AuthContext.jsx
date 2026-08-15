import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in (e.g. returning visit)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events happening anywhere in the app
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
