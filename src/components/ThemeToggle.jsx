import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Appearance</p>
        <p className="text-xs text-textSecondary">
          {isDark ? "Dark mode" : "Light mode"}
        </p>
      </div>

      <button
        onClick={toggleTheme}
        className="relative w-16 h-9 rounded-full p-1 transition-colors duration-300"
        style={{ backgroundColor: isDark ? "var(--color-surface)" : "#E4E4E7" }}
      >
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <motion.div
          animate={{ x: isDark ? 0 : 28 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="relative w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-background" />
          ) : (
            <Sun className="w-4 h-4 text-background" />
          )}
        </motion.div>
      </button>
    </div>
  );
}

export default ThemeToggle;
