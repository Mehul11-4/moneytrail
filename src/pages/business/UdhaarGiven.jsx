import { useState, useMemo } from "react";
import { Users, Search, X, Phone, Plus } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { useParties } from "../../hooks/useParties";
import { formatDate } from "../../utils/formatDate";

function UdhaarGiven() {
  const { sales, loading, recordPayment, getPaymentHistory } = useSales();
  const { parties, loading: partiesLoading, addParty } = useParties();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingParty, setViewingParty] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payError, setPayError] = useState("");
  const [paymentHistories, setPaymentHistories] = useState({});
  const [showAddParty, setShowAddParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addPartyError, setAddPartyError] = useState("");

  // Each permanent Party account, with its own list of Udhaar sales linked
  // via party_id, and a live-calculated balance due.
  const grouped = useMemo(() => {
    return parties
      .map((party) => {
        const partySales = sales.filter(
          (s) => s.partyId === party.id && s.paymentMode === "Udhaar",
        );
        const totalOwed = partySales.reduce(
          (sum, s) => sum + Math.max(0, s.total - (s.receivedAmount || 0)),
          0,
        );
        return { ...party, sales: partySales, totalOwed };
      })
      .sort((a, b) => b.totalOwed - a.totalOwed);
  }, [parties, sales]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.trim().toLowerCase();
    return grouped.filter(
      (g) => g.name.toLowerCase().includes(q) || g.phone.includes(q),
    );
  }, [grouped, searchQuery]);

  const totalAllOwed = useMemo(
    () => grouped.reduce((s, g) => s + g.totalOwed, 0),
    [grouped],
  );

  const viewingPartyLive = viewingParty
    ? grouped.find((g) => g.id === viewingParty.id) || null
    : null;

  const handleAddParty = async (e) => {
    e.preventDefault();
    setAddPartyError("");
    if (!newPartyName.trim()) return setAddPartyError("Enter a name.");
    if (!/^\d{10}$/.test(newPartyPhone.trim()))
      return setAddPartyError("Enter a valid 10-digit phone number.");
    try {
      await addParty(newPartyName, newPartyPhone);
      setNewPartyName("");
      setNewPartyPhone("");
      setShowAddParty(false);
    } catch (err) {
      setAddPartyError(
        err.message?.includes("duplicate")
          ? "This phone number is already registered to another party."
          : "Failed to add party.",
      );
    }
  };

  const handleRecordPayment = async (sale) => {
    setPayError("");
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return setPayError("Enter a valid amount.");
    const balanceDue = sale.total - (sale.receivedAmount || 0);
    if (amount > balanceDue)
      return setPayError(
        `Cannot exceed balance due of ₹${balanceDue.toFixed(2)}.`,
      );
    try {
      await recordPayment(sale.id, amount, payDate);
      setPayingId(null);
      setPayAmount("");
      loadHistoryFor(sale.id);
    } catch (err) {
      setPayError(err.message || "Failed to record payment.");
    }
  };

  const loadHistoryFor = async (saleId) => {
    const history = await getPaymentHistory(saleId);
    setPaymentHistories((prev) => ({ ...prev, [saleId]: history }));
  };

  const toggleHistory = (saleId) => {
    if (paymentHistories[saleId]) {
      setPaymentHistories((prev) => {
        const next = { ...prev };
        delete next[saleId];
        return next;
      });
    } else {
      loadHistoryFor(saleId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <Users className="w-7 h-7 text-parties" />
        <h1 className="text-2xl font-heading font-bold">Parties</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">Your customer accounts</p>

      <Card className="mb-4 border-parties/40">
        <p className="text-textSecondary text-sm mb-1">
          Total Owed (All Customers)
        </p>
        <p className="text-2xl font-heading font-bold text-parties">
          ₹{totalAllOwed.toFixed(2)}
        </p>
      </Card>

      <Button
        variant="accent"
        onClick={() => setShowAddParty(!showAddParty)}
        className="w-full flex items-center justify-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" /> Add New Party
      </Button>

      {showAddParty && (
        <Card className="mb-4">
          <form onSubmit={handleAddParty} className="flex flex-col gap-3">
            <Input
              label="Customer Name"
              name="newPartyName"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
            <Input
              label="Phone Number"
              name="newPartyPhone"
              type="tel"
              value={newPartyPhone}
              onChange={(e) =>
                setNewPartyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="e.g. 9876543210"
            />
            {addPartyError && (
              <p className="text-danger text-sm">{addPartyError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="accent" className="flex-1">
                Save Party
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddParty(false)}
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
            placeholder="Search name or phone..."
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {(loading || partiesLoading) && (
        <p className="text-textSecondary text-sm">Loading...</p>
      )}
      {!loading && !partiesLoading && filteredGroups.length === 0 && (
        <p className="text-textSecondary text-sm">
          No parties yet. Add one above, or it'll be created automatically on
          your first Udhaar sale.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filteredGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => setViewingParty(group)}
            className="text-left"
          >
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-textSecondary flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {group.phone}
                  </p>
                </div>
                <p
                  className={`font-heading font-bold ${group.totalOwed > 0 ? "text-parties" : "text-success"}`}
                >
                  ₹{group.totalOwed.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                {group.sales.length} purchase
                {group.sales.length !== 1 ? "s" : ""}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {viewingPartyLive && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingParty(null);
            setPayingId(null);
          }}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-heading font-bold text-lg">
                  {viewingPartyLive.name}
                </p>
                <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" /> {viewingPartyLive.phone}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingParty(null);
                  setPayingId(null);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Card className="mb-3 border-parties/30">
              <p className="text-xs text-textSecondary">Total Owed</p>
              <p className="text-xl font-heading font-bold text-parties">
                ₹{viewingPartyLive.totalOwed.toFixed(2)}
              </p>
            </Card>

            <p className="text-xs font-medium text-textSecondary mb-2">
              Purchase History
            </p>
            {viewingPartyLive.sales.length === 0 && (
              <p className="text-textSecondary text-xs">
                No Udhaar purchases yet for this party.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {viewingPartyLive.sales.map((s) => {
                const balanceDue = Math.max(
                  0,
                  s.total - (s.receivedAmount || 0),
                );
                const isPaid = balanceDue <= 0;
                return (
                  <Card key={s.id} className="!p-2.5">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm font-medium">
                          {s.productName} × {s.qtySold}
                        </p>
                        <p className="text-xs text-textSecondary">
                          {formatDate(s.date)} · {s.time}
                        </p>
                      </div>
                      <p className="font-heading font-bold text-sm">
                        ₹{s.total.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] mb-1.5">
                      <span className="text-success font-medium">
                        Jama ₹{(s.receivedAmount || 0).toFixed(2)}
                      </span>
                      <span
                        className={
                          isPaid
                            ? "text-success font-medium"
                            : "text-danger font-medium"
                        }
                      >
                        {isPaid ? "Paid" : `Bakaya ₹${balanceDue.toFixed(2)}`}
                      </span>
                    </div>

                    {(s.receivedAmount || 0) > 0 && (
                      <button
                        onClick={() => toggleHistory(s.id)}
                        className="text-[10px] text-textSecondary underline mb-1.5"
                      >
                        {paymentHistories[s.id]
                          ? "Hide payment history"
                          : "View payment history"}
                      </button>
                    )}

                    {paymentHistories[s.id] && (
                      <div className="flex flex-col gap-1 mb-1.5 pl-2 border-l border-white/10">
                        {paymentHistories[s.id].length === 0 ? (
                          <p className="text-[10px] text-textSecondary/70">
                            No individual payments logged.
                          </p>
                        ) : (
                          paymentHistories[s.id].map((p) => (
                            <p
                              key={p.id}
                              className="text-[10px] text-textSecondary"
                            >
                              {formatDate(p.payment_date)} —{" "}
                              <span className="text-success">
                                ₹{p.amount.toFixed(2)}
                              </span>
                            </p>
                          ))
                        )}
                      </div>
                    )}

                    {!isPaid &&
                      (payingId === s.id ? (
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          <div className="flex gap-1.5">
                            <input
                              type="date"
                              value={payDate}
                              max={new Date().toISOString().split("T")[0]}
                              onChange={(e) => setPayDate(e.target.value)}
                              className="bg-background border border-white/10 rounded-control px-2 py-1.5 text-xs"
                            />
                            <input
                              type="number"
                              autoFocus
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              placeholder={`up to ₹${balanceDue.toFixed(2)}`}
                              className="flex-1 bg-background border border-white/10 rounded-control px-2 py-1.5 text-xs"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleRecordPayment(s)}
                              className="flex-1 bg-primary text-background text-xs font-medium py-1.5 rounded-control"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setPayingId(null);
                                setPayAmount("");
                                setPayError("");
                              }}
                              className="text-textSecondary text-xs px-3"
                            >
                              Cancel
                            </button>
                          </div>
                          {payError && (
                            <p className="text-danger text-[10px]">
                              {payError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPayingId(s.id);
                            setPayAmount("");
                            setPayDate(new Date().toISOString().split("T")[0]);
                            setPayError("");
                          }}
                          className="text-primary text-xs font-medium mt-1"
                        >
                          + Record Payment
                        </button>
                      ))}
                  </Card>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UdhaarGiven;
