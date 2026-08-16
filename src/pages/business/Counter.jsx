import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Check,
  Banknote,
  Smartphone,
  HandCoins,
  Search,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useProducts } from "../../hooks/useProducts";
import { useSales } from "../../hooks/useSales";
import { formatDate } from "../../utils/formatDate";

const paymentModes = [
  { value: "Cash", icon: Banknote },
  { value: "Online", icon: Smartphone },
  { value: "Udhaar", icon: HandCoins },
];

function Counter() {
  const { products, deductStock } = useProducts();
  const { sales, recordSale, recordMultiSale } = useSales();

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySales = useMemo(
    () => sales.filter((s) => s.date === todayStr),
    [sales, todayStr],
  );
  const todayTotal = useMemo(
    () => todaySales.reduce((sum, s) => sum + s.total, 0),
    [todaySales],
  );

  // Group today's sales by transaction (so a multi-item cart sale shows as ONE block)
  const todayGrouped = useMemo(() => {
    const map = {};
    const order = [];
    todaySales.forEach((s) => {
      const key = s.transactionId || s.id;
      if (!map[key]) {
        map[key] = {
          key,
          items: [],
          total: 0,
          paymentMode: s.paymentMode,
          customerName: s.customerName,
          time: s.time,
          date: s.date,
        };
        order.push(key);
      }
      map[key].items.push(s);
      map[key].total += s.total;
    });
    return order.map((key) => map[key]);
  }, [todaySales]);

  // ---- Cart state ----
  const [cart, setCart] = useState([]); // { productId, productName, qty, mrpPerQty, pricePerQty, isStatic, customTotal }
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [itemCustomTotal, setItemCustomTotal] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(todayStr);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    if (
      itemCustomTotal.trim() !== "" &&
      (isNaN(parseFloat(itemCustomTotal)) || parseFloat(itemCustomTotal) <= 0)
    ) {
      return setError(
        "Enter a valid custom total for this item, or leave it blank.",
      );
    }

    setCart((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: q,
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

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCart([]);
    setProductId("");
    setQty("");
    setItemCustomTotal("");
    setPaymentMode("Cash");
    setCustomerName("");
    setCustomerPhone("");
    setSaleDate(todayStr);
    setError("");
  };

  const handleCompleteSale = async () => {
    setError("");
    if (cart.length === 0)
      return setError("Add at least one item to the cart.");
    if (paymentMode === "Udhaar" && !customerName.trim())
      return setError("Customer name is required for Udhaar sales.");
    if (paymentMode === "Udhaar" && !customerPhone.trim())
      return setError("Customer phone number is required for Udhaar sales.");
    if (paymentMode === "Udhaar" && !/^\d{10}$/.test(customerPhone.trim()))
      return setError("Enter a valid 10-digit phone number.");

    try {
      if (cart.length === 1) {
        const item = cart[0];
        await recordSale({
          productId: item.productId,
          productName: item.productName,
          qtySold: item.qty,
          pricePerQtyAtSale: item.pricePerQty,
          mrpAtSale: item.mrpPerQty,
          total: item.total,
          paymentMode,
          customerName: paymentMode === "Udhaar" ? customerName.trim() : null,
          customerPhone: paymentMode === "Udhaar" ? customerPhone.trim() : null,
          saleDate,
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
          {
            paymentMode,
            customerName: paymentMode === "Udhaar" ? customerName.trim() : null,
            customerPhone:
              paymentMode === "Udhaar" ? customerPhone.trim() : null,
            saleDate,
          },
        );
        for (const item of cart) {
          await deductStock(item.productId, item.qty, item.isStatic);
        }
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong completing this sale.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-4">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Sale Voucher</h1>
      </div>

      <Card className="mb-6 border-primary/30">
        <p className="text-textSecondary text-sm mb-1">Today's Total Sales</p>
        <p className="text-3xl font-heading font-bold text-primary">
          ₹{todayTotal.toFixed(2)}
        </p>
        <p className="text-xs text-textSecondary mt-1">
          {todayGrouped.length} transaction
          {todayGrouped.length !== 1 ? "s" : ""} today
        </p>
      </Card>

      <Card>
        <p className="text-sm font-medium mb-3">Add Item</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-textSecondary font-medium">
              Product
            </label>
            <button
              type="button"
              onClick={() => setShowProductList(!showProductList)}
              className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-left text-sm focus:outline-none"
            >
              {selectedProduct ? (
                <span className="text-textPrimary">
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
                    className="w-full bg-background border border-white/10 rounded-control pl-9 pr-3 py-2 text-textPrimary text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                {filteredProducts.length === 0 && (
                  <p className="text-textSecondary text-sm p-3">
                    No products found.
                  </p>
                )}
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
            placeholder="e.g. 3"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />

          {selectedProduct && (
            <p className="text-xs text-textSecondary">
              MRP: ₹{selectedProduct.mrp_per_qty.toFixed(2)}/pc
              {!selectedProduct.is_static
                ? ` · In stock: ${selectedProduct.stock_qty} pcs`
                : ""}
            </p>
          )}

          <Input
            label={`Custom Total for this item (optional — leave blank for ₹${itemCalculatedTotal.toFixed(2)})`}
            name="itemCustomTotal"
            type="number"
            placeholder={
              itemCalculatedTotal > 0
                ? itemCalculatedTotal.toFixed(2)
                : "e.g. 140"
            }
            value={itemCustomTotal}
            onChange={(e) => setItemCustomTotal(e.target.value)}
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
                <div>
                  <p className="text-sm font-medium">
                    {item.productName} × {item.qty}
                  </p>
                </div>
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
            <p className="text-xl font-heading font-bold text-primary">
              ₹{cartTotal.toFixed(2)}
            </p>
          </div>
        </Card>
      )}

      {cart.length > 0 && (
        <Card className="mt-4">
          <p className="text-sm font-medium mb-3">Complete Sale</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-textSecondary font-medium">
                Payment Mode
              </label>
              <div className="flex gap-2">
                {paymentModes.map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMode(value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-control text-xs font-medium border transition-colors ${
                      paymentMode === value
                        ? "bg-primary text-background border-primary"
                        : "bg-surface text-textPrimary border-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {paymentMode === "Udhaar" && (
              <>
                <Input
                  label="Customer Name"
                  name="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  required
                />
                <Input
                  label="Customer Phone Number"
                  name="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="e.g. 9876543210"
                  required
                />
              </>
            )}

            <Input
              label="Sale Date"
              name="saleDate"
              type="date"
              value={saleDate}
              max={todayStr}
              onChange={(e) => setSaleDate(e.target.value)}
            />

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button variant="primary" onClick={handleCompleteSale}>
              {success ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Sale Recorded!
                </span>
              ) : (
                `Complete Sale — ₹${cartTotal.toFixed(2)}`
              )}
            </Button>
          </div>
        </Card>
      )}

      {todayGrouped.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-textSecondary mb-2">
            Today's Sales
          </p>
          <div className="flex flex-col gap-2">
            {todayGrouped.slice(0, 15).map((group) => (
              <Card key={group.key}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs text-textSecondary">
                    {formatDate(group.date)} · {group.time} ·{" "}
                    {group.paymentMode}
                    {group.customerName && ` · ${group.customerName}`}
                  </p>
                  <p className="font-heading font-bold text-primary">
                    ₹{group.total.toFixed(2)}
                  </p>
                </div>
                {group.items.map((s) => (
                  <p key={s.id} className="text-xs text-textSecondary">
                    {s.productName} × {s.qtySold} — ₹{s.total.toFixed(2)}
                  </p>
                ))}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Counter;
