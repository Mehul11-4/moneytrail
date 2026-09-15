import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  ShoppingBag,
  Users,
  HandCoins,
  Plus,
  X,
} from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { usePurchases } from "../../hooks/usePurchases";
import { useLoans } from "../../hooks/useLoans";
import { useLedger } from "../../hooks/useLedger";
import { formatDate } from "../../utils/formatDate";

const JAMA_KHARCH_CATEGORIES = [
  { slug: "capital", label: "Capital", type: "jama" },
  { slug: "loan-taken", label: "Loan Taken", type: "jama" },
  { slug: "borrowed", label: "Borrowed", type: "jama" },
  { slug: "other-jama", label: "Other Income", type: "jama" },
  { slug: "loan-interest", label: "Loan Interest", type: "kharch" },
  { slug: "rent", label: "Rent", type: "kharch" },
  { slug: "electricity", label: "Electricity", type: "kharch" },
  { slug: "water-bill", label: "Water Bill", type: "kharch" },
  { slug: "other-kharch", label: "Other Expense", type: "kharch" },
];

function BusinessDashboard() {
  const navigate = useNavigate();
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { loans } = useLoans();
  const { entries } = useLedger();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const toReceive = useMemo(
    () =>
      sales
        .filter((s) => s.paymentMode === "Udhaar")
        .reduce((sum, s) => sum + s.total, 0),
    [sales],
  );
  const toPay = useMemo(
    () =>
      loans.filter((l) => !l.is_repaid).reduce((sum, l) => sum + l.amount, 0),
    [loans],
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTotal = useMemo(
    () =>
      sales
        .filter((s) => s.date === todayStr)
        .reduce((sum, s) => sum + s.total, 0),
    [sales, todayStr],
  );

  // ---- Total Balance (moved from Jama-Kharch) ----
  const totalJamaAllTime = useMemo(() => {
    const ledgerJama = entries
      .filter((e) => e.type === "jama")
      .reduce((s, e) => s + e.amount, 0);
    const salesJama = sales.reduce((s, sale) => s + sale.total, 0);
    return ledgerJama + salesJama;
  }, [entries, sales]);

  const totalKharchAllTime = useMemo(() => {
    const ledgerKharch = entries
      .filter((e) => e.type === "kharch")
      .reduce((s, e) => s + e.amount, 0);
    const purchaseKharch = purchases.reduce((s, p) => s + p.total, 0);
    return ledgerKharch + purchaseKharch;
  }, [entries, purchases]);

  const totalBalance = totalJamaAllTime - totalKharchAllTime;

  const balanceHistory = useMemo(() => {
    const byDate = {};
    sales.forEach((s) => {
      byDate[s.date] = byDate[s.date] || { jama: 0, kharch: 0 };
      byDate[s.date].jama += s.total;
    });
    purchases.forEach((p) => {
      byDate[p.date] = byDate[p.date] || { jama: 0, kharch: 0 };
      byDate[p.date].kharch += p.total;
    });
    entries.forEach((e) => {
      byDate[e.date] = byDate[e.date] || { jama: 0, kharch: 0 };
      if (e.type === "jama") byDate[e.date].jama += e.amount;
      else byDate[e.date].kharch += e.amount;
    });
    const sortedDates = Object.keys(byDate).sort();
    let running = 0;
    return sortedDates
      .map((date) => {
        running += byDate[date].jama - byDate[date].kharch;
        return {
          date,
          jama: byDate[date].jama,
          kharch: byDate[date].kharch,
          closingBalance: running,
        };
      })
      .reverse();
  }, [sales, purchases, entries]);

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

      <Card
        className={`mb-4 ${totalBalance >= 0 ? "border-success/40" : "border-danger/40"}`}
      >
        <p className="text-textSecondary text-sm mb-1">Total Balance</p>
        <p
          className={`text-3xl font-heading font-bold ${totalBalance >= 0 ? "text-success" : "text-danger"}`}
        >
          ₹{totalBalance.toFixed(2)}
        </p>
      </Card>

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
      <div className="grid grid-cols-2 gap-3 mb-6">
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

      {balanceHistory.length > 0 && (
        <div className="mb-2">
          <p className="text-sm font-medium text-textSecondary mb-2">
            Balance History
          </p>
          <Card className="!p-0 overflow-hidden">
            {(showAllHistory ? balanceHistory : balanceHistory.slice(0, 5)).map(
              (day, i) => (
                <div
                  key={day.date}
                  className={`flex justify-between items-center px-3 py-2.5 ${i !== 0 ? "border-t border-white/5" : ""}`}
                >
                  <p className="text-xs text-textSecondary">
                    {formatDate(day.date)}
                  </p>
                  <p
                    className={`text-sm font-bold ${day.closingBalance >= 0 ? "text-success" : "text-danger"}`}
                  >
                    ₹{day.closingBalance.toFixed(2)}
                  </p>
                </div>
              ),
            )}
          </Card>
          {balanceHistory.length > 5 && (
            <button
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="w-full text-center text-xs text-primary font-medium py-2"
            >
              {showAllHistory
                ? "Show Less"
                : `Show All (${balanceHistory.length} days)`}
            </button>
          )}
        </div>
      )}

      {/* Floating "+" for Jama-Kharch categories */}
      <button
        onClick={() => setShowAddMenu(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-background shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" />
      </button>

      {showAddMenu && (
        <div
          className="fixed inset-0 bg-black/70 z-[80] flex items-end"
          onClick={() => setShowAddMenu(false)}
        >
          <div
            className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 pb-8 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">
                Add Jama / Kharch
              </p>
              <button
                onClick={() => setShowAddMenu(false)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {JAMA_KHARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    navigate(`/business/jama-kharch/${cat.slug}`);
                    setShowAddMenu(false);
                  }}
                  className={`text-left p-3 rounded-card border ${cat.type === "jama" ? "bg-success/10 border-success/20" : "bg-danger/10 border-danger/20"}`}
                >
                  <p
                    className={`text-sm font-medium ${cat.type === "jama" ? "text-success" : "text-danger"}`}
                  >
                    {cat.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessDashboard;
