import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";

function ProfitLoss() {
  const { sales } = useSales();
  const { entries } = useLedger();

  const revenue = useMemo(
    () => sales.reduce((sum, s) => sum + s.total, 0),
    [sales],
  );

  // Simple cash-basis: ALL Kharch entries count as expenses, including Purchase Goods
  const totalExpenses = useMemo(
    () =>
      entries
        .filter((e) => e.type === "kharch")
        .reduce((sum, e) => sum + e.amount, 0),
    [entries],
  );

  // Breakdown by subtype, for transparency
  const expenseBreakdown = useMemo(() => {
    const map = {};
    entries
      .filter((e) => e.type === "kharch")
      .forEach((e) => {
        map[e.subtype] = (map[e.subtype] || 0) + e.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const netProfit = revenue - totalExpenses;

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mt-6 mb-4">
        Profit & Loss
      </h1>

      <div className="flex flex-col gap-3 mb-4">
        <Card>
          <div className="flex justify-between items-center">
            <p className="text-sm text-textSecondary">Revenue (Sales only)</p>
            <p className="font-heading font-bold text-success">
              ₹{revenue.toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-textSecondary">
              Total Expenses (all Kharch)
            </p>
            <p className="font-heading font-bold text-danger">
              − ₹{totalExpenses.toFixed(2)}
            </p>
          </div>
          {expenseBreakdown.length > 0 && (
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              {expenseBreakdown.map(([subtype, amt]) => (
                <div
                  key={subtype}
                  className="flex justify-between text-xs text-textSecondary"
                >
                  <span>{subtype}</span>
                  <span>₹{amt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          className={netProfit >= 0 ? "border-success/40" : "border-danger/40"}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {netProfit >= 0 ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-danger" />
              )}
              <p className="text-sm font-medium">Net Profit</p>
            </div>
            <p
              className={`font-heading font-bold text-2xl ${netProfit >= 0 ? "text-success" : "text-danger"}`}
            >
              ₹{netProfit.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      <p className="text-[10px] text-textSecondary/70">
        Note: this is cash-basis P&L — stock purchases are counted as an expense
        immediately, even if unsold. Revenue counts only actual sales (Capital,
        loans, and borrowed money are excluded).
      </p>
    </div>
  );
}

export default ProfitLoss;
