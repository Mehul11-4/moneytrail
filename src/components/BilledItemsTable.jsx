import { useState } from "react";
import { Search, X, Plus, Package } from "lucide-react";

function BilledItemsTable({
  items,
  setItems,
  products,
  allowNewProduct = false,
  productTypes = [],
}) {
  const [pickerRowIndex, setPickerRowIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newSection, setNewSection] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newQtyPerUnit, setNewQtyPerUnit] = useState("");
  const [newMrp, setNewMrp] = useState("");

  const updateRow = (index, updates) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const merged = { ...row, ...updates };
        merged.amount =
          (parseFloat(merged.qty) || 0) * (parseFloat(merged.rate) || 0);
        return merged;
      }),
    );
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: "",
        isStatic: false,
        qty: "",
        rate: "",
        amount: 0,
      },
    ]);
    setPickerRowIndex(items.length); // immediately open item picker for the new row
    setSearch("");
  };

  const removeRow = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const openPicker = (index) => {
    setPickerRowIndex(index);
    setSearch("");
  };

  const selectProduct = (product) => {
    updateRow(pickerRowIndex, {
      productId: product.id,
      productName: product.name,
      isStatic: product.is_static,
      rate: product.mrp_per_qty,
      qty: items[pickerRowIndex]?.qty || "1",
    });
    setPickerRowIndex(null);
  };

  const confirmNewProduct = () => {
    if (
      !newSection ||
      !newName.trim() ||
      !newUnitLabel.trim() ||
      !newQtyPerUnit
    )
      return;
    updateRow(pickerRowIndex, {
      productId: null,
      productName: newName.trim(),
      isStatic: false,
      isNewProduct: true,
      newProductDetails: {
        section: newSection,
        name: newName.trim(),
        unitLabel: newUnitLabel.trim(),
        qtyPerUnit: parseFloat(newQtyPerUnit),
        mrpPerQty: parseFloat(newMrp) || 0,
      },
      qty: items[pickerRowIndex]?.qty || "1",
    });
    setShowNewProductForm(false);
    setNewSection("");
    setNewName("");
    setNewUnitLabel("");
    setNewQtyPerUnit("");
    setNewMrp("");
    setPickerRowIndex(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      p.section.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const total = items.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div>
      <div className="rounded-control border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 bg-background/40 border-b border-white/10 px-2 py-2 text-[10px] font-medium text-textSecondary">
          <div className="col-span-5">Item Name</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>

        {items.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center px-1.5 py-1.5 text-xs border-b border-white/5 gap-1"
          >
            <button
              type="button"
              onClick={() => openPicker(i)}
              className="col-span-5 text-left px-1 py-1.5 truncate"
            >
              {row.productName || (
                <span className="text-textSecondary">Tap to select</span>
              )}
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={row.qty}
              onChange={(e) => updateRow(i, { qty: e.target.value })}
              placeholder="0"
              className="col-span-2 bg-surface border border-white/10 rounded px-1 py-1.5 text-right text-xs focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              inputMode="decimal"
              value={row.rate}
              onChange={(e) => updateRow(i, { rate: e.target.value })}
              placeholder="0"
              className="col-span-2 bg-surface border border-white/10 rounded px-1 py-1.5 text-right text-xs focus:outline-none focus:border-primary"
            />
            <div className="col-span-3 flex items-center justify-end gap-1.5">
              <span className="font-medium">
                ₹{(row.amount || 0).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-textSecondary hover:text-danger"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-12 px-2 py-2.5 bg-surface text-sm font-bold">
          <div className="col-span-9">Total</div>
          <div className="col-span-3 text-right">₹{total.toFixed(2)}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 text-primary text-sm font-medium border border-dashed border-primary/30 rounded-control"
      >
        <Plus className="w-4 h-4" /> Add Item
      </button>

      {/* Item picker — bottom sheet, opens with search focused */}
      {pickerRowIndex !== null && (
        <div
          className="fixed inset-0 bg-black/70 z-[90] flex items-end"
          onClick={() => setPickerRowIndex(null)}
        >
          <div
            className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-heading font-bold">
                {showNewProductForm ? "New Product" : "Select Item"}
              </p>
              <button
                onClick={() => {
                  setPickerRowIndex(null);
                  setShowNewProductForm(false);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showNewProductForm ? (
              <div className="flex flex-col gap-3 overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-textSecondary font-medium">
                    Product Type
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="bg-background border border-white/10 rounded-control px-3 py-2.5 text-sm"
                  >
                    <option value="">Select product type</option>
                    {productTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Product Name"
                  className="bg-background border border-white/10 rounded-control px-3 py-2.5 text-sm"
                />
                <input
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="Unit Label (e.g. Pack)"
                  className="bg-background border border-white/10 rounded-control px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  value={newQtyPerUnit}
                  onChange={(e) => setNewQtyPerUnit(e.target.value)}
                  placeholder="Qty per Unit"
                  className="bg-background border border-white/10 rounded-control px-3 py-2.5 text-sm"
                />
                <input
                  type="number"
                  value={newMrp}
                  onChange={(e) => setNewMrp(e.target.value)}
                  placeholder="MRP per Piece (₹)"
                  className="bg-background border border-white/10 rounded-control px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={confirmNewProduct}
                  className="bg-primary text-background rounded-control py-2.5 text-sm font-medium"
                >
                  Add This Product
                </button>
              </div>
            ) : (
              <>
                {allowNewProduct && (
                  <button
                    type="button"
                    onClick={() => setShowNewProductForm(true)}
                    className="w-full flex items-center gap-2 mb-3 px-3 py-2.5 rounded-control border border-dashed border-primary/40 text-primary text-sm font-medium"
                  >
                    <Package className="w-4 h-4" /> New Product (not in
                    inventory)
                  </button>
                )}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search items..."
                    className="w-full bg-background border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredProducts.length === 0 && (
                    <p className="text-textSecondary text-sm p-2">
                      No items found.
                    </p>
                  )}
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className="w-full text-left px-3 py-3 text-sm hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    >
                      {p.section} — {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BilledItemsTable;
