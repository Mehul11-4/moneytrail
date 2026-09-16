import { useState, useMemo } from "react";
import { ShoppingBag, Check } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import BilledItemsTable from "../../components/BilledItemsTable";
import { useProducts } from "../../hooks/useProducts";
import { usePurchases } from "../../hooks/usePurchases";
import { useProductTypes } from "../../hooks/useProductTypes";
import { usePersistedState } from "../../hooks/usePersistedState";

const paymentTypes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

function Purchase() {
  const { products } = useProducts();
  const { productTypes } = useProductTypes();
  const { purchases, recordPurchase, recordMultiPurchase } = usePurchases();

  const todayStr = new Date().toISOString().split("T")[0];
  const nextInvoiceNo = useMemo(() => purchases.length + 1, [purchases]);

  const [items, setItems] = usePersistedState("cbn_purchase_items", []);
  const [purchaseDate, setPurchaseDate] = usePersistedState(
    "cbn_purchase_date",
    todayStr,
  );
  const [partyName, setPartyName] = usePersistedState(
    "cbn_purchase_partyName",
    "",
  );
  const [billingName, setBillingName] = usePersistedState(
    "cbn_purchase_billingName",
    "",
  );
  const [partyPhone, setPartyPhone] = usePersistedState(
    "cbn_purchase_partyPhone",
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
    setPurchaseDate(todayStr);
    setPartyName("");
    setBillingName("");
    setPartyPhone("");
    setIsPaid(true);
    setPaidAmount("");
    setPaymentType("Cash");
    setDescription("");
    setError("");
  };

  const handleCompletePurchase = async () => {
    if (isSubmitting) return;
    setError("");
    if (validItems.length === 0)
      return setError("Add at least one item with quantity and rate.");
    if (balanceDue > 0 && !partyName.trim())
      return setError("Party Name is required when there is a balance due.");

    setIsSubmitting(true);
    try {
      const paymentMode = balanceDue > 0 ? "Credit" : paymentType;
      const meta = {
        partyName: partyName.trim() || null,
        billingName: billingName.trim() || partyName.trim() || null,
        partyPhone: partyPhone.trim() || null,
        paidAmount: finalPaidAmount,
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
          <Input
            label="Party Name (Optional unless balance due)"
            name="partyName"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="e.g. Mahalaxmi Kirana"
          />
          <Input
            label="Billing Name (Optional)"
            name="billingName"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            placeholder="Defaults to Party Name"
          />
          <Input
            label="Phone Number"
            name="partyPhone"
            type="tel"
            value={partyPhone}
            onChange={(e) =>
              setPartyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="e.g. 9876543210"
          />
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Billed Items</p>
        <BilledItemsTable
          items={items}
          setItems={setItems}
          products={products}
          allowNewProduct
          productTypes={productTypes}
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
