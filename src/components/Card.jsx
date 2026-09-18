import { motion } from "framer-motion";

function Card({ children, className = "", onClick, animate = false }) {
  const baseClass = `bg-surface rounded-card p-4 border border-border shadow-sm transition-shadow duration-200 ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${className}`;
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={baseClass}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClass} onClick={onClick}>
      {children}
    </div>
  );
}

export default Card;
