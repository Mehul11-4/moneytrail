import { motion } from "framer-motion";

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
}) {
  const base =
    "font-body font-medium rounded-control px-4 py-2.5 transition-all duration-150 relative";

  const variants = {
    primary:
      "bg-gradient-to-b from-emerald-400 to-primary text-background shadow-[0_4px_0_0_rgb(6,95,70),0_6px_12px_-2px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_0_0_rgb(6,95,70),0_8px_16px_-2px_rgba(16,185,129,0.5)] active:shadow-[0_1px_0_0_rgb(6,95,70)] active:translate-y-[3px]",
    secondary:
      "bg-surface text-textPrimary border border-white/10 shadow-[0_3px_0_0_rgba(255,255,255,0.06)] hover:bg-white/5 active:shadow-none active:translate-y-[3px]",
    danger:
      "bg-gradient-to-b from-red-400 to-danger text-white shadow-[0_4px_0_0_rgb(127,29,29),0_6px_12px_-2px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_0_0_rgb(127,29,29),0_8px_16px_-2px_rgba(239,68,68,0.5)] active:shadow-[0_1px_0_0_rgb(127,29,29)] active:translate-y-[3px]",
    accent:
      "bg-gradient-to-b from-indigo-400 to-secondary text-white shadow-[0_4px_0_0_rgb(55,48,163),0_6px_12px_-2px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_0_0_rgb(55,48,163),0_8px_16px_-2px_rgba(99,102,241,0.5)] active:shadow-[0_1px_0_0_rgb(55,48,163)] active:translate-y-[3px]",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default Button;
