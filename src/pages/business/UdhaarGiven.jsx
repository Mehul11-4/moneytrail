import { useState, useMemo } from "react";
import { Users, Search, X, Phone, Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { useParties } from "../../hooks/useParties";
import { formatDate } from "../../utils/formatDate";

function UdhaarGiven() {
  const {
    sales = [],
    loading = false,
    recordPayment,
    getPaymentHistory,
  } = useSales();

  const {
    parties = [],
    loading: partiesLoading = false,
    addParty,
    updateParty,
    deleteParty,
  } = useParties();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewingParty, setViewingParty] = useState(null);

  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(getTodayLocalDate());
  const [payError, setPayError] = useState("");

  const [paymentHistories, setPaymentHistories] = useState({});

  const [showAddParty, setShowAddParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addPartyError, setAddPartyError] = useState("");

  const [editingParty, setEditingParty] = useState(false);
  const [editPartyName, setEditPartyName] = useState("");
  const [editPartyPhone, setEditPartyPhone] = useState("");
  const [editPartyError, setEditPartyError] = useState("");

  const [confirmDeleteParty, setConfirmDeleteParty] = useState(false);

  /*
   * Get today's date using LOCAL time instead of UTC.
   *
   * Using:
   * new Date().toISOString().split("T")[0]
   *
   * can produce the previous date around midnight in India
   * because toISOString() converts the date to UTC.
   */
  function getTodayLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /*
   * Group every permanent party with its Udhaar sales
   * and calculate the current outstanding balance.
   */
  const grouped = useMemo(() => {
    if (!Array.isArray(parties)) return [];

    const safeSales = Array.isArray(sales) ? sales : [];

    return parties
      .map((party) => {
        const partySales = safeSales.filter(
          (sale) =>
            sale?.partyId === party?.id && sale?.paymentMode === "Udhaar",
        );

        const totalOwed = partySales.reduce((sum, sale) => {
          const total = Number(sale?.total) || 0;
          const received = Number(sale?.receivedAmount) || 0;

          return sum + Math.max(0, total - received);
        }, 0);

        return {
          ...party,
          sales: partySales,
          totalOwed,
        };
      })
      .sort((a, b) => b.totalOwed - a.totalOwed);
  }, [parties, sales]);

  /*
   * Search parties by name or phone.
   */
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return grouped;

    return grouped.filter((group) => {
      const name = String(group?.name || "").toLowerCase();
      const phone = String(group?.phone || "");

      return name.includes(query) || phone.includes(query);
    });
  }, [grouped, searchQuery]);

  /*
   * Total outstanding amount across all parties.
   */
  const totalAllOwed = useMemo(() => {
    return grouped.reduce(
      (sum, group) => sum + (Number(group?.totalOwed) || 0),
      0,
    );
  }, [grouped]);

  /*
   * Always get the latest party data from grouped.
   *
   * This is important because the selected party can change
   * after a payment is recorded.
   */
  const viewingPartyLive = useMemo(() => {
    if (!viewingParty?.id) return null;

    return grouped.find((group) => group.id === viewingParty.id) || null;
  }, [viewingParty, grouped]);

  /*
   * Add a new party.
   */
  const handleAddParty = async (e) => {
    e.preventDefault();

    setAddPartyError("");

    const name = newPartyName.trim();
    const phone = newPartyPhone.trim();

    if (!name) {
      setAddPartyError("Enter a name.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setAddPartyError("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      await addParty(name, phone);

      setNewPartyName("");
      setNewPartyPhone("");
      setShowAddParty(false);
      setAddPartyError("");
    } catch (err) {
      console.error("Failed to add party:", err);

      const message = String(err?.message || "").toLowerCase();

      setAddPartyError(
        message.includes("duplicate") || message.includes("unique")
          ? "This phone number is already registered to another party."
          : err?.message || "Failed to add party.",
      );
    }
  };

  /*
   * Record a payment against a specific Udhaar sale.
   */
  const handleRecordPayment = async (sale) => {
    setPayError("");

    if (!sale?.id) {
      setPayError("Invalid sale.");
      return;
    }

    const amount = Number(payAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError("Enter a valid amount.");
      return;
    }

    const saleTotal = Number(sale.total) || 0;
    const receivedAmount = Number(sale.receivedAmount) || 0;

    const balanceDue = Math.max(0, saleTotal - receivedAmount);

    if (amount > balanceDue) {
      setPayError(`Cannot exceed balance due of ₹${balanceDue.toFixed(2)}.`);
      return;
    }

    if (!payDate) {
      setPayError("Select a payment date.");
      return;
    }

    try {
      await recordPayment(sale.id, amount, payDate);

      setPayingId(null);
      setPayAmount("");
      setPayError("");

      /*
       * Reload payment history after successful payment.
       */
      await loadHistoryFor(sale.id);
    } catch (err) {
      console.error("Failed to record payment:", err);

      setPayError(err?.message || "Failed to record payment.");
    }
  };

  /*
   * Load payment history for a sale.
   */
  const loadHistoryFor = async (saleId) => {
    if (!saleId) return;

    try {
      const history = await getPaymentHistory(saleId);

      setPaymentHistories((prev) => ({
        ...prev,
        [saleId]: Array.isArray(history) ? history : [],
      }));
    } catch (err) {
      console.error("Failed to load payment history:", err);

      setPaymentHistories((prev) => ({
        ...prev,
        [saleId]: [],
      }));
    }
  };

  /*
   * Show/hide payment history.
   */
  const toggleHistory = async (saleId) => {
    if (!saleId) return;

    if (paymentHistories[saleId]) {
      setPaymentHistories((prev) => {
        const next = { ...prev };
        delete next[saleId];
        return next;
      });
    } else {
      await loadHistoryFor(saleId);
    }
  };

  /*
   * Open a party.
   */
  const handleOpenParty = (party) => {
    setViewingParty(party);

    setEditingParty(false);
    setConfirmDeleteParty(false);

    setPayingId(null);
    setPayAmount("");
    setPayError("");
    setEditPartyError("");
  };

  /*
   * Close party modal.
   */
  const handleCloseParty = () => {
    setViewingParty(null);

    setEditingParty(false);
    setConfirmDeleteParty(false);

    setPayingId(null);
    setPayAmount("");
    setPayError("");
    setEditPartyError("");
  };

  /*
   * Start editing the current party.
   */
  const handleStartEditing = () => {
    if (!viewingPartyLive) return;

    setEditingParty(true);
    setEditPartyName(String(viewingPartyLive.name || ""));
    setEditPartyPhone(String(viewingPartyLive.phone || ""));
    setEditPartyError("");
    setConfirmDeleteParty(false);
  };

  /*
   * Update party details.
   */
  const handleUpdateParty = async () => {
    setEditPartyError("");

    const name = editPartyName.trim();
    const phone = editPartyPhone.trim();

    if (!name) {
      setEditPartyError("Enter a name.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setEditPartyError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!viewingPartyLive?.id) {
      setEditPartyError("Invalid party.");
      return;
    }

    try {
      await updateParty(viewingPartyLive.id, name, phone);

      setEditingParty(false);
      setEditPartyError("");
    } catch (err) {
      console.error("Failed to update party:", err);

      const message = String(err?.message || "").toLowerCase();

      setEditPartyError(
        message.includes("duplicate") || message.includes("unique")
          ? "This phone number is already used by another party."
          : err?.message || "Failed to update.",
      );
    }
  };

  /*
   * Delete the current party.
   */
  const handleDeleteParty = async () => {
    if (!viewingPartyLive?.id) return;

    try {
      await deleteParty(viewingPartyLive.id);

      handleCloseParty();
    } catch (err) {
      console.error("Failed to delete party:", err);

      setEditPartyError(err?.message || "Failed to delete party.");

      setConfirmDeleteParty(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      {/* PAGE HEADER */}
      <div className="flex items-center gap-3 mt-6 mb-1">
        <Users className="w-7 h-7 text-parties" />

        <h1 className="text-2xl font-heading font-bold">Parties</h1>
      </div>

      <p className="text-xs text-textSecondary mb-4">Your customer accounts</p>

      {/* TOTAL OWED */}
      <Card className="mb-4 border-parties/40">
        <p className="text-textSecondary text-sm mb-1">
          Total Owed (All Customers)
        </p>

        <p className="text-2xl font-heading font-bold text-parties">
          ₹{totalAllOwed.toFixed(2)}
        </p>
      </Card>

      {/* ADD PARTY BUTTON */}
      <Button
        variant="accent"
        onClick={() => {
          setShowAddParty((prev) => !prev);
          setAddPartyError("");
        }}
        className="w-full flex items-center justify-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" />
        Add New Party
      </Button>

      {/* ADD PARTY FORM */}
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
                onClick={() => {
                  setShowAddParty(false);
                  setAddPartyError("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SEARCH */}
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

      {/* LOADING */}
      {(loading || partiesLoading) && (
        <p className="text-textSecondary text-sm">Loading...</p>
      )}

      {/* EMPTY STATE */}
      {!loading && !partiesLoading && filteredGroups.length === 0 && (
        <p className="text-textSecondary text-sm">
          {searchQuery.trim()
            ? "No parties found."
            : "No parties yet. Add one above, or it'll be created automatically on your first Udhaar sale."}
        </p>
      )}

      {/* PARTY LIST */}
      <div className="flex flex-col gap-2">
        {filteredGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => handleOpenParty(group)}
            className="text-left w-full"
          >
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{group.name}</p>

                  <p className="text-xs text-textSecondary flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {group.phone || "No phone"}
                  </p>
                </div>

                <p
                  className={`font-heading font-bold ${
                    group.totalOwed > 0 ? "text-parties" : "text-success"
                  }`}
                >
                  ₹{Number(group.totalOwed || 0).toFixed(2)}
                </p>
              </div>

              <p className="text-xs text-textSecondary mt-1">
                {group.sales.length} transaction
                {group.sales.length !== 1 ? "s" : ""}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {/* PARTY MODAL */}
      {viewingPartyLive && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={handleCloseParty}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* EDIT PARTY */}
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
                    type="button"
                    variant="primary"
                    onClick={handleUpdateParty}
                    className="flex-1"
                  >
                    Save
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingParty(false);
                      setEditPartyError("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* PARTY HEADER */
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-heading font-bold text-lg">
                    {viewingPartyLive.name}
                  </p>

                  <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {viewingPartyLive.phone || "No phone"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* EDIT */}
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="text-textSecondary hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* DELETE */}
                  {confirmDeleteParty ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleDeleteParty}
                        className="text-danger text-xs font-medium"
                      >
                        Yes
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteParty(false)}
                        className="text-textSecondary text-xs"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteParty(true);
                        setEditPartyError("");
                      }}
                      className="text-textSecondary hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* CLOSE */}
                  <button
                    type="button"
                    onClick={handleCloseParty}
                    className="text-textSecondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* PARTY DETAILS */}
            {!editingParty && (
              <>
                {/* TOTAL OWED */}
                <Card className="mb-3 border-parties/30">
                  <p className="text-xs text-textSecondary">Total Owed</p>

                  <p className="text-xl font-heading font-bold text-parties">
                    ₹{Number(viewingPartyLive.totalOwed || 0).toFixed(2)}
                  </p>
                </Card>

                {/* PURCHASE HISTORY */}
                <p className="text-xs font-medium text-textSecondary mb-2">
                  Purchase History
                </p>

                {viewingPartyLive.sales.length === 0 && (
                  <p className="text-textSecondary text-xs">
                    No Udhaar purchases yet for this party.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {viewingPartyLive.sales.map((sale) => {
                    const saleTotal = Number(sale?.total) || 0;

                    const receivedAmount = Number(sale?.receivedAmount) || 0;

                    const balanceDue = Math.max(0, saleTotal - receivedAmount);

                    const isPaid = balanceDue <= 0;

                    return (
                      <Card key={sale.id} className="!p-2.5">
                        {/* SALE HEADER */}
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="text-sm font-medium">
                              {sale.productName || "Unknown Product"} ×{" "}
                              {sale.qtySold ?? 0}
                            </p>

                            <p className="text-xs text-textSecondary">
                              {formatDate(sale.date)} · {sale.time || ""}
                            </p>
                          </div>

                          <p className="font-heading font-bold text-sm">
                            ₹{saleTotal.toFixed(2)}
                          </p>
                        </div>

                        {/* PAYMENT SUMMARY */}
                        <div className="flex justify-between items-center text-[10px] mb-1.5">
                          <span className="text-success font-medium">
                            Jama ₹{receivedAmount.toFixed(2)}
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

                        {/* PAYMENT HISTORY BUTTON */}
                        {receivedAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleHistory(sale.id)}
                            className="text-[10px] text-textSecondary underline mb-1.5"
                          >
                            {paymentHistories[sale.id]
                              ? "Hide payment history"
                              : "View payment history"}
                          </button>
                        )}

                        {/* PAYMENT HISTORY */}
                        {paymentHistories[sale.id] && (
                          <div className="flex flex-col gap-1 mb-1.5 pl-2 border-l border-white/10">
                            {paymentHistories[sale.id].length === 0 ? (
                              <p className="text-[10px] text-textSecondary/70">
                                No individual payments logged.
                              </p>
                            ) : (
                              paymentHistories[sale.id].map((payment) => {
                                const paymentAmount =
                                  Number(payment?.amount) || 0;

                                return (
                                  <p
                                    key={payment.id}
                                    className="text-[10px] text-textSecondary"
                                  >
                                    {formatDate(payment.payment_date)} —{" "}
                                    <span className="text-success">
                                      ₹{paymentAmount.toFixed(2)}
                                    </span>
                                  </p>
                                );
                              })
                            )}
                          </div>
                        )}

                        {/* RECORD PAYMENT */}
                        {!isPaid &&
                          (payingId === sale.id ? (
                            <div className="flex flex-col gap-1.5 mt-1.5">
                              <div className="flex gap-1.5">
                                <input
                                  type="date"
                                  value={payDate}
                                  max={getTodayLocalDate()}
                                  onChange={(e) => setPayDate(e.target.value)}
                                  className="bg-background border border-white/10 rounded-control px-2 py-1.5 text-xs"
                                />

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  autoFocus
                                  value={payAmount}
                                  onChange={(e) => setPayAmount(e.target.value)}
                                  placeholder={`up to ₹${balanceDue.toFixed(
                                    2,
                                  )}`}
                                  className="flex-1 bg-background border border-white/10 rounded-control px-2 py-1.5 text-xs"
                                />
                              </div>

                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRecordPayment(sale)}
                                  className="flex-1 bg-primary text-background text-xs font-medium py-1.5 rounded-control"
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
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
                              type="button"
                              onClick={() => {
                                setPayingId(sale.id);
                                setPayAmount("");
                                setPayDate(getTodayLocalDate());
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
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default UdhaarGiven;
