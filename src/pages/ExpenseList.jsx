import { useState, useMemo } from "react";
import { Trash2, Pencil, X, Check } from "lucide-react";
import Card from "../components/Card";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";

function ExpenseList() {
  const { expenses, loading, deleteExpense, updateExpense } = useExpenses();
  const { categories } = useCategories();

  const [filterCategory, setFilterCategory] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtered = useMemo(() => {
    if (filterCategory === "All") return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount.toString());
  };

  const saveEdit = async (id) => {
    const val = parseFloat(editAmount);
    if (isNaN(val) || val <= 0) return;
    await updateExpense(id, { amount: val });
    setEditingId(null);
  };

  const confirmDelete = async (id) => {
    await deleteExpense(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <h1 className="text-2xl font-heading font-bold mt-6 mb-4">Expenses</h1>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        <button
          onClick={() => setFilterCategory("All")}
          className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap border ${
            filterCategory === "All"
              ? "bg-primary text-background border-primary"
              : "bg-surface text-textPrimary border-white/10"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.name)}
            className={`px-3 py-1.5 rounded-control text-sm font-medium whitespace-nowrap border ${
              filterCategory === cat.name
                ? "bg-primary text-background border-primary"
                : "bg-surface text-textPrimary border-white/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Total for current filter */}
      <Card className="mb-4">
        <p className="text-textSecondary text-xs">
          {filterCategory === "All" ? "Total" : `${filterCategory} Total`}
        </p>
        <p className="text-2xl font-heading font-bold">₹{total.toFixed(2)}</p>
      </Card>

      {/* List */}
      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-textSecondary text-sm">No expenses found.</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((exp) => (
          <Card key={exp.id} className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium">{exp.category}</p>
              {exp.note && (
                <p className="text-xs text-textSecondary">{exp.note}</p>
              )}
              <p className="text-xs text-textSecondary">{exp.date}</p>
            </div>

            {editingId === exp.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-20 bg-background border border-white/10 rounded-control px-2 py-1 text-sm text-textPrimary"
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(exp.id)}
                  className="text-success"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-textSecondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : confirmDeleteId === exp.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger">Delete?</span>
                <button
                  onClick={() => confirmDelete(exp.id)}
                  className="text-danger"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-textSecondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="font-heading font-bold">
                  ₹{exp.amount.toFixed(2)}
                </p>
                <button
                  onClick={() => startEdit(exp)}
                  className="text-textSecondary hover:text-primary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(exp.id)}
                  className="text-textSecondary hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ExpenseList;
