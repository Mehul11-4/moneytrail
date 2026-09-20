import { useState, useMemo } from "react";
import { Users, Search, X, Phone, Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { usePurchases } from "../../hooks/usePurchases";
import { useParties } from "../../hooks/useParties";
import { formatDate } from "../../utils/formatDate";

function UdhaarGiven() {
  const { sales, loading, recordPartyPayment, getPaymentHistory } = useSales();
  const { purchases, recordPartyPurchasePayment } = usePurchases();
  const {
    parties,
    loading: partiesLoading,
    addParty,
    updateParty,
    deleteParty,
  } = useParties();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewingParty, setViewingParty] = useState(null);
  const [showAddParty, setShowAddParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addPartyError, setAddPartyError] = useState("");
  const [editingParty, setEditingParty] = useState(false);
  const [editPartyName, setEditPartyName] = useState("");
  const [editPartyPhone, setEditPartyPhone] = useState("");
  const [editPartyError, setEditPartyError] = useState("");
  const [confirmDeleteParty, setConfirmDeleteParty] = useState(false);
  const [payingParty, setPayingParty] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payError, setPayError] = useState("");
  const [settlingParty, setSettlingParty] = useState(false);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleDate, setSettleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [settleError, setSettleError] = useState("");
  const [paymentHistories, setPaymentHistories] = useState({});

  const grouped = useMemo(() => {
    return parties
      .map((party) => {
        const partySales = sales.filter(
          (s) => s.partyId === party.id && s.paymentMode === "Udhaar",
        );
        const partyPurchaseRows = purchases.filter(
          (p) => p.partyId === party.id && p.paymentMode === "Credit",
        );
        // Group into transactions (multi-item purchases share a transaction_id)
        const purchaseTxMap = {};
        const purchaseTxOrder = [];
        partyPurchaseRows.forEach((p) => {
          const key = p.transactionId || p.id;
          if (!purchaseTxMap[key]) {
            purchaseTxMap[key] = {
              key,
              items: [],
              total: 0,
              received: 0,
              date: p.date,
              time: p.time,
            };
            purchaseTxOrder.push(key);
          }
          purchaseTxMap[key].items.push(p);
          purchaseTxMap[key].total += p.total;
          purchaseTxMap[key].received += p.receivedAmount || 0;
        });
        const partyPurchases = purchaseTxOrder.map((k) => purchaseTxMap[k]);
        const toReceive = partySales.reduce(
          (sum, s) => sum + Math.max(0, s.total - (s.receivedAmount || 0)),
          0,
        );
        const toPay = partyPurchases.reduce(
          (sum, tx) => sum + Math.max(0, tx.total - tx.received),
          0,
        );
        return {
          ...party,
          sales: partySales,
          purchases: partyPurchases,
          toReceive,
          toPay,
        };
      })
      .filter((g) => g.toReceive > 0 || g.toPay > 0 || true) // keep all parties visible, even zero-balance
      .sort((a, b) => b.toReceive + b.toPay - (a.toReceive + a.toPay));
  }, [parties, sales, purchases]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.trim().toLowerCase();
    return grouped.filter(
      (g) => g.name.toLowerCase().includes(q) || g.phone.includes(q),
    );
  }, [grouped, searchQuery]);

  const totalToReceive = useMemo(
    () => grouped.reduce((s, g) => s + g.toReceive, 0),
    [grouped],
  );
  const totalToPay = useMemo(
    () => grouped.reduce((s, g) => s + g.toPay, 0),
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

  const handleRecordPartyPayment = async () => {
    setPayError("");
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return setPayError("Enter a valid amount.");
    if (amount > viewingPartyLive.toReceive)
      return setPayError(
        `Cannot exceed total owed of ₹${viewingPartyLive.toReceive.toFixed(2)}.`,
      );
    try {
      await recordPartyPayment(viewingPartyLive.id, amount, payDate);
      setPayingParty(false);
      setPayAmount("");
    } catch (err) {
      setPayError(err.message || "Failed to record payment.");
    }
  };

  const handleSettlePartyPurchase = async () => {
    setSettleError("");
    const amount = parseFloat(settleAmount);
    if (!amount || amount <= 0) return setSettleError("Enter a valid amount.");
    if (amount > viewingPartyLive.toPay)
      return setSettleError(
        `Cannot exceed total owed of ₹${viewingPartyLive.toPay.toFixed(2)}.`,
      );
    try {
      await recordPartyPurchasePayment(viewingPartyLive.id, amount, settleDate);
      setSettlingParty(false);
      setSettleAmount("");
    } catch (err) {
      setSettleError(err.message || "Failed to settle payment.");
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
      <p className="text-xs text-textSecondary mb-4">
        Customers &amp; suppliers on Udhaar/Credit
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="border-success/30 bg-success/5">
          <p className="text-textSecondary text-xs mb-1">Total To Receive</p>
          <p className="text-xl font-heading font-bold text-success">
            ₹{totalToReceive.toFixed(2)}
          </p>
        </Card>
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-textSecondary text-xs mb-1">Total To Pay</p>
          <p className="text-xl font-heading font-bold text-danger">
            ₹{totalToPay.toFixed(2)}
          </p>
        </Card>
      </div>

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
              label="Name"
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
        <p className="text-textSecondary text-sm">No parties yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {filteredGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => setViewingParty(group)}
            className="text-left"
          >
            <Card>
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium">{group.name}</p>
              </div>
              <p className="text-xs text-textSecondary flex items-center gap-1 mb-2">
                <Phone className="w-3 h-3" /> {group.phone}
              </p>
              <div className="flex gap-3">
                {group.toReceive > 0 && (
                  <p className="text-xs text-success font-medium">
                    To Receive ₹{group.toReceive.toFixed(2)}
                  </p>
                )}
                {group.toPay > 0 && (
                  <p className="text-xs text-danger font-medium">
                    To Pay ₹{group.toPay.toFixed(2)}
                  </p>
                )}
                {group.toReceive === 0 && group.toPay === 0 && (
                  <p className="text-xs text-textSecondary">Settled</p>
                )}
              </div>
            </Card>
          </button>
        ))}
      </div>

      {viewingPartyLive && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingParty(null);
            setPayingParty(false);
          }}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {editingParty ? (
              <div className="flex flex-col gap-3 mb-4">
                <p className="font-heading font-bold">Edit Party</p>
                <Input
                  label="Name"
                  name="editPartyName"
                  value={editPartyName}
                  onChange={(e) => setEditPartyName(e.target.value)}
                />
                <Input
                  label="Phone"
                  name="editPartyPhone"
                  type="tel"
                  value={editPartyPhone}
                  onChange={(e) =>
                    setEditPartyPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                />
                {editPartyError && (
                  <p className="text-danger text-sm">{editPartyError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setEditPartyError("");
                      if (!editPartyName.trim())
                        return setEditPartyError("Enter a name.");
                      if (!/^\d{10}$/.test(editPartyPhone.trim()))
                        return setEditPartyError(
                          "Enter a valid 10-digit phone number.",
                        );
                      try {
                        await updateParty(
                          viewingPartyLive.id,
                          editPartyName,
                          editPartyPhone,
                        );
                        setEditingParty(false);
                      } catch (err) {
                        setEditPartyError(
                          err.message?.includes("duplicate")
                            ? "This phone number is already used."
                            : "Failed to update.",
                        );
                      }
                    }}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingParty(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-heading font-bold text-lg">
                    {viewingPartyLive.name}
                  </p>
                  <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {viewingPartyLive.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingParty(true);
                      setEditPartyName(viewingPartyLive.name);
                      setEditPartyPhone(viewingPartyLive.phone);
                    }}
                    className="text-textSecondary hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmDeleteParty ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          await deleteParty(viewingPartyLive.id);
                          setViewingParty(null);
                          setConfirmDeleteParty(false);
                        }}
                        className="text-danger text-xs font-medium"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteParty(false)}
                        className="text-textSecondary text-xs"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteParty(true)}
                      className="text-textSecondary hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewingParty(null);
                      setPayingParty(false);
                    }}
                    className="text-textSecondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {!editingParty && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Card className="!p-2.5 border-success/30">
                    <p className="text-[10px] text-textSecondary">To Receive</p>
                    <p className="text-lg font-heading font-bold text-success">
                      ₹{viewingPartyLive.toReceive.toFixed(2)}
                    </p>
                  </Card>
                  <Card className="!p-2.5 border-danger/30">
                    <p className="text-[10px] text-textSecondary">To Pay</p>
                    <p className="text-lg font-heading font-bold text-danger">
                      ₹{viewingPartyLive.toPay.toFixed(2)}
                    </p>
                  </Card>
                </div>

                {viewingPartyLive.toReceive > 0 && (
                  <Card className="mb-3">
                    {payingParty ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">
                          Record Payment (clears oldest items first)
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="date"
                            value={payDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setPayDate(e.target.value)}
                            className="bg-background border border-border rounded-control px-2 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            autoFocus
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            placeholder={`up to ₹${viewingPartyLive.toReceive.toFixed(2)}`}
                            className="flex-1 bg-background border border-border rounded-control px-2 py-1.5 text-xs"
                          />
                        </div>
                        {payError && (
                          <p className="text-danger text-xs">{payError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={handleRecordPartyPayment}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setPayingParty(false);
                              setPayAmount("");
                              setPayError("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setPayingParty(true);
                          setPayAmount("");
                          setPayDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Record Payment
                      </Button>
                    )}
                  </Card>
                )}

                {viewingPartyLive.toPay > 0 && (
                  <Card className="mb-3">
                    {settlingParty ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">
                          Settle Payment (clears oldest items first)
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="date"
                            value={settleDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setSettleDate(e.target.value)}
                            className="bg-background border border-border rounded-control px-2 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            autoFocus
                            value={settleAmount}
                            onChange={(e) => setSettleAmount(e.target.value)}
                            placeholder={`up to ₹${viewingPartyLive.toPay.toFixed(2)}`}
                            className="flex-1 bg-background border border-border rounded-control px-2 py-1.5 text-xs"
                          />
                        </div>
                        {settleError && (
                          <p className="text-danger text-xs">{settleError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            onClick={handleSettlePartyPurchase}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSettlingParty(false);
                              setSettleAmount("");
                              setSettleError("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setSettlingParty(true);
                          setSettleAmount("");
                          setSettleDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Settle Payment
                      </Button>
                    )}
                  </Card>
                )}

                {viewingPartyLive.sales.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-textSecondary mb-2">
                      Udhaar Sale History (items you sold)
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
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
                            <div className="flex justify-between items-center text-[10px]">
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
                                {isPaid
                                  ? "Paid"
                                  : `Bakaya ₹${balanceDue.toFixed(2)}`}
                              </span>
                            </div>
                            {(s.receivedAmount || 0) > 0 && (
                              <button
                                onClick={() => toggleHistory(s.id)}
                                className="text-[10px] text-textSecondary underline mt-1"
                              >
                                {paymentHistories[s.id]
                                  ? "Hide payment history"
                                  : "View payment history"}
                              </button>
                            )}
                            {paymentHistories[s.id] && (
                              <div className="flex flex-col gap-1 mt-1.5 pl-2 border-l border-white/10">
                                {paymentHistories[s.id].map((p) => (
                                  <p
                                    key={p.id}
                                    className="text-[10px] text-textSecondary"
                                  >
                                    {formatDate(p.payment_date)} —{" "}
                                    <span className="text-success">
                                      ₹{p.amount.toFixed(2)}
                                    </span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {viewingPartyLive.purchases.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-textSecondary mb-2">
                      Udhaar Purchase History (items you bought)
                    </p>
                    <div className="flex flex-col gap-2">
                      {viewingPartyLive.purchases.map((tx) => {
                        const balanceDue = Math.max(0, tx.total - tx.received);
                        const isPaid = balanceDue <= 0;
                        return (
                          <Card key={tx.key} className="!p-2.5">
                            <p className="text-xs text-textSecondary mb-1.5">
                              {formatDate(tx.date)} · {tx.time}
                            </p>
                            <div className="rounded-control border border-border overflow-hidden mb-1.5">
                              <div className="grid grid-cols-12 bg-background/40 border-b border-border px-2 py-1 text-[9px] font-medium text-textSecondary">
                                <div className="col-span-5">Item</div>
                                <div className="col-span-2 text-right">Qty</div>
                                <div className="col-span-2 text-right">
                                  Rate
                                </div>
                                <div className="col-span-3 text-right">
                                  Amount
                                </div>
                              </div>
                              {tx.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="grid grid-cols-12 px-2 py-1 text-xs border-b border-border last:border-b-0"
                                >
                                  <div className="col-span-5 truncate">
                                    {item.productName}
                                  </div>
                                  <div className="col-span-2 text-right">
                                    {item.qty}
                                  </div>
                                  <div className="col-span-2 text-right">
                                    ₹{item.rate.toFixed(2)}
                                  </div>
                                  <div className="col-span-3 text-right font-medium">
                                    ₹{item.total.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-success font-medium">
                                Paid ₹{tx.received.toFixed(2)}
                              </span>
                              <span
                                className={
                                  isPaid
                                    ? "text-success font-medium"
                                    : "text-danger font-medium"
                                }
                              >
                                {isPaid
                                  ? "Paid"
                                  : `Due ₹${balanceDue.toFixed(2)}`}
                              </span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}

                {viewingPartyLive.sales.length === 0 &&
                  viewingPartyLive.purchases.length === 0 && (
                    <p className="text-textSecondary text-xs">
                      No Udhaar/Credit history yet for this party.
                    </p>
                  )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default UdhaarGiven;
