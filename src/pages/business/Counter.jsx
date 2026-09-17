import { useState, useMemo } from "react";
import { ShoppingCart, Check } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import BilledItemsTable from "../../components/BilledItemsTable";
import { useProducts } from "../../hooks/useProducts";
import { useSales } from "../../hooks/useSales";
import { usePersistedState } from "../../hooks/usePersistedState";

const paymentTypes = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

function Counter() {
  const { products, deductStock } = useProducts();
  const { sales, recordSale, recordMultiSale } = useSales();

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
  const [customerName, setCustomerName] = usePersistedState(
    "cbn_cart_customerName",
    "",
  );
  const [billingName, setBillingName] = usePersistedState(
    "cbn_cart_billingName",
    "",
  );
  const [customerPhone, setCustomerPhone] = usePersistedState(
    "cbn_cart_customerPhone",
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
    setCustomerName("");
    setBillingName("");
    setCustomerPhone("");
    setIsReceived(true);
    setReceivedAmount("");
    setPaymentType("Cash");
    setDescription("");
    setError("");
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

    if (balanceDue > 0 && !customerName.trim())
      return setError("Party Name is required when there is a balance due.");
    if (balanceDue > 0 && !customerPhone.trim())
      return setError("Phone number is required when there is a balance due.");

    setIsSubmitting(true);
    try {
      const paymentMode = balanceDue > 0 ? "Udhaar" : paymentType;
      const meta = {
        paymentMode,
        customerName: customerName.trim() || null,
        billingName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        receivedAmount: finalReceivedAmount,
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
        <div className="flex flex-col gap-3">
          <Input
            label="Customer Name (Optional unless balance due)"
            name="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Dipak Ji Jain"
          />
          <Input
            label="Phone Number"
            name="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) =>
              setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
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
