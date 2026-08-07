function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}) {
  const base =
    "font-body font-medium rounded-control px-4 py-2.5 transition-colors duration-150 active:scale-[0.98]";

  const variants = {
    primary: "bg-primary text-background hover:bg-emerald-400",
    secondary:
      "bg-surface text-textPrimary border border-white/10 hover:bg-white/5",
    danger: "bg-danger text-white hover:bg-red-500",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
