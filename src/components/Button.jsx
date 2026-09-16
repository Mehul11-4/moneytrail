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
    "font-body font-medium rounded-control px-4 py-2.5 transition-all duration-150 shadow-sm";

  const variants = {
    primary:
      "bg-primary text-background hover:bg-emerald-400 hover:shadow-md hover:shadow-primary/20", // green — confirm, save, money in
    secondary:
      "bg-surface text-textPrimary border border-white/10 hover:bg-white/5", // grey — neutral, cancel
    danger:
      "bg-danger text-white hover:bg-red-500 hover:shadow-md hover:shadow-danger/20", // red — delete only
    accent:
      "bg-secondary text-white hover:bg-indigo-400 hover:shadow-md hover:shadow-secondary/20", // blue — purchase, money out (not destructive)
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default Button;
