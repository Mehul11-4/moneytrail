import { useState } from "react";
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { useBalance } from "../hooks/useBalance";

function Balance() {
  const {
    entries,
    loading,
    totalAdded,
    expenseTotal,
    remainingBalance,
    addBalanceEntry,
    deleteBalanceEntry,
  } = useBalance();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    await addBalanceEntry({
      amount: numericAmount,
      date,
      note: note.trim().slice(0, 200),
    });

    setAmount("");
    setNote("");
  };

  const confirmDelete = async (id) => {
    await deleteBalanceEntry(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-6">
        <Wallet className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Balance</h1>
      </div>

      {/* Remaining balance — the headline number */}
      <Card className="mb-4">
        <p className="text-textSecondary text-xs mb-1">Remaining Balance</p>
        <p
          className={`text-3xl font-heading font-bold ${remainingBalance < 0 ? "text-danger" : "text-primary"}`}
        >
          ₹{remainingBalance.toFixed(2)}
        </p>
        {remainingBalance < 0 && (
          <p className="text-danger text-xs mt-1">
            You've spent more than you've added.
          </p>
        )}
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <div>
            <p className="text-textSecondary text-xs">Total Added</p>
            <p className="text-lg font-heading font-bold">
              ₹{totalAdded.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-danger" />
          <div>
            <p className="text-textSecondary text-xs">Total Spent</p>
            <p className="text-lg font-heading font-bold">
              ₹{expenseTotal.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      {/* Add money form */}
      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Add Money</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Amount (₹)"
            name="balanceAmount"
            type="number"
            placeholder="2000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Date"
            name="balanceDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Note (optional)"
            name="balanceNote"
            type="text"
            placeholder="e.g. Salary, pocket money"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add to Balance
          </Button>
        </form>
      </Card>

      {/* History of additions */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-textSecondary">
          Balance History
        </p>
        {loading && <p className="text-textSecondary text-sm">Loading...</p>}
        {!loading && entries.length === 0 && (
          <p className="text-textSecondary text-sm">No balance added yet.</p>
        )}
        {entries.map((entry) => (
          <Card key={entry.id} className="flex justify-between items-center">
            <div>
              {entry.note && (
                <p className="text-sm font-medium">{entry.note}</p>
              )}
              <p className="text-xs text-textSecondary">{entry.date}</p>
            </div>
            {confirmDeleteId === entry.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger">Delete?</span>
                <button
                  onClick={() => confirmDelete(entry.id)}
                  className="text-danger text-xs font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-textSecondary text-xs"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="font-heading font-bold text-success">
                  +₹{entry.amount.toFixed(2)}
                </p>
                <button
                  onClick={() => setConfirmDeleteId(entry.id)}
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

export default Balance;
