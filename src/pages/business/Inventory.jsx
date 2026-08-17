import { useState, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  X,
  Pencil,
  Check,
  Trash2,
  Search,
  Coffee,
  Plus,
} from "lucide-react";
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
  const { products, loading, updateProduct, deleteProduct, addProduct } =
    useProducts();
  const { productTypes } = useProductTypes();
  const [searchQuery, setSearchQuery] = useState("");
  const [showStaticForm, setShowStaticForm] = useState(false);
  const [staticSection, setStaticSection] = useState("");
  const [staticCost, setStaticCost] = useState("");
  const [staticMrp, setStaticMrp] = useState("");
  const [staticError, setStaticError] = useState("");

  const handleAddStatic = async (e) => {
    e.preventDefault();
    setStaticError("");
    const cost = parseFloat(staticCost);
    const mrp = parseFloat(staticMrp);
    if (!staticSection) return setStaticError("Select a product type.");
    if (!cost || cost <= 0) return setStaticError("Enter a valid cost price.");
    if (!mrp || mrp <= 0) return setStaticError("Enter a valid MRP.");

    await addProduct({
      isStatic: true,
      name: staticSection,
      section: staticSection,
      costPrice: cost,
      mrpPerQty: mrp,
    });

    setStaticSection("");
    setStaticCost("");
    setStaticMrp("");
    setShowStaticForm(false);
  };
  const [selected, setSelected] = useState(null); // product being viewed/edited
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.section.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const grouped = useMemo(() => {
    const map = {};
    productTypes.forEach((t) => (map[t.name] = []));
    filteredProducts.forEach((p) => {
      const section = p.section || "Other";
      if (!map[section]) map[section] = [];
      map[section].push(p);
    });
    return map;
  }, [filteredProducts, productTypes]);

  const openDetail = (p) => {
    setSelected(p);
    setIsEditing(false);
    if (p.is_static) {
      setForm({ costPrice: p.price_per_qty, mrpPerQty: p.mrp_per_qty });
    } else {
      setForm({
        name: p.name,
        unitLabel: p.unit_label,
        qtyPerUnit: p.qty_per_unit,
        unitPurchasePrice: p.unit_purchase_price,
        mrpPerQty: p.mrp_per_qty,
        stockQty: p.stock_qty,
      });
    }
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

    if (selected.is_static) {
      const cost = parseFloat(form.costPrice);
      const mrp = parseFloat(form.mrpPerQty);
      if (!cost || cost <= 0) return setError("Enter a valid cost price.");
      if (!mrp || mrp <= 0) return setError("Enter a valid MRP.");

      await updateProduct(selected.id, { costPrice: cost, mrpPerQty: mrp });
      setIsEditing(false);
      closeDetail();
      return;
    }

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
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <Button
        variant="secondary"
        onClick={() => setShowStaticForm(!showStaticForm)}
        className="w-full flex items-center justify-center gap-2 mb-4"
      >
        <Coffee className="w-4 h-4" /> Add Static Item (Chai, Coffee, etc.)
      </Button>

      {showStaticForm && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">New Static Item</p>
          <form onSubmit={handleAddStatic} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-textSecondary font-medium">
                Product Type
              </label>
              <select
                value={staticSection}
                onChange={(e) => setStaticSection(e.target.value)}
                className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
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
              label="Cost Price (₹)"
              name="staticCost"
              type="number"
              value={staticCost}
              onChange={(e) => setStaticCost(e.target.value)}
              placeholder="e.g. 5"
            />
            <Input
              label="MRP (₹)"
              name="staticMrp"
              type="number"
              value={staticMrp}
              onChange={(e) => setStaticMrp(e.target.value)}
              placeholder="e.g. 15"
            />
            {staticError && (
              <p className="text-danger text-sm">{staticError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="flex-1">
                Save Item
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowStaticForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                // Static products (Chai, Coffee) have no stock/unit tracking at all —
                // skip these calculations entirely for them.
                const isLow = p.is_static
                  ? false
                  : p.stock_qty <= p.qty_per_unit * LOW_STOCK_UNITS;
                const fullBarQty = p.is_static
                  ? 1
                  : p.qty_per_unit * FULL_BAR_UNITS;
                const stockPct = p.is_static
                  ? 0
                  : Math.min(100, (p.stock_qty / fullBarQty) * 100);
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
                    <Card
                      key={p.id}
                      className={
                        !p.is_static && isLow ? "border-warning/40" : ""
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.is_static ? (
                            <p className="text-xs text-textSecondary">
                              Cost ₹{p.price_per_qty.toFixed(2)} · MRP ₹
                              {p.mrp_per_qty.toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-xs text-textSecondary">
                              1 {p.unit_label} = {p.qty_per_unit} pcs · Cost ₹
                              {p.price_per_qty.toFixed(2)}/pc · MRP ₹
                              {p.mrp_per_qty.toFixed(2)}/pc
                            </p>
                          )}
                        </div>
                      </div>

                      {!p.is_static && (
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
                      )}

                      {!p.is_static && (
                        <>
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
                        </>
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
                {selected.is_static ? (
                  <>
                    <Input
                      label="Cost Price (₹)"
                      name="costPrice"
                      type="number"
                      value={form.costPrice}
                      onChange={(e) =>
                        setForm({ ...form, costPrice: e.target.value })
                      }
                    />
                    <Input
                      label="MRP (₹)"
                      name="mrpPerQty"
                      type="number"
                      value={form.mrpPerQty}
                      onChange={(e) =>
                        setForm({ ...form, mrpPerQty: e.target.value })
                      }
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Product Name"
                      name="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                  </>
                )}
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
