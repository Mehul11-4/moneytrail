import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, X, Search, Pencil } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useLedger } from "../../hooks/useLedger";
import { usePersistedState } from "../../hooks/usePersistedState";

const LABELS = {
  capital: "Capital",
  "loan-taken": "Loan Taken",
  borrowed: "Borrowed (Friends/Family)",
  "loan-interest": "Loan Interest",
  rent: "Rent",
  electricity: "Electricity",
  "water-bill": "Water Bill",
  "other-jama": "Other",
  "other-kharch": "Other",
};

const TYPE_OF = {
  capital: "jama",
  "loan-taken": "jama",
  borrowed: "jama",
  "other-jama": "jama",
  "loan-interest": "kharch",
  rent: "kharch",
  electricity: "kharch",
  "water-bill": "kharch",
  "other-kharch": "kharch",
};

function LedgerCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const label = LABELS[slug] || "Entries";
  const type = TYPE_OF[slug] || "jama";
  const subtypeName =
    slug === "other-jama" || slug === "other-kharch" ? "Other" : label;

  const {
    entries,
    loading,
    addLedgerEntry,
    deleteLedgerEntry,
    updateLedgerEntry,
  } = useLedger();

  const [amount, setAmount] = usePersistedState(`ledger_${slug}_amount`, "");
  const [date, setDate] = usePersistedState(
    `ledger_${slug}_date`,
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = usePersistedState(`ledger_${slug}_note`, "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");

  const allItems = useMemo(() => {
    return entries
      .filter((e) => e.subtype === subtypeName && e.type === type)
      .map((e) => ({
        id: e.id,
        amount: e.amount,
        date: e.date,
        note: e.note,
        raw: e,
      }));
  }, [entries, subtypeName, type]);

  const items = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) =>
      (item.note || "").toLowerCase().includes(q),
    );
  }, [allItems, searchQuery]);

  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  const resetForm = () => {
    setAmount("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    if (!date) return setError("Select a date.");

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0)
      return setError("Enter a valid amount.");

    setIsSubmitting(true);
    try {
      await addLedgerEntry({
        type,
        subtype: subtypeName,
        amount: numericAmount,
        date,
        note: note.trim().slice(0, 200),
      });
      resetForm();
    } catch (err) {
      console.error("Ledger entry submit error:", err);
      setError(
        "Something went wrong saving this entry. Check the console for details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteLedgerEntry(confirmDelete.item.id);
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <button
          onClick={() => navigate("/business/home")}
          className="text-textSecondary"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-heading font-bold">{label}</h1>
      </div>

      <Card
        className={`mb-4 ${type === "jama" ? "border-success/40" : "border-danger/40"}`}
      >
        <p className="text-textSecondary text-sm mb-1">Total {label}</p>
        <p
          className={`text-2xl font-heading font-bold ${type === "jama" ? "text-success" : "text-danger"}`}
        >
          ₹{total.toFixed(2)}
        </p>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Add {label} Entry</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Amount (₹)"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2000"
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
          <Button
            type="submit"
            variant={type === "jama" ? "primary" : "danger"}
            className="flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4" />{" "}
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </Card>

      {allItems.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()} entries...`}
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <p className="text-sm font-medium text-textSecondary mb-2">
        {label} Entries
      </p>
      {items.length === 0 && (
        <p className="text-textSecondary text-sm">No entries yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Card key={item.id}>
            <button
              onClick={() => setViewingDetail(item)}
              className="text-left w-full"
            >
              <p className="text-sm text-textSecondary">{item.note}</p>
              <p className="text-xs text-textSecondary/70 mt-0.5">
                {formatDate(item.date)}
              </p>
            </button>
            <div className="flex justify-end items-center gap-3 mt-1">
              <p
                className={`font-heading font-bold ${type === "jama" ? "text-success" : "text-danger"}`}
              >
                {type === "jama" ? "+" : "−"}₹{item.amount.toFixed(2)}
              </p>
              {confirmDelete && confirmDelete.item.id === item.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleConfirmDelete}
                    className="text-danger text-xs font-medium"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-textSecondary text-xs"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete({ item: item.raw })}
                  className="text-textSecondary hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {viewingDetail && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingDetail(null);
            setEditingItem(null);
          }}
        >
          <Card
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">
                {editingItem ? "Edit Entry" : "Entry Details"}
              </p>
              <button
                onClick={() => {
                  setViewingDetail(null);
                  setEditingItem(null);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingItem ? (
              <div className="flex flex-col gap-3">
                <Input
                  label="Amount (₹)"
                  name="editAmount"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
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
                  placeholder="Any detail"
                />
                {editError && (
                  <p className="text-danger text-sm">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setEditError("");
                      if (!editDate) return setEditError("Select a date.");
                      const numericAmount = parseFloat(editAmount);
                      if (!numericAmount || numericAmount <= 0)
                        return setEditError("Enter a valid amount.");
                      try {
                        await updateLedgerEntry(viewingDetail.raw.id, {
                          amount: numericAmount,
                          date: editDate,
                          note: editNote,
                        });
                        setViewingDetail(null);
                        setEditingItem(null);
                      } catch (err) {
                        setEditError(err.message || "Failed to save changes.");
                      }
                    }}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingItem(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <DetailRow label="Type" value={label} />
                <DetailRow
                  label="Amount"
                  value={`₹${viewingDetail.amount.toFixed(2)}`}
                />
                <DetailRow
                  label="Date"
                  value={formatDate(viewingDetail.date)}
                />
                <DetailRow label="Note" value={viewingDetail.note || "—"} />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingItem(viewingDetail);
                    setEditAmount(viewingDetail.amount.toString());
                    setEditDate(viewingDetail.date);
                    setEditNote(viewingDetail.note || "");
                  }}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default LedgerCategory;
