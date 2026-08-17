import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, TrendingUp, HandCoins, Settings, X } from "lucide-react";

const menuItems = [
  { to: "/business/profit-loss", icon: TrendingUp, label: "P&L" },
  { to: "/business/loan-taken", icon: HandCoins, label: "Loan Taken" },
  { to: "/business/settings", icon: Settings, label: "Settings" },
];

function BusinessTopBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-50 bg-surface border border-white/10 rounded-control p-2"
      >
        <Menu className="w-5 h-5 text-textPrimary" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-[70]"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-64 bg-surface border-l border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <p className="font-heading font-bold">More</p>
              <button
                onClick={() => setOpen(false)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {menuItems.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => {
                    navigate(to);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-control text-sm font-medium text-textPrimary hover:bg-white/5 text-left"
                >
                  <Icon className="w-5 h-5 text-textSecondary" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BusinessTopBar;
