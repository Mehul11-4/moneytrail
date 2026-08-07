import { useState } from "react";
import { Wallet, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";

function AddExpense() {
  const { addExpense } = useExpenses();
  const { categories } = useCategories();

  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Input validation — never trust that the form alone prevents bad data
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    await addExpense({
      amount: numericAmount,
      category: selectedCategory,
      date,
      note: note.trim().slice(0, 200), // cap note length defensively
    });

    // Reset form
    setAmount("");
    setSelectedCategory("");
    setNote("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-6">
        <Wallet className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <Input
            label="Amount (₹)"
            name="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecondary font-medium">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-2 rounded-control text-sm font-medium border transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-primary text-background border-primary"
                      : "bg-surface text-textPrimary border-white/10 hover:border-white/20"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Note (optional)"
            name="note"
            type="text"
            placeholder="e.g. Lunch with friends"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-danger text-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <Button type="submit" variant="primary">
            {success ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Saved!
              </span>
            ) : (
              "Save Expense"
            )}
          </Button>
        </Card>
      </form>
    </div>
  );
}

export default AddExpense;
