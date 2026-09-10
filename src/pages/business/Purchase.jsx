import { useState, useMemo } from "react";
import { ShoppingBag, Check, Search, Plus, X } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useProducts } from "../../hooks/useProducts";
import { usePurchases } from "../../hooks/usePurchases";
import { useProductTypes } from "../../hooks/useProductTypes";
import { usePersistedState } from "../../hooks/usePersistedState";

const paymentModes = ["Cash", "Online", "Credit"];

function Purchase() {
  const { products } = useProducts();
  const { productTypes } = useProductTypes();
  const { recordPurchase, recordMultiPurchase } = usePurchases();

  const todayStr = new Date().toISOString().split("T")[0];

  const [cart, setCart] = usePersistedState("cbn_purchase_cart", []);
  const [mode, setMode] = usePersistedState("cbn_purchase_mode", "existing");
  const [productId, setProductId] = usePersistedState(
    "cbn_purchase_productId",
    "",
  );
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [qty, setQty] = usePersistedState("cbn_purchase_qty", "");
  const [rate, setRate] = usePersistedState("cbn_purchase_rate", "");

  const [newSection, setNewSection] = usePersistedState(
    "cbn_purchase_newSection",
    "",
  );
  const [newName, setNewName] = usePersistedState("cbn_purchase_newName", "");
  const [newUnitLabel, setNewUnitLabel] = usePersistedState(
    "cbn_purchase_newUnitLabel",
    "",
  );
  const [newQtyPerUnit, setNewQtyPerUnit] = usePersistedState(
    "cbn_purchase_newQtyPerUnit",
    "",
  );
  const [newMrp, setNewMrp] = usePersistedState("cbn_purchase_newMrp", "");

  const [partyName, setPartyName] = usePersistedState(
    "cbn_purchase_partyName",
    "",
  );
  const [partyPhone, setPartyPhone] = usePersistedState(
    "cbn_purchase_partyPhone",
    "",
  );
  const [paymentMode, setPaymentMode] = usePersistedState(
    "cbn_purchase_paymentMode",
    "Cash",
  );
  const [purchaseDate, setPurchaseDate] = usePersistedState(
    "cbn_purchase_date",
    todayStr,
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

  const itemTotal = useMemo(() => {
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    if (!q || !r) return 0;
    return q * r;
  }, [qty, rate]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.total, 0),
    [cart],
  );

  const resetItemForm = () => {
    setMode("existing");
    setProductId("");
    setProductSearch("");
    setQty("");
    setRate("");
    setNewSection("");
    setNewName("");
    setNewUnitLabel("");
    setNewQtyPerUnit("");
    setNewMrp("");
  };

  const addToCart = () => {
    setError("");
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    if (!q || q <= 0) return setError("Enter a valid quantity.");
    if (!r || r <= 0) return setError("Enter a valid rate.");

    if (mode === "existing") {
      if (!selectedProduct) return setError("Select a product.");
      setCart((prev) => [
        ...prev,
        {
          isNewProduct: false,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          qty: q,
          rate: r,
          total: q * r,
        },
      ]);
    } else {
      const qtyPerUnit = parseFloat(newQtyPerUnit);
      const mrp = parseFloat(newMrp);
      if (!newSection) return setError("Select a product type.");
      if (!newName.trim()) return setError("Enter product name.");
      if (!newUnitLabel.trim()) return setError("Enter unit label.");
      if (!qtyPerUnit || qtyPerUnit <= 0)
        return setError("Enter valid qty per unit.");
      if (!mrp || mrp <= 0) return setError("Enter valid MRP.");
      setCart((prev) => [
        ...prev,
        {
          isNewProduct: true,
          newProductDetails: {
            section: newSection,
            name: newName.trim(),
            unitLabel: newUnitLabel.trim(),
            qtyPerUnit,
            mrpPerQty: mrp,
          },
          productName: newName.trim(),
          qty: q,
          rate: r,
          total: q * r,
        },
      ]);
    }
    resetItemForm();
  };

  const removeFromCart = (i) =>
    setCart((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setCart([]);
    resetItemForm();
    setPartyName("");
    setPartyPhone("");
    setPaymentMode("Cash");
    setPurchaseDate(todayStr);
    setError("");
  };

  const handleCompletePurchase = async () => {
    if (isSubmitting) return;
    setError("");
    if (cart.length === 0)
      return setError("Add at least one item to the cart.");

    setIsSubmitting(true);
    try {
      const meta = {
        partyName: partyName.trim() || null,
        partyPhone: partyPhone.trim() || null,
        paymentMode,
        purchaseDate,
      };
      if (cart.length === 1) {
        await recordPurchase(cart[0], meta);
      } else {
        await recordMultiPurchase(cart, meta);
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

      <Card>
        <p className="text-sm font-medium mb-3">Add Item</p>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex-1 py-2 rounded-control text-sm font-medium border ${mode === "existing" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
          >
            Restock Existing
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 py-2 rounded-control text-sm font-medium border ${mode === "new" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
          >
            New Product
          </button>
        </div>

        {mode === "existing" ? (
          <div className="flex flex-col gap-1.5 relative mb-3">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-textSecondary font-medium">
                Product Type
              </label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-sm"
              >
                <option value="">Select product type</option>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Product Name"
              name="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Gold Flake"
            />
            <Input
              label="Unit Label"
              name="newUnitLabel"
              value={newUnitLabel}
              onChange={(e) => setNewUnitLabel(e.target.value)}
              placeholder="e.g. Pack"
            />
            <Input
              label="Qty per Unit"
              name="newQtyPerUnit"
              type="number"
              value={newQtyPerUnit}
              onChange={(e) => setNewQtyPerUnit(e.target.value)}
              placeholder="e.g. 10"
            />
            <Input
              label="MRP per Piece (₹)"
              name="newMrp"
              type="number"
              value={newMrp}
              onChange={(e) => setNewMrp(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
        )}

        <Input
          label={
            mode === "existing"
              ? "Quantity (pieces)"
              : "Total Qty Purchased (pieces)"
          }
          name="qty"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="e.g. 50"
        />
        <div className="mt-3">
          <Input
            label="Rate (₹ per piece)"
            name="rate"
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 24.40"
          />
        </div>

        {itemTotal > 0 && (
          <p className="text-xs text-textSecondary mt-2">
            Item Total: ₹{itemTotal.toFixed(2)}
          </p>
        )}
        {error && <p className="text-danger text-sm mt-2">{error}</p>}

        <Button
          type="button"
          variant="secondary"
          onClick={addToCart}
          className="flex items-center justify-center gap-2 mt-3"
        >
          <Plus className="w-4 h-4" /> Add to Cart
        </Button>
      </Card>

      {cart.length > 0 && (
        <Card className="mt-4">
          <p className="text-sm font-medium mb-3">
            Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
          </p>
          <div className="flex flex-col gap-2 mb-3">
            {cart.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-b border-white/5 pb-2"
              >
                <p className="text-sm font-medium">
                  {item.productName} × {item.qty}
                </p>
                <div className="flex items-center gap-3">
                  <p className="font-heading font-bold text-sm">
                    ₹{item.total.toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeFromCart(i)}
                    className="text-textSecondary hover:text-danger"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Cart Total</p>
            <p className="text-xl font-heading font-bold text-danger">
              ₹{cartTotal.toFixed(2)}
            </p>
          </div>
        </Card>
      )}

      {cart.length > 0 && (
        <Card className="mt-4">
          <p className="text-sm font-medium mb-3">Complete Purchase</p>
          <div className="flex flex-col gap-3">
            <Input
              label="Party Name (optional)"
              name="partyName"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. Mahalaxmi Kirana"
            />
            <Input
              label="Party Phone (optional)"
              name="partyPhone"
              type="tel"
              value={partyPhone}
              onChange={(e) =>
                setPartyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="e.g. 9876543210"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-textSecondary font-medium">
                Payment Mode
              </label>
              <div className="flex gap-2">
                {paymentModes.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMode(value)}
                    className={`flex-1 py-2.5 rounded-control text-xs font-medium border ${paymentMode === value ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={purchaseDate}
              max={todayStr}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button
              variant="danger"
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
          </div>
        </Card>
      )}
    </div>
  );
}

export default Purchase;
