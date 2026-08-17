import { NavLink } from "react-router-dom";
import { ShoppingCart, BookText, Package, Users } from "lucide-react";

const navItems = [
  { to: "/business/counter", icon: ShoppingCart, label: "Sale Voucher" },
  { to: "/business/jama-kharch", icon: BookText, label: "Jama-Kharch" },
  { to: "/business/inventory", icon: Package, label: "Inventory" },
  { to: "/business/udhaar-given", icon: Users, label: "Udhaar Given" },
];

function BusinessBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex justify-around items-center py-2 pb-safe z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1.5 rounded-control text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-textSecondary"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="whitespace-nowrap">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BusinessBottomNav;
