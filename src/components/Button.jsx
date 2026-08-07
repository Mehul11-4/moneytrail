import { motion } from "framer-motion";

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}) {
  const base =
    "font-body font-medium rounded-control px-4 py-2.5 transition-colors duration-150";

  const variants = {
    primary: "bg-primary text-background hover:bg-emerald-400",
    secondary:
      "bg-surface text-textPrimary border border-white/10 hover:bg-white/5",
    danger: "bg-danger text-white hover:bg-red-500",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default Button;
