function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-surface rounded-card p-4 border border-white/5 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
