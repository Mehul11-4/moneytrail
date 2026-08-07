import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../components/Card";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";

function Dashboard() {
  const { expenses, loading } = useExpenses();
  const { categories } = useCategories();

  const categoryColorMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.name] = c.color));
    return map;
  }, [categories]);

  // Spending grouped by category (for pie chart)
  const byCategory = useMemo(() => {
    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [expenses]);

  // Spending by day, last 7 days (for bar chart)
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const total = expenses
        .filter((e) => e.date === iso)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({ day: label, total: parseFloat(total.toFixed(2)) });
    }
    return days;
  }, [expenses]);

  const grandTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const thisMonthTotal = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-08"
    return expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-textSecondary text-sm">Loading...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
        <h1 className="text-2xl font-heading font-bold mt-6 mb-4">Dashboard</h1>
        <Card>
          <p className="text-textSecondary text-sm">
            No expenses yet. Add some expenses to see your spending breakdown
            here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mt-6 mb-4">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-textSecondary text-xs mb-1">This Month</p>
          <p className="text-xl font-heading font-bold">
            ₹{thisMonthTotal.toFixed(2)}
          </p>
        </Card>
        <Card>
          <p className="text-textSecondary text-xs mb-1">All Time</p>
          <p className="text-xl font-heading font-bold">
            ₹{grandTotal.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Pie chart — spending by category */}
      <Card className="mb-4">
        <p className="text-sm font-medium mb-2">Spending by Category</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {byCategory.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={categoryColorMap[entry.name] || "#9CA3AF"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#15151E",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                itemStyle={{ color: "#F4F4F5" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bar chart — last 7 days */}
      <Card>
        <p className="text-sm font-medium mb-2">Last 7 Days</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <XAxis
                dataKey="day"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#15151E",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
                itemStyle={{ color: "#F4F4F5" }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="total" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
