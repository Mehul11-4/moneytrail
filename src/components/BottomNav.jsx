import { NavLink } from "react-router-dom";
import { PlusCircle, List, Wallet, LayoutDashboard } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/", icon: PlusCircle, label: "Add" },
  { to: "/expenses", icon: List, label: "Expenses" },
  { to: "/balance", icon: Wallet, label: "Balance" },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 flex items-stretch justify-between px-1 py-2 pb-safe z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
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

export default BottomNav;
