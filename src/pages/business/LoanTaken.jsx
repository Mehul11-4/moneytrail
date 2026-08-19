import { useState, useMemo } from "react";
import {
  HandCoins,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useLoans } from "../../hooks/useLoans";
import { formatDate } from "../../utils/formatDate";

function LoanTaken() {
  const { loans, loading, addLoan, updateLoan, deleteLoan, toggleRepaid } =
    useLoans();

  const [showForm, setShowForm] = useState(false);
  const [lenderName, setLenderName] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewingLender, setViewingLender] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const grouped = useMemo(() => {
    const map = {};
    loans.forEach((l) => {
      if (!map[l.lender_name]) map[l.lender_name] = [];
      map[l.lender_name].push(l);
    });
    return Object.entries(map).map(([name, entries]) => ({
      name,
      entries,
      totalOwed: entries
        .filter((e) => !e.is_repaid)
        .reduce((s, e) => s + e.amount, 0),
    }));
  }, [loans]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.trim().toLowerCase();
    return grouped.filter((g) => g.name.toLowerCase().includes(q));
  }, [grouped, searchQuery]);

  const totalAllOwed = useMemo(
    () => grouped.reduce((s, g) => s + g.totalOwed, 0),
    [grouped],
  );

  const resetForm = () => {
    setLenderName("");
    setAmount("");
    setInterestRate("");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const numericAmount = parseFloat(amount);
    if (!lenderName.trim()) return setError("Enter lender name.");
    if (!numericAmount || numericAmount <= 0)
      return setError("Enter a valid amount.");
    if (!date) return setError("Select a date.");

    try {
      await addLoan({
        lenderName,
        amount: numericAmount,
        interestRate: interestRate ? parseFloat(interestRate) : null,
        date,
        note: note.trim().slice(0, 200),
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Failed to save loan.");
    }
  };

  const openEdit = (loan) => {
    setEditingLoan(loan);
    setEditAmount(loan.amount.toString());
    setEditRate(loan.interest_rate ? loan.interest_rate.toString() : "");
    setEditDate(loan.date);
    setEditNote(loan.note || "");
  };

  const handleSaveEdit = async () => {
    const numericAmount = parseFloat(editAmount);
    if (!numericAmount || numericAmount <= 0) return;
    await updateLoan(editingLoan.id, {
      amount: numericAmount,
      interest_rate: editRate ? parseFloat(editRate) : null,
      date: editDate,
      note: editNote,
    });
    setEditingLoan(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <HandCoins className="w-7 h-7 text-danger" />
        <h1 className="text-2xl font-heading font-bold">Loan Taken</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">
        Money you owe to lenders
      </p>

      <Card className="mb-4 border-danger/40">
        <p className="text-textSecondary text-sm mb-1">
          Total Owed (All Lenders)
        </p>
        <p className="text-2xl font-heading font-bold text-danger">
          ₹{totalAllOwed.toFixed(2)}
        </p>
      </Card>

      <Button
        variant="danger"
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" /> Add Loan
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              label="Lender Name"
              name="lenderName"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="e.g. Suresh Uncle"
            />
            <Input
              label="Amount (₹)"
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
            />
            <Input
              label="Interest Rate % (optional)"
              name="interestRate"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="e.g. 2 (leave blank if zero interest)"
            />
            <Input
              label="Date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Note (optional)"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any detail"
            />
            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" variant="danger" className="flex-1">
                Save Loan
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {grouped.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lender name..."
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {loading && <LoadingSpinner label="Loading loans..." />}
      {!loading && filteredGroups.length === 0 && (
        <p className="text-textSecondary text-sm">No loans recorded yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {filteredGroups.map((group) => (
          <button
            key={group.name}
            onClick={() => setViewingLender(group)}
            className="text-left w-full"
          >
            <Card animate>
              <div className="flex justify-between items-center">
                <p className="font-medium">{group.name}</p>
                <p className="font-heading font-bold text-danger">
                  ₹{group.totalOwed.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                {group.entries.length} entr
                {group.entries.length !== 1 ? "ies" : "y"}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {viewingLender && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingLender(null);
            setEditingLoan(null);
          }}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">
                {viewingLender.name}
              </p>
              <button
                onClick={() => {
                  setViewingLender(null);
                  setEditingLoan(null);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {viewingLender.entries.map((loan) => (
                <Card
                  key={loan.id}
                  className={loan.is_repaid ? "opacity-50" : ""}
                >
                  {editingLoan?.id === loan.id ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        label="Amount (₹)"
                        name="editAmount"
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />
                      <Input
                        label="Interest Rate %"
                        name="editRate"
                        type="number"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                      />
                      <Input
                        label="Date"
                        name="editDate"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <Input
                        label="Note"
                        name="editNote"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          onClick={handleSaveEdit}
                          className="flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingLoan(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-heading font-bold">
                            ₹{loan.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-textSecondary">
                            {formatDate(loan.date)}
                          </p>
                          {loan.interest_rate ? (
                            <p className="text-xs text-textSecondary">
                              Interest: {loan.interest_rate}%
                            </p>
                          ) : null}
                          {loan.note && (
                            <p className="text-xs text-textSecondary">
                              {loan.note}
                            </p>
                          )}
                          {loan.is_repaid && (
                            <p className="text-xs text-success font-medium mt-1">
                              ✓ Repaid
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(loan)}
                              className="text-textSecondary hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {confirmDeleteId === loan.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    await deleteLoan(loan.id);
                                    setConfirmDeleteId(null);
                                  }}
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
                              <button
                                onClick={() => setConfirmDeleteId(loan.id)}
                                className="text-textSecondary hover:text-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              toggleRepaid(loan.id, !loan.is_repaid)
                            }
                            className={`text-xs px-2 py-1 rounded-control border flex items-center gap-1 ${loan.is_repaid ? "border-white/10 text-textSecondary" : "border-success/40 text-success"}`}
                          >
                            <Check className="w-3 h-3" />{" "}
                            {loan.is_repaid ? "Mark Unpaid" : "Mark Repaid"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LoanTaken;
