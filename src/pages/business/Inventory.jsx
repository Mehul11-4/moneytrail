import { useState, useMemo } from "react";
import { Package, AlertTriangle, X, Pencil, Check, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useProducts } from "../../hooks/useProducts";
import { useProductTypes } from "../../hooks/useProductTypes";

// Low stock = less than 1 full Unit remaining (e.g. less than 1 Packet's worth)
// Full bar reference = 5 Units worth of stock, scaled per-product
const LOW_STOCK_UNITS = 1;
const FULL_BAR_UNITS = 5;

function Inventory() {
  const { products, loading, updateProduct, deleteProduct } = useProducts();
  const { productTypes } = useProductTypes();
  const [selected, setSelected] = useState(null); // product being viewed/edited
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const grouped = useMemo(() => {
    const map = {};
    productTypes.forEach((t) => (map[t.name] = []));
    products.forEach((p) => {
      const section = p.section || "Other";
      if (!map[section]) map[section] = [];
      map[section].push(p);
    });
    return map;
  }, [products, productTypes]);

  const openDetail = (p) => {
    setSelected(p);
    setIsEditing(false);
    setForm({
      name: p.name,
      unitLabel: p.unit_label,
      qtyPerUnit: p.qty_per_unit,
      unitPurchasePrice: p.unit_purchase_price,
      mrpPerQty: p.mrp_per_qty,
      stockQty: p.stock_qty,
    });
    setError("");
  };
  const closeDetail = () => {
    setSelected(null);
    setIsEditing(false);
    setConfirmingDelete(false);
  };

  const handleDelete = async () => {
    await deleteProduct(selected.id);
    closeDetail();
  };

  const handleSave = async () => {
    setError("");
    const qty = parseFloat(form.qtyPerUnit);
    const unitPrice = parseFloat(form.unitPurchasePrice);
    const mrp = parseFloat(form.mrpPerQty);
    const stock = parseFloat(form.stockQty);

    if (!form.name.trim()) return setError("Enter a product name.");
    if (!qty || qty <= 0)
      return setError("Qty per unit must be greater than 0.");
    if (!unitPrice || unitPrice <= 0)
      return setError("Enter a valid purchase price.");
    if (!mrp || mrp <= 0) return setError("Enter a valid MRP.");
    if (stock < 0 || isNaN(stock))
      return setError("Enter a valid stock quantity.");

    await updateProduct(selected.id, {
      name: form.name.trim(),
      unitLabel: form.unitLabel.trim(),
      qtyPerUnit: qty,
      unitPurchasePrice: unitPrice,
      mrpPerQty: mrp,
      stockQty: stock,
    });

    setIsEditing(false);
    closeDetail();
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-2">
        <Package className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Inventory</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">
        Tap any product for details or to edit. Stock updates automatically from
        Jama-Kharch and Sale Voucher.
      </p>

      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && products.length === 0 && (
        <p className="text-textSecondary text-sm">
          No products yet. Log a "Purchase Goods" entry in Jama-Kharch to add
          your first item.
        </p>
      )}

      {productTypes.map((t) => {
        const section = t.name;
        const items = grouped[section] || [];
        if (items.length === 0) return null;
        return (
          <div key={t.id} className="mb-5">
            <p className="text-sm font-heading font-bold text-primary mb-2">
              {section}
            </p>
            <div className="flex flex-col gap-3">
              {items.map((p) => {
                const isLow = p.stock_qty <= p.qty_per_unit * LOW_STOCK_UNITS;
                // Stock level as a fraction of "5 full Units" worth, scaled to THIS product's Unit size
                const fullBarQty = p.qty_per_unit * FULL_BAR_UNITS;
                const stockPct = Math.min(
                  100,
                  (p.stock_qty / fullBarQty) * 100,
                );
                const lineColor = isLow
                  ? "bg-danger"
                  : stockPct < 50
                    ? "bg-warning"
                    : "bg-success";

                return (
                  <button
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="text-left"
                  >
                    <Card className={isLow ? "border-warning/40" : ""}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-textSecondary">
                            1 {p.unit_label} = {p.qty_per_unit} pcs · Cost ₹
                            {p.price_per_qty.toFixed(2)}/pc · MRP ₹
                            {p.mrp_per_qty.toFixed(2)}/pc
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-textSecondary">
                          Stock remaining
                        </p>
                        <p
                          className={`font-heading font-bold ${isLow ? "text-warning" : "text-textPrimary"}`}
                        >
                          {p.stock_qty} pcs
                        </p>
                      </div>

                      {/* Animated stock level line */}
                      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${lineColor} transition-all duration-700 ease-out`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>

                      {isLow && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-warning">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Low stock — restock via Jama-Kharch
                        </div>
                      )}
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Detail / Edit Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">
                {isEditing ? "Edit Product" : "Product Details"}
              </p>
              <button onClick={closeDetail} className="text-textSecondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-3">
                <Input
                  label="Product Name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Unit Label"
                  name="unitLabel"
                  value={form.unitLabel}
                  onChange={(e) =>
                    setForm({ ...form, unitLabel: e.target.value })
                  }
                />
                <Input
                  label="Qty per Unit"
                  name="qtyPerUnit"
                  type="number"
                  value={form.qtyPerUnit}
                  onChange={(e) =>
                    setForm({ ...form, qtyPerUnit: e.target.value })
                  }
                />
                <Input
                  label="Purchase Price per Unit (₹)"
                  name="unitPurchasePrice"
                  type="number"
                  value={form.unitPurchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPurchasePrice: e.target.value })
                  }
                />
                <Input
                  label="MRP per Piece (₹)"
                  name="mrpPerQty"
                  type="number"
                  value={form.mrpPerQty}
                  onChange={(e) =>
                    setForm({ ...form, mrpPerQty: e.target.value })
                  }
                />
                <Input
                  label="Current Stock (pcs)"
                  name="stockQty"
                  type="number"
                  value={form.stockQty}
                  onChange={(e) =>
                    setForm({ ...form, stockQty: e.target.value })
                  }
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <DetailRow label="Section" value={selected.section} />
                <DetailRow label="Name" value={selected.name} />
                <DetailRow
                  label="Unit"
                  value={`1 ${selected.unit_label} = ${selected.qty_per_unit} pcs`}
                />
                <DetailRow
                  label="Purchase Price per Unit"
                  value={`₹${selected.unit_purchase_price.toFixed(2)}`}
                />
                <DetailRow
                  label="Cost per Piece"
                  value={`₹${selected.price_per_qty.toFixed(2)}`}
                />
                <DetailRow
                  label="MRP per Piece"
                  value={`₹${selected.mrp_per_qty.toFixed(2)}`}
                />
                <DetailRow
                  label="Current Stock"
                  value={`${selected.stock_qty} pcs`}
                />
                <DetailRow
                  label="Added On"
                  value={new Date(selected.created_at).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                />

                {confirmingDelete ? (
                  <div className="flex flex-col gap-2 border border-danger/30 rounded-control p-3">
                    <p className="text-sm text-danger font-medium">
                      Delete "{selected.name}" permanently? This won't affect
                      past sales history, but the product will no longer appear
                      in Inventory or Sale Voucher.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={handleDelete}
                        className="flex-1"
                      >
                        Yes, Delete
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmingDelete(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default Inventory;
