import { useState, useMemo } from "react";
import { ShoppingBag, Check, Plus } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import BilledItemsTable from "../../components/BilledItemsTable";
import { useProducts } from "../../hooks/useProducts";
import { usePurchases } from "../../hooks/usePurchases";
import { useProductTypes } from "../../hooks/useProductTypes";
import { usePersistedState } from "../../hooks/usePersistedState";
import { useParties } from "../../hooks/useParties";
import { Users, Search as SearchIcon, X as XIcon } from "lucide-react";

const paymentTypes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

function Purchase() {
  const { products } = useProducts();
  const { purchases, recordPurchase, recordMultiPurchase } = usePurchases();
  const { parties, addParty } = useParties();

  const todayStr = new Date().toISOString().split("T")[0];
  const nextInvoiceNo = useMemo(() => purchases.length + 1, [purchases]);

  const [items, setItems] = usePersistedState("cbn_purchase_items", []);
  const [purchaseDate, setPurchaseDate] = usePersistedState(
    "cbn_purchase_date",
    todayStr,
  );
  const [selectedPartyId, setSelectedPartyId] = usePersistedState(
    "cbn_purchase_partyId",
    "",
  );
  const [showPartyPicker, setShowPartyPicker] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [showNewPartyForm, setShowNewPartyForm] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [newPartyError, setNewPartyError] = useState("");

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId),
    [parties, selectedPartyId],
  );
  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return parties;
    const q = partySearch.trim().toLowerCase();
    return parties.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
    );
  }, [parties, partySearch]);

  const handleCreateParty = async () => {
    setNewPartyError("");
    if (!newPartyName.trim()) return setNewPartyError("Enter a name.");
    if (!/^\d{10}$/.test(newPartyPhone.trim()))
      return setNewPartyError("Enter a valid 10-digit phone number.");
    try {
      const created = await addParty(newPartyName, newPartyPhone);
      setSelectedPartyId(created.id);
      setNewPartyName("");
      setNewPartyPhone("");
      setShowNewPartyForm(false);
      setShowPartyPicker(false);
    } catch (err) {
      setNewPartyError(
        err.message?.includes("duplicate")
          ? "This phone number is already registered."
          : "Failed to add party.",
      );
    }
  };
  const [billingName, setBillingName] = usePersistedState(
    "cbn_purchase_billingName",
    "",
  );
  const [isPaid, setIsPaid] = usePersistedState("cbn_purchase_isPaid", true);
  const [paidAmount, setPaidAmount] = usePersistedState(
    "cbn_purchase_paidAmount",
    "",
  );
  const [paymentType, setPaymentType] = usePersistedState(
    "cbn_purchase_paymentType",
    "Cash",
  );
  const [description, setDescription] = usePersistedState(
    "cbn_purchase_description",
    "",
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validItems = useMemo(
    () =>
      items.filter(
        (r) =>
          (r.productId || r.isNewProduct) &&
          parseFloat(r.qty) > 0 &&
          parseFloat(r.rate) >= 0,
      ),
    [items],
  );
  const cartTotal = useMemo(
    () => validItems.reduce((sum, r) => sum + r.amount, 0),
    [validItems],
  );

  const finalPaidAmount = useMemo(() => {
    if (!isPaid) return 0;
    if (paidAmount.trim() !== "") {
      const p = parseFloat(paidAmount);
      return isNaN(p) ? 0 : p;
    }
    return cartTotal;
  }, [isPaid, paidAmount, cartTotal]);

  const balanceDue = useMemo(
    () => Math.max(0, cartTotal - finalPaidAmount),
    [cartTotal, finalPaidAmount],
  );

  const resetForm = () => {
    setItems([]);
    setSelectedPartyId("");
    setPaymentMode("Cash");
    setPurchaseDate(todayStr);
    setError("");
  };

  const handleCompletePurchase = async () => {
    if (isSubmitting) return;
    setError("");
    if (validItems.length === 0)
      return setError("Add at least one item with quantity and rate.");
    if (balanceDue > 0 && !selectedParty)
      return setError("Select a Party when there is a balance due.");

    setIsSubmitting(true);
    try {
      const paymentMode = balanceDue > 0 ? "Credit" : paymentType;
      const meta = {
        partyName: selectedParty?.name || null,
        partyPhone: selectedParty?.phone || null,
        partyId: selectedParty?.id || null,
        paymentMode,
        purchaseDate,
      };

      const itemPayloads = validItems.map((row) => ({
        productId: row.productId,
        isNewProduct: !!row.isNewProduct,
        newProductDetails: row.newProductDetails,
        qty: parseFloat(row.qty), // pieces — used ONLY for stock adjustment
        units: !row.isNewProduct ? parseFloat(row.units) || null : null, // for display
        rate: parseFloat(row.rate), // per-unit price
        unitRate: !row.isNewProduct ? parseFloat(row.rate) : null,
        total: row.amount, // the ALREADY-CORRECT amount shown on screen — never recalculated
      }));

      if (itemPayloads.length === 1) {
        await recordPurchase(itemPayloads[0], meta);
      } else {
        await recordMultiPurchase(itemPayloads, meta);
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong completing this purchase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-4">
        <ShoppingBag className="w-7 h-7 text-danger" />
        <h1 className="text-2xl font-heading font-bold">Purchase</h1>
      </div>

      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-textSecondary">Bill No.</p>
            <p className="font-medium">{nextInvoiceNo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-textSecondary mb-1">Date</p>
            <Input
              name="purchaseDate"
              type="date"
              value={purchaseDate}
              max={todayStr}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Party Details</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecondary font-medium">
              Party (optional)
            </label>
            <button
              type="button"
              onClick={() => setShowPartyPicker(true)}
              className="w-full bg-surface border border-border rounded-control px-3 py-2.5 text-left text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-parties" />
              {selectedParty ? (
                <span>
                  {selectedParty.name} · {selectedParty.phone}
                </span>
              ) : (
                <span className="text-textSecondary">Select Party</span>
              )}
            </button>
          </div>

          {showPartyPicker && (
            <div
              className="fixed inset-0 bg-black/70 z-[90] flex items-end"
              onClick={() => {
                setShowPartyPicker(false);
                setShowNewPartyForm(false);
              }}
            >
              <div
                className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 max-h-[75vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="font-heading font-bold">
                    {showNewPartyForm ? "New Party" : "Select Party"}
                  </p>
                  <button
                    onClick={() => {
                      setShowPartyPicker(false);
                      setShowNewPartyForm(false);
                    }}
                    className="text-textSecondary"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
                {showNewPartyForm ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      placeholder="Name"
                      className="bg-background border border-border rounded-control px-3 py-2.5 text-sm"
                    />
                    <input
                      type="tel"
                      value={newPartyPhone}
                      onChange={(e) =>
                        setNewPartyPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="Phone Number"
                      className="bg-background border border-border rounded-control px-3 py-2.5 text-sm"
                    />
                    {newPartyError && (
                      <p className="text-danger text-xs">{newPartyError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateParty}
                      className="bg-parties text-white rounded-control py-2.5 text-sm font-medium"
                    >
                      Save Party
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowNewPartyForm(true)}
                      className="w-full flex items-center gap-2 mb-3 px-3 py-2.5 rounded-control border border-dashed border-parties/40 text-parties text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> New Party
                    </button>
                    <div className="relative mb-3">
                      <SearchIcon className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        placeholder="Search parties..."
                        className="w-full bg-background border border-border rounded-control pl-9 pr-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredParties.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPartyId(p.id);
                            setShowPartyPicker(false);
                            setPartySearch("");
                          }}
                          className="w-full text-left px-3 py-3 text-sm hover:bg-white/5 border-b border-white/5 last:border-b-0"
                        >
                          {p.name} · {p.phone}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Billed Items</p>
        <BilledItemsTable
          items={items}
          setItems={setItems}
          products={products}
          unitMode
        />
      </Card>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      {validItems.length > 0 && (
        <>
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm">Total Amount</p>
              <p className="font-heading font-bold text-lg">
                ₹{cartTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4"
                />
                Paid
              </label>
              <input
                type="number"
                disabled={!isPaid}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={cartTotal.toFixed(2)}
                className="w-28 text-right bg-surface border border-white/10 rounded-control px-2 py-1.5 text-sm disabled:opacity-40"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <p className="text-sm font-medium">Balance Due</p>
              <p
                className={`font-heading font-bold ${balanceDue > 0 ? "text-danger" : "text-success"}`}
              >
                ₹{balanceDue.toFixed(2)}
              </p>
            </div>
          </Card>

          <Card className="mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-textSecondary font-medium">
                  Payment Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-sm"
                >
                  {paymentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Description (optional)"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add note"
              />
            </div>
          </Card>

          <Button
            variant="accent"
            onClick={handleCompletePurchase}
            disabled={isSubmitting}
          >
            {success ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Purchase Recorded!
              </span>
            ) : isSubmitting ? (
              "Processing..."
            ) : (
              `Complete Purchase — ₹${cartTotal.toFixed(2)}`
            )}
          </Button>
        </>
      )}
    </div>
  );
}

export default Purchase;
