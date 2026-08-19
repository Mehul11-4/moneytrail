function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  name,
  required = false,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="text-xs text-textSecondary font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm placeholder:text-textSecondary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
      />
    </div>
  );
}

export default Input;
