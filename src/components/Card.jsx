function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`bg-surface rounded-card p-4 border border-white/5 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
