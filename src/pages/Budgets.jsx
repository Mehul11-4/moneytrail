import { useState, useMemo } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { useBudgets } from "../hooks/useBudgets";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";

function Budgets() {
  const { budgets, setBudget, deleteBudget } = useBudgets();
  const { expenses } = useExpenses();
  const { categories } = useCategories();

  const [scope, setScope] = useState("overall");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  // How much has been spent this month, per scope
  const spentByScope = useMemo(() => {
    const monthExpenses = expenses.filter((e) =>
      e.date.startsWith(currentMonthPrefix),
    );
    const totals = { overall: 0 };
    monthExpenses.forEach((e) => {
      totals.overall += e.amount;
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }, [expenses, currentMonthPrefix]);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError("");
    const numericLimit = parseFloat(limit);
    if (!limit || isNaN(numericLimit) || numericLimit <= 0) {
      setError("Enter a valid budget amount greater than 0.");
      return;
    }
    await setBudget(scope, numericLimit);
    setLimit("");
  };

  const getStatus = (spent, limit) => {
    const pct = (spent / limit) * 100;
    if (pct >= 100)
      return { color: "danger", label: "Over budget", pct: Math.min(pct, 100) };
    if (pct >= 80) return { color: "warning", label: "Near limit", pct };
    return { color: "success", label: "On track", pct };
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mt-6 mb-4">Budgets</h1>

      {/* Set/update a budget */}
      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Set Monthly Budget</p>
        <form onSubmit={handleAddBudget} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecondary font-medium">
              Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
            >
              <option value="overall">Overall (all spending)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Monthly Limit (₹)"
            name="limit"
            type="number"
            placeholder="5000"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" variant="primary">
            Save Budget
          </Button>
        </form>
      </Card>

      {/* Existing budgets with progress */}
      <div className="flex flex-col gap-3">
        {budgets.length === 0 && (
          <p className="text-textSecondary text-sm">
            No budgets set for this month yet.
          </p>
        )}
        {budgets.map((b) => {
          const spent = spentByScope[b.scope] || 0;
          const status = getStatus(spent, b.monthlyLimit);
          const barColor =
            status.color === "danger"
              ? "bg-danger"
              : status.color === "warning"
                ? "bg-warning"
                : "bg-success";
          const textColor =
            status.color === "danger"
              ? "text-danger"
              : status.color === "warning"
                ? "text-warning"
                : "text-success";

          return (
            <Card key={b.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">
                    {b.scope === "overall" ? "Overall" : b.scope}
                  </p>
                  <p className="text-xs text-textSecondary">
                    ₹{spent.toFixed(2)} of ₹{b.monthlyLimit.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => deleteBudget(b.id)}
                  className="text-textSecondary hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500`}
                  style={{ width: `${status.pct}%` }}
                />
              </div>

              <div
                className={`flex items-center gap-1 mt-2 text-xs font-medium ${textColor}`}
              >
                {status.color !== "success" && (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {status.label}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Budgets;
