import { useState, useMemo } from "react";
import { ShoppingCart, Check, Search, Plus, X } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
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

  // ---- Cart / item entry ----
  const [cart, setCart] = usePersistedState("cbn_cart", []);
  const [productId, setProductId] = usePersistedState("cbn_cart_productId", "");
  const [qty, setQty] = usePersistedState("cbn_cart_qty", "");
  const [itemCustomTotal, setItemCustomTotal] = usePersistedState(
    "cbn_cart_itemCustomTotal",
    "",
  );
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  // ---- Voucher-level fields (matches reference format) ----
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

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.section.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const itemCalculatedTotal = useMemo(() => {
    const q = parseFloat(qty);
    if (!selectedProduct || !q || q <= 0) return 0;
    return q * selectedProduct.mrp_per_qty;
  }, [selectedProduct, qty]);

  const itemFinalTotal = useMemo(() => {
    if (itemCustomTotal.trim() !== "") {
      const c = parseFloat(itemCustomTotal);
      return isNaN(c) ? 0 : c;
    }
    return itemCalculatedTotal;
  }, [itemCustomTotal, itemCalculatedTotal]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.total, 0),
    [cart],
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

  const addToCart = () => {
    setError("");
    const q = parseFloat(qty);
    if (!selectedProduct) return setError("Select a product.");
    if (!q || q <= 0) return setError("Enter a valid quantity.");
    if (!selectedProduct.is_static && q > selectedProduct.stock_qty) {
      return setError(
        `Only ${selectedProduct.stock_qty} pcs in stock — cannot sell ${q}.`,
      );
    }
    setCart((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: q,
        rate: itemFinalTotal / q,
        mrpPerQty: selectedProduct.mrp_per_qty,
        pricePerQty: selectedProduct.price_per_qty,
        isStatic: selectedProduct.is_static,
        total: itemFinalTotal,
      },
    ]);
    setProductId("");
    setQty("");
    setItemCustomTotal("");
    setProductSearch("");
  };

  const removeFromCart = (i) =>
    setCart((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setCart([]);
    setProductId("");
    setQty("");
    setItemCustomTotal("");
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
    if (cart.length === 0)
      return setError("Add at least one item to the cart.");
    if (balanceDue > 0 && !customerName.trim()) {
      return setError("Party Name is required when there is a balance due.");
    }
    if (balanceDue > 0 && !customerPhone.trim()) {
      return setError("Phone number is required when there is a balance due.");
    }

    setIsSubmitting(true);
    try {
      const paymentMode = balanceDue > 0 ? "Udhaar" : paymentType;
      const meta = {
        paymentMode,
        customerName: customerName.trim() || null,
        billingName: billingName.trim() || customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        receivedAmount: finalReceivedAmount,
        saleDate,
      };

      if (cart.length === 1) {
        const item = cart[0];
        await recordSale({
          productId: item.productId,
          productName: item.productName,
          qtySold: item.qty,
          pricePerQtyAtSale: item.pricePerQty,
          mrpAtSale: item.mrpPerQty,
          total: item.total,
          ...meta,
        });
        await deductStock(item.productId, item.qty, item.isStatic);
      } else {
        await recordMultiSale(
          cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            qtySold: item.qty,
            pricePerQtyAtSale: item.pricePerQty,
            mrpAtSale: item.mrpPerQty,
            total: item.total,
          })),
          meta,
        );
        await Promise.all(
          cart.map((item) =>
            deductStock(item.productId, item.qty, item.isStatic),
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

      {/* Invoice No + Date */}
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-textSecondary">Invoice No.</p>
            <p className="font-medium">{nextInvoiceNo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-textSecondary">Date</p>
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

      {/* Party details */}
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
            label="Billing Name (Optional)"
            name="billingName"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            placeholder="Defaults to Customer Name"
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

      {/* Add item */}
      <Card className="mb-4">
        <p className="text-sm font-medium mb-3">Add Item</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-textSecondary font-medium">
              Product
            </label>
            <button
              type="button"
              onClick={() => setShowProductList(!showProductList)}
              className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-left text-sm"
            >
              {selectedProduct ? (
                <span>
                  {selectedProduct.section} — {selectedProduct.name}
                  {!selectedProduct.is_static
                    ? ` (${selectedProduct.stock_qty} pcs left)`
                    : ""}
                </span>
              ) : (
                <span className="text-textSecondary">Select a product</span>
              )}
            </button>
            {showProductList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-control z-20 max-h-72 overflow-y-auto">
                <div className="relative p-2 border-b border-white/10 sticky top-0 bg-surface">
                  <Search className="w-4 h-4 text-textSecondary absolute left-5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-background border border-white/10 rounded-control pl-9 pr-3 py-2 text-sm"
                  />
                </div>
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductId(p.id);
                      setShowProductList(false);
                      setProductSearch("");
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 border-b border-white/5 last:border-b-0"
                  >
                    {p.section} — {p.name}
                    {!p.is_static ? ` (${p.stock_qty} pcs left)` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input
            label="Quantity"
            name="qty"
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="e.g. 3"
          />
          {selectedProduct && (
            <p className="text-xs text-textSecondary">
              MRP: ₹{selectedProduct.mrp_per_qty.toFixed(2)}/pc
            </p>
          )}
          <Input
            label={`Custom Rate Total (optional — default ₹${itemCalculatedTotal.toFixed(2)})`}
            name="itemCustomTotal"
            type="number"
            value={itemCustomTotal}
            onChange={(e) => setItemCustomTotal(e.target.value)}
            placeholder={itemCalculatedTotal.toFixed(2)}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button
            type="button"
            variant="secondary"
            onClick={addToCart}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add to Cart
          </Button>
        </div>
      </Card>

      {/* Billed Items table */}
      {cart.length > 0 && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">Billed Items</p>
          <div className="rounded-control border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 bg-background/40 border-b border-white/10 px-2 py-2 text-[10px] font-medium text-textSecondary">
              <div className="col-span-5">Item Name</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>
            {cart.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 items-center px-2 py-2 text-xs border-b border-white/5"
              >
                <div className="col-span-5 truncate">{item.productName}</div>
                <div className="col-span-2 text-right">{item.qty}</div>
                <div className="col-span-2 text-right">
                  ₹{item.rate.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-medium">
                  ₹{item.total.toFixed(2)}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => removeFromCart(i)}
                    className="text-textSecondary hover:text-danger"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-12 px-2 py-2.5 bg-surface text-sm font-bold">
              <div className="col-span-7">Total</div>
              <div className="col-span-5 text-right">
                ₹{cartTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Total / Received / Balance Due */}
      {cart.length > 0 && (
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
            <div className="w-28">
              <input
                type="number"
                disabled={!isReceived}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder={cartTotal.toFixed(2)}
                className="w-full text-right bg-surface border border-white/10 rounded-control px-2 py-1.5 text-sm disabled:opacity-40"
              />
            </div>
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
      )}

      {/* Payment Type + Description */}
      {cart.length > 0 && (
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
      )}

      {cart.length > 0 && (
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
      )}
    </div>
  );
}

export default Counter;
