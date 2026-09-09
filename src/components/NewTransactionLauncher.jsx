import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  ShoppingCart,
  HandCoins,
  Banknote,
  Users,
  Package,
  Zap,
  Droplet,
  MoreHorizontal,
} from "lucide-react";

const transactionTypes = [
  {
    to: "/business/counter",
    icon: ShoppingCart,
    label: "Sale",
    color: "text-success",
  },
  {
    to: "/business/jama-kharch/purchase-goods",
    icon: Package,
    label: "Purchase",
    color: "text-danger",
  },
  {
    to: "/business/jama-kharch/capital",
    icon: Banknote,
    label: "Capital",
    color: "text-success",
  },
  {
    to: "/business/jama-kharch/loan-taken",
    icon: HandCoins,
    label: "Loan Taken",
    color: "text-success",
  },
  {
    to: "/business/jama-kharch/borrowed",
    icon: Users,
    label: "Borrowed",
    color: "text-success",
  },
  {
    to: "/business/jama-kharch/rent",
    icon: Package,
    label: "Rent",
    color: "text-danger",
  },
  {
    to: "/business/jama-kharch/electricity",
    icon: Zap,
    label: "Electricity",
    color: "text-danger",
  },
  {
    to: "/business/jama-kharch/water-bill",
    icon: Droplet,
    label: "Water Bill",
    color: "text-danger",
  },
  {
    to: "/business/jama-kharch/loan-interest",
    icon: HandCoins,
    label: "Loan Interest",
    color: "text-danger",
  },
  {
    to: "/business/jama-kharch/other-jama",
    icon: MoreHorizontal,
    label: "Other Income",
    color: "text-success",
  },
  {
    to: "/business/jama-kharch/other-kharch",
    icon: MoreHorizontal,
    label: "Other Expense",
    color: "text-danger",
  },
];

function NewTransactionLauncher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-background shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-[80] flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 pb-8 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">New Transaction</p>
              <button
                onClick={() => setOpen(false)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {transactionTypes.map(({ to, icon: Icon, label, color }) => (
                <button
                  key={to}
                  onClick={() => {
                    navigate(to);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 bg-background border border-white/5 rounded-card py-4 shadow-sm hover:shadow-md hover:border-white/10 transition-shadow"
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="text-[10px] font-medium text-center px-1 leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewTransactionLauncher;
