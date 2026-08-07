import { NavLink } from "react-router-dom";
import {
  PlusCircle,
  List,
  LayoutDashboard,
  Wallet2,
  Settings,
  Wallet,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/add", icon: PlusCircle, label: "Add" },
  { to: "/expenses", icon: List, label: "Expenses" },
  { to: "/balance", icon: Wallet, label: "Balance" },
  { to: "/budgets", icon: Wallet2, label: "Budgets" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex justify-around items-center py-2 pb-safe z-50 overflow-x-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-2 py-1.5 rounded-control text-[9px] font-medium transition-colors shrink-0 ${
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
