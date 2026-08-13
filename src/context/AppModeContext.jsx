import { createContext, useContext, useState } from "react";

const AppModeContext = createContext();

export function AppModeProvider({ children }) {
  // Always start at the selector screen on every fresh login/session —
  // mode is no longer remembered across logins (by design)
  const [mode, setMode] = useState(null);

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
