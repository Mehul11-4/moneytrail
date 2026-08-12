import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, FileDown } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";
import { generateMonthlyPDF } from "../../utils/monthlyReport";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ProfitLoss() {
  const { sales } = useSales();
  const { entries } = useLedger();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const handleGeneratePDF = () => {
    generateMonthlyPDF({
      year: selectedYear,
      month: selectedMonth,
      sales,
      ledgerEntries: entries,
    });
  };

  const revenue = useMemo(
    () => sales.reduce((sum, s) => sum + s.total, 0),
    [sales],
  );

  const expenseBreakdown = useMemo(() => {
    const map = {};
    entries
      .filter((e) => e.type === "kharch")
      .forEach((e) => {
        map[e.subtype] = (map[e.subtype] || 0) + e.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const totalExpenses = useMemo(
    () => expenseBreakdown.reduce((sum, [, amt]) => sum + amt, 0),
    [expenseBreakdown],
  );
  const netProfit = revenue - totalExpenses;

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mt-6 mb-1">
        Profit & Loss
      </h1>
      <p className="text-xs text-textSecondary mb-4">
        Income vs Expenses comparison
      </p>

      {/* Net Profit — headline card */}
      <Card
        className={`mb-4 ${netProfit >= 0 ? "border-success/40" : "border-danger/40"}`}
      >
        <div className="flex items-center gap-2">
          {netProfit >= 0 ? (
            <TrendingUp className="w-6 h-6 text-success" />
          ) : (
            <TrendingDown className="w-6 h-6 text-danger" />
          )}
          <div>
            <p className="text-xs text-textSecondary">Net Profit</p>
            <p
              className={`text-2xl font-heading font-bold ${netProfit >= 0 ? "text-success" : "text-danger"}`}
            >
              ₹{netProfit.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      {/* Comparison Table */}
      <div className="grid grid-cols-2 gap-2 items-start">
        {/* INCOME column */}
        <div>
          <div className="flex items-center justify-center gap-1.5 bg-success/10 rounded-control py-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-bold text-success">INCOME</span>
          </div>
          <div className="flex flex-col gap-2">
            <Card className="border-success/20 !p-2.5">
              <p className="text-xs text-textSecondary">Sales</p>
              <p className="font-heading font-bold text-success text-sm">
                ₹{revenue.toFixed(2)}
              </p>
            </Card>
          </div>
          <Card className="mt-3 border-success/40 !p-2.5">
            {" "}
            <p className="text-xs font-medium text-textSecondary">
              Total Income
            </p>
            <p className="font-heading font-bold text-success">
              ₹{revenue.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* EXPENSES column */}
        <div>
          <div className="flex items-center justify-center gap-1.5 bg-danger/10 rounded-control py-2 mb-2">
            <TrendingDown className="w-4 h-4 text-danger" />
            <span className="text-sm font-bold text-danger">EXPENSES</span>
          </div>
          <div className="flex flex-col gap-2">
            {expenseBreakdown.length === 0 && (
              <Card className="border-danger/20 !p-2.5">
                <p className="text-xs text-textSecondary">No expenses yet</p>
              </Card>
            )}
            {expenseBreakdown.map(([subtype, amt]) => (
              <Card key={subtype} className="border-danger/20 !p-2.5">
                <p className="text-xs text-textSecondary">{subtype}</p>
                <p className="font-heading font-bold text-danger text-sm">
                  ₹{amt.toFixed(2)}
                </p>
              </Card>
            ))}
          </div>
          <Card className="mt-3 border-danger/40 !p-2.5">
            {" "}
            <p className="text-xs font-medium text-textSecondary">
              Total Expenses
            </p>
            <p className="font-heading font-bold text-danger">
              ₹{totalExpenses.toFixed(2)}
            </p>
          </Card>
        </div>
      </div>
      <p className="text-[10px] text-textSecondary/70 mt-4 mb-5">
        Cash-basis: stock purchases count as an expense immediately. Income
        counts only actual sales — Capital, loans, and borrowed money are
        excluded.
      </p>

      {/* Monthly PDF export */}
      <Card>
        <p className="text-sm font-medium mb-3">Monthly Summary PDF</p>
        <div className="flex gap-2 mb-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-28 bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          >
            {[
              now.getFullYear() - 1,
              now.getFullYear(),
              now.getFullYear() + 1,
            ].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          onClick={handleGeneratePDF}
          className="w-full flex items-center justify-center gap-2"
        >
          <FileDown className="w-4 h-4" /> Generate PDF
        </Button>
      </Card>
    </div>
  );
}

export default ProfitLoss;
