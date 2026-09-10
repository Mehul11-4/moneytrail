import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  ShoppingBag,
  Users,
  HandCoins,
} from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { useLoans } from "../../hooks/useLoans";

function BusinessDashboard() {
  const navigate = useNavigate();
  const { sales } = useSales();
  const { loans } = useLoans();

  const toReceive = useMemo(() => {
    return sales
      .filter((s) => s.paymentMode === "Udhaar")
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const toPay = useMemo(() => {
    return loans
      .filter((l) => !l.is_repaid)
      .reduce((sum, l) => sum + l.amount, 0);
  }, [loans]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTotal = useMemo(
    () =>
      sales
        .filter((s) => s.date === todayStr)
        .reduce((sum, s) => sum + s.total, 0),
    [sales, todayStr],
  );

  const quickAccess = [
    { to: "/business/sale", icon: ShoppingCart, label: "Sale" },
    { to: "/business/purchase", icon: ShoppingBag, label: "Purchase" },
    { to: "/business/udhaar-given", icon: Users, label: "Parties" },
    { to: "/business/loan-taken", icon: HandCoins, label: "Loan Taken" },
  ];

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-6">
        <Store className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-heading font-bold">CBN CHAI</h1>
          <p className="text-xs text-textSecondary">Sole Proprietorship</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card
          onClick={() => navigate("/business/udhaar-given")}
          className="border-success/30 bg-success/5"
        >
          <p className="text-xs text-textSecondary mb-1">To Receive</p>
          <p className="text-xl font-heading font-bold text-success">
            ₹{toReceive.toFixed(2)}
          </p>
        </Card>
        <Card
          onClick={() => navigate("/business/loan-taken")}
          className="border-danger/30 bg-danger/5"
        >
          <p className="text-xs text-textSecondary mb-1">To Pay</p>
          <p className="text-xl font-heading font-bold text-danger">
            ₹{toPay.toFixed(2)}
          </p>
        </Card>
      </div>

      <Card
        className="mb-6 border-primary/30"
        onClick={() => navigate("/business/sale")}
      >
        <p className="text-textSecondary text-sm mb-1">Today's Sales</p>
        <p className="text-2xl font-heading font-bold text-primary">
          ₹{todayTotal.toFixed(2)}
        </p>
      </Card>

      <p className="text-sm font-medium text-textSecondary mb-3">
        Quick Access
      </p>
      <div className="grid grid-cols-2 gap-3">
        {quickAccess.map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col items-center justify-center gap-2 bg-surface border border-white/5 rounded-card py-6 shadow-sm hover:shadow-md hover:border-white/10 transition-shadow"
          >
            <Icon className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-center px-1">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BusinessDashboard;
