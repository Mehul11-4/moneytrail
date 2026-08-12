import { createContext, useContext, useState, useEffect } from "react";

const AppModeContext = createContext();

export function AppModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("moneytrail_mode") || null;
  });

  useEffect(() => {
    if (mode) {
      localStorage.setItem("moneytrail_mode", mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "personal" ? "business" : "personal"));
  };

  const goToSelector = () => {
    setMode(null);
    localStorage.removeItem("moneytrail_mode");
  };

  return (
    <AppModeContext.Provider
      value={{ mode, setMode, toggleMode, goToSelector }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
