function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`bg-surface rounded-card p-4 border border-white/5 shadow-sm transition-shadow duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:border-white/10" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
