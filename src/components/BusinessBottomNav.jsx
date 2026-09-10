import { NavLink } from "react-router-dom";
import { Store, FileText, ShoppingCart, Package } from "lucide-react";

const navItems = [
  { to: "/business/home", icon: Store, label: "Home" },
  { to: "/business/sale-list", icon: FileText, label: "Sale List" },
  { to: "/business/purchase-list", icon: ShoppingCart, label: "Purchase List" },
  { to: "/business/inventory", icon: Package, label: "Inventory" },
];

function BusinessBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex items-stretch justify-between px-1 py-2 pb-safe z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 px-1 py-1 rounded-control text-[10px] font-medium leading-tight text-center transition-colors ${
              isActive ? "text-primary" : "text-textSecondary"
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BusinessBottomNav;
