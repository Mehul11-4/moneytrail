import { NavLink } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  BookText,
  TrendingUp,
  HandCoins,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/business/counter", icon: ShoppingCart, label: "Sale Voucher" },
  { to: "/business/inventory", icon: Package, label: "Inventory" },
  { to: "/business/jama-kharch", icon: BookText, label: "Jama-Kharch" },
  { to: "/business/loan-taken", icon: HandCoins, label: "Loan Taken" },
  { to: "/business/udhaar-given", icon: Users, label: "Udhaar Given" },
  { to: "/business/profit-loss", icon: TrendingUp, label: "P&L" },
  { to: "/business/settings", icon: Settings, label: "Settings" },
];

function BusinessBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 z-50 pb-safe">
      <div className="flex items-center gap-1 overflow-x-auto py-2 px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-control text-[10px] font-medium transition-colors shrink-0 ${
                isActive ? "text-primary" : "text-textSecondary"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BusinessBottomNav;
