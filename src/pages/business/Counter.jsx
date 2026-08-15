import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Check,
  Banknote,
  Smartphone,
  HandCoins,
  Search,
} from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useProducts } from "../../hooks/useProducts";
import { useSales } from "../../hooks/useSales";

const paymentModes = [
  { value: "Cash", icon: Banknote },
  { value: "Online", icon: Smartphone },
  { value: "Udhaar", icon: HandCoins },
];

function Counter() {
  const { products, deductStock } = useProducts();
  const { sales, recordSale } = useSales();
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [qty, setQty] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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

  const total = useMemo(() => {
    const q = parseFloat(qty);
    if (!selectedProduct || !q || q <= 0) return 0;
    return q * selectedProduct.mrp_per_qty;
  }, [selectedProduct, qty]);

  const resetForm = () => {
    setProductId("");
    setQty("");
    setPaymentMode("Cash");
    setCustomerName("");
    setCustomerPhone("");
    setSaleDate(new Date().toISOString().split("T")[0]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const q = parseFloat(qty);

    if (!selectedProduct) return setError("Select a product.");
    if (!q || q <= 0) return setError("Enter a valid quantity.");
    if (q > selectedProduct.stock_qty) {
      return setError(
        `Only ${selectedProduct.stock_qty} pcs in stock — cannot sell ${q}.`,
      );
    }
    if (paymentMode === "Udhaar" && !customerName.trim()) {
      return setError("Customer name is required for Udhaar sales.");
    }
    if (paymentMode === "Udhaar" && !customerPhone.trim()) {
      return setError("Customer phone number is required for Udhaar sales.");
    }
    if (paymentMode === "Udhaar" && !/^\d{10}$/.test(customerPhone.trim())) {
      return setError("Enter a valid 10-digit phone number.");
    }
    await recordSale({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      qtySold: q,
      pricePerQtyAtSale: selectedProduct.price_per_qty,
      mrpAtSale: selectedProduct.mrp_per_qty,
      total: q * selectedProduct.mrp_per_qty,
      paymentMode,
      customerName: paymentMode === "Udhaar" ? customerName.trim() : null,
      customerPhone: paymentMode === "Udhaar" ? customerPhone.trim() : null,
      saleDate,
    });

    await deductStock(selectedProduct.id, q, selectedProduct.is_static);
    resetForm();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-6">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Sale Voucher</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  {selectedProduct.section} — {selectedProduct.name} (
                  {selectedProduct.stock_qty} pcs left)
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
                    {p.section} — {p.name} ({p.stock_qty} pcs left)
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

          <Input
            label="Sale Date"
            name="saleDate"
            type="date"
            value={saleDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setSaleDate(e.target.value)}
          />

          {selectedProduct && (
            <p className="text-xs text-textSecondary">
              MRP: ₹{selectedProduct.mrp_per_qty.toFixed(2)}/pc · In stock:{" "}
              {selectedProduct.stock_qty} pcs
            </p>
          )}

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

          <Card className="bg-background border-white/10">
            <p className="text-textSecondary text-xs mb-1">Total</p>
            <p className="text-3xl font-heading font-bold text-primary">
              ₹{total.toFixed(2)}
            </p>
          </Card>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button type="submit" variant="primary">
            {success ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Sale Recorded!
              </span>
            ) : (
              "Complete Sale"
            )}
          </Button>
        </form>
      </Card>

      {sales.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-textSecondary mb-2">
            Recent Sales
          </p>
          <div className="flex flex-col gap-2">
            {sales.slice(0, 5).map((sale) => (
              <Card key={sale.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {sale.productName} × {sale.qtySold}
                    </p>
                    <p className="text-xs text-textSecondary">
                      {formatDate(sale.date)} · {sale.time} · {sale.paymentMode}
                      {sale.customerName && ` · ${sale.customerName}`}
                    </p>
                  </div>
                  <p className="font-heading font-bold text-primary">
                    ₹{sale.total.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Counter;
