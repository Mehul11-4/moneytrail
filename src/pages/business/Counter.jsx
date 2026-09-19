import { useState, useMemo } from "react";
import { ShoppingCart, Check, Plus } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import BilledItemsTable from "../../components/BilledItemsTable";
import { useProducts } from "../../hooks/useProducts";
import { useSales } from "../../hooks/useSales";
import { usePersistedState } from "../../hooks/usePersistedState";
import { useParties } from "../../hooks/useParties";
import { Users, Search as SearchIcon, X as XIcon } from "lucide-react";

const paymentTypes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

function Counter() {
  const { products, deductStock } = useProducts();
  const { sales, recordSale, recordMultiSale } = useSales();
  const { parties, addParty } = useParties();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTotal = useMemo(
    () =>
      sales
        .filter((s) => s.date === todayStr)
        .reduce((sum, s) => sum + s.total, 0),
    [sales, todayStr],
  );
  const nextInvoiceNo = useMemo(() => sales.length + 1, [sales]);

  const [items, setItems] = usePersistedState("cbn_cart_items", []);

  const [saleDate, setSaleDate] = usePersistedState(
    "cbn_cart_saleDate",
    todayStr,
  );
  const [selectedPartyId, setSelectedPartyId] = usePersistedState(
    "cbn_cart_partyId",
    "",
  );
  const [showPartyPicker, setShowPartyPicker] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [showNewPartyForm, setShowNewPartyForm] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [newPartyError, setNewPartyError] = useState("");
  const [billingName, setBillingName] = usePersistedState(
    "cbn_cart_billingName",
    "",
  );
  const [isReceived, setIsReceived] = usePersistedState(
    "cbn_cart_isReceived",
    true,
  );
  const [receivedAmount, setReceivedAmount] = usePersistedState(
    "cbn_cart_receivedAmount",
    "",
  );
  const [paymentType, setPaymentType] = usePersistedState(
    "cbn_cart_paymentType",
    "Cash",
  );
  const [description, setDescription] = usePersistedState(
    "cbn_cart_description",
    "",
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validItems = useMemo(
    () =>
      items.filter(
        (r) => r.productId && parseFloat(r.qty) > 0 && parseFloat(r.rate) >= 0,
      ),
    [items],
  );
  const cartTotal = useMemo(
    () => validItems.reduce((sum, r) => sum + r.amount, 0),
    [validItems],
  );

  const finalReceivedAmount = useMemo(() => {
    if (!isReceived) return 0;
    if (receivedAmount.trim() !== "") {
      const r = parseFloat(receivedAmount);
      return isNaN(r) ? 0 : r;
    }
    return cartTotal;
  }, [isReceived, receivedAmount, cartTotal]);

  const balanceDue = useMemo(
    () => Math.max(0, cartTotal - finalReceivedAmount),
    [cartTotal, finalReceivedAmount],
  );

  const resetForm = () => {
    setItems([]);
    setSaleDate(todayStr);
    setSelectedPartyId("");
    setBillingName("");
    setIsReceived(true);
    setReceivedAmount("");
    setPaymentType("Cash");
    setDescription("");
    setError("");
  };

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

  const handleCompleteSale = async () => {
    if (isSubmitting) return;
    setError("");
    if (validItems.length === 0)
      return setError("Add at least one item with quantity and rate.");

    for (const row of validItems) {
      const product = products.find((p) => p.id === row.productId);
      if (
        product &&
        !product.is_static &&
        parseFloat(row.qty) > product.stock_qty
      ) {
        return setError(
          `Only ${product.stock_qty} pcs of ${product.name} in stock.`,
        );
      }
    }

    if (balanceDue > 0 && !selectedParty)
      return setError("Select a Party when there is a balance due.");

    setIsSubmitting(true);
    try {
      const paymentMode = balanceDue > 0 ? "Udhaar" : paymentType;
      const meta = {
        paymentMode,
        customerName: selectedParty?.name || null,
        billingName: selectedParty?.name || null,
        customerPhone: selectedParty?.phone || null,
        receivedAmount: finalReceivedAmount,
        partyId: selectedParty?.id || null,
        saleDate,
      };

      if (validItems.length === 1) {
        const item = validItems[0];
        const product = products.find((p) => p.id === item.productId);
        await recordSale({
          productId: item.productId,
          productName: item.productName,
          qtySold: parseFloat(item.qty),
          pricePerQtyAtSale: product?.price_per_qty || 0,
          mrpAtSale: parseFloat(item.rate),
          total: item.amount,
          ...meta,
        });
        await deductStock(item.productId, parseFloat(item.qty), item.isStatic);
      } else {
        await recordMultiSale(
          validItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              productName: item.productName,
              qtySold: parseFloat(item.qty),
              pricePerQtyAtSale: product?.price_per_qty || 0,
              mrpAtSale: parseFloat(item.rate),
              total: item.amount,
            };
          }),
          meta,
        );
        await Promise.all(
          validItems.map((item) =>
            deductStock(item.productId, parseFloat(item.qty), item.isStatic),
          ),
        );
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong completing this sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-4">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Sale</h1>
      </div>

      <Card className="mb-4 border-primary/30">
        <p className="text-textSecondary text-sm mb-1">Today's Total Sales</p>
        <p className="text-2xl font-heading font-bold text-primary">
          ₹{todayTotal.toFixed(2)}
        </p>
      </Card>

      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-textSecondary">Invoice No.</p>
            <p className="font-medium">{nextInvoiceNo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-textSecondary mb-1">Date</p>
            <Input
              name="saleDate"
              type="date"
              value={saleDate}
              max={todayStr}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Party Details</p>
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
            <span className="text-textSecondary">
              Select Party (optional unless balance due)
            </span>
          )}
        </button>

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
                    placeholder="Customer Name"
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
                      className="w-full bg-background border border-border rounded-control pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {filteredParties.length === 0 && (
                      <p className="text-textSecondary text-sm p-2">
                        No parties found.
                      </p>
                    )}
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
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Billed Items</p>
        <BilledItemsTable
          items={items}
          setItems={setItems}
          products={products}
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
                  checked={isReceived}
                  onChange={(e) => setIsReceived(e.target.checked)}
                  className="w-4 h-4"
                />
                Received
              </label>
              <input
                type="number"
                disabled={!isReceived}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
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
            variant="primary"
            onClick={handleCompleteSale}
            disabled={isSubmitting}
          >
            {success ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Sale Recorded!
              </span>
            ) : isSubmitting ? (
              "Processing..."
            ) : (
              `Complete Sale — ₹${cartTotal.toFixed(2)}`
            )}
          </Button>
        </>
      )}
    </div>
  );
}

export default Counter;
