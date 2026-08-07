import { NavLink } from "react-router-dom";
import {
  PlusCircle,
  List,
  LayoutDashboard,
  Wallet2,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", icon: PlusCircle, label: "Add" },
  { to: "/expenses", icon: List, label: "Expenses" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/budgets", icon: Wallet2, label: "Budgets" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex justify-around items-center py-2 pb-safe z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-2 py-1.5 rounded-control text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-textSecondary"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
