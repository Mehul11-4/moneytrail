import { createContext, useContext, useState, useEffect } from "react";

const AppModeContext = createContext();

export function AppModeProvider({ children }) {
  // Persist mode in sessionStorage so a page REFRESH doesn't kick you back
  // to the selector — but sessionStorage clears itself when the browser
  // tab/app is fully closed, or when we explicitly clear it on logout,
  // so a fresh LOGIN still starts at the selector as before.
  const [mode, setMode] = useState(() => {
    return sessionStorage.getItem("moneytrail_mode") || null;
  });

  useEffect(() => {
    if (mode) {
      sessionStorage.setItem("moneytrail_mode", mode);
    } else {
      sessionStorage.removeItem("moneytrail_mode");
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "personal" ? "business" : "personal"));
  };

  const goToSelector = () => {
    setMode(null);
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
